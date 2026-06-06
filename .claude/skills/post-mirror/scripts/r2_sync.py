"""R2 backup sync for the post-mirror SQLite file.

Subcommands:
  push   — upload the local mirror to R2 (whole-file PUT + SHA-256 verify,
           optional rolling daily snapshot)
  pull   — download the R2 mirror, refusing to overwrite a newer local
           without --force
  status — show local + remote object metadata side-by-side

Env (required for push / pull / status):
  R2_ACCOUNT_ID            — Cloudflare account ID for the R2 endpoint
  R2_BUCKET                — bucket name (e.g. cho-tsukuyomi-map-mirror)
  R2_ACCESS_KEY_ID         — S3-compatible access key
  R2_SECRET_ACCESS_KEY     — S3-compatible secret

Env (optional):
  R2_OBJECT_KEY            — main object key (default: mirror.sqlite)
  R2_RETAIN_DAILY_SNAPSHOTS — keep N rolling snapshots (default: 0 = off)
                              — at push time, also write snapshots/mirror-YYYY-MM-DD.sqlite
                              — and prune snapshots older than today-N+1 days
"""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _require_env() -> dict:
    """Read R2 env vars; raise if any required ones missing."""
    required = ("R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY")
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        raise RuntimeError(
            f"R2 env missing: {', '.join(missing)}. "
            f"See .env.example."
        )
    return {
        "account_id": os.environ["R2_ACCOUNT_ID"],
        "bucket": os.environ["R2_BUCKET"],
        "access_key": os.environ["R2_ACCESS_KEY_ID"],
        "secret_key": os.environ["R2_SECRET_ACCESS_KEY"],
        "object_key": os.environ.get("R2_OBJECT_KEY", "mirror.sqlite"),
        "retain_snapshots": int(os.environ.get("R2_RETAIN_DAILY_SNAPSHOTS", "0")),
    }


def _client(env: dict):
    """boto3 S3 client pointed at the R2 endpoint."""
    try:
        import boto3
    except ImportError as e:
        raise RuntimeError(
            "boto3 not installed — `pip install -r requirements.txt`"
        ) from e
    return boto3.client(
        "s3",
        endpoint_url=f"https://{env['account_id']}.r2.cloudflarestorage.com",
        aws_access_key_id=env["access_key"],
        aws_secret_access_key=env["secret_key"],
        region_name="auto",
    )


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _local_mtime_iso(path: Path) -> str:
    return datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )


def _remote_head(client, env: dict, key: str | None = None) -> dict | None:
    """HEAD an R2 object. Return {sha256, size, last_modified} or None if missing."""
    key = key or env["object_key"]
    try:
        head = client.head_object(Bucket=env["bucket"], Key=key)
    except Exception as e:
        # boto3 raises ClientError for 404; we coerce to None
        if "404" in str(e) or "NoSuchKey" in str(e) or "Not Found" in str(e):
            return None
        raise
    meta = head.get("Metadata") or {}
    return {
        "sha256": meta.get("sha256"),
        "size": head.get("ContentLength"),
        "last_modified": head.get("LastModified").strftime("%Y-%m-%dT%H:%M:%SZ")
                          if head.get("LastModified") else None,
    }


def push(mirror_path: Path) -> dict:
    """Upload mirror.sqlite to R2. Returns a result dict."""
    if not mirror_path.is_file():
        raise FileNotFoundError(f"mirror not found: {mirror_path}")
    env = _require_env()
    client = _client(env)
    sha = _sha256(mirror_path)
    size = mirror_path.stat().st_size

    with mirror_path.open("rb") as f:
        client.put_object(
            Bucket=env["bucket"],
            Key=env["object_key"],
            Body=f,
            Metadata={"sha256": sha},
        )

    # Round-trip verify: HEAD and compare sha
    head = _remote_head(client, env)
    if head is None or head.get("sha256") != sha:
        raise RuntimeError(
            f"R2 push verify failed: local sha={sha[:16]}... remote sha={head}"
        )

    result = {
        "uploaded": env["object_key"],
        "sha256": sha,
        "size": size,
    }

    # Snapshot path: keep N rolling daily snapshots if retention configured
    if env["retain_snapshots"] > 0:
        snap_key = f"snapshots/mirror-{time.strftime('%Y-%m-%d', time.gmtime())}.sqlite"
        with mirror_path.open("rb") as f:
            client.put_object(
                Bucket=env["bucket"],
                Key=snap_key,
                Body=f,
                Metadata={"sha256": sha},
            )
        pruned = _prune_snapshots(client, env)
        result["snapshot"] = snap_key
        result["pruned"] = pruned

    return result


def _prune_snapshots(client, env: dict) -> list[str]:
    """Delete snapshots older than today - retain_snapshots + 1 days."""
    n = env["retain_snapshots"]
    cutoff = (datetime.now(timezone.utc) - timedelta(days=n)).strftime("%Y-%m-%d")
    pruned = []
    paginator = client.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=env["bucket"], Prefix="snapshots/"):
        for obj in page.get("Contents") or []:
            key = obj["Key"]
            # snapshots/mirror-YYYY-MM-DD.sqlite
            try:
                date_part = key.split("mirror-")[1].split(".sqlite")[0]
            except IndexError:
                continue
            if date_part < cutoff:
                client.delete_object(Bucket=env["bucket"], Key=key)
                pruned.append(key)
    return pruned


def pull(mirror_path: Path, force: bool = False) -> dict:
    """Download R2 mirror.sqlite to local path. Refuse if local is newer
    unless force=True."""
    env = _require_env()
    client = _client(env)
    head = _remote_head(client, env)
    if head is None:
        raise FileNotFoundError(f"R2 object not found: {env['object_key']}")

    # Safety: if local exists AND has matching sha, no-op
    if mirror_path.is_file():
        local_sha = _sha256(mirror_path)
        if head.get("sha256") == local_sha:
            return {
                "status": "already-up-to-date",
                "sha256": local_sha,
            }
        # If local is newer than remote and sha differs, refuse without --force
        if not force:
            local_mtime = _local_mtime_iso(mirror_path)
            if head.get("last_modified") and local_mtime > head["last_modified"]:
                raise RuntimeError(
                    f"local mirror is newer ({local_mtime}) than R2 "
                    f"({head['last_modified']}). Pass --force to overwrite."
                )

    # Download to a temp file then atomic move
    mirror_path.parent.mkdir(parents=True, exist_ok=True)
    tmp = mirror_path.with_suffix(mirror_path.suffix + ".pulling")
    client.download_file(env["bucket"], env["object_key"], str(tmp))
    new_sha = _sha256(tmp)
    if head.get("sha256") and head["sha256"] != new_sha:
        tmp.unlink(missing_ok=True)
        raise RuntimeError(
            f"R2 pull verify failed: header sha={head['sha256'][:16]}... "
            f"download sha={new_sha[:16]}..."
        )
    tmp.replace(mirror_path)
    return {
        "status": "downloaded",
        "sha256": new_sha,
        "size": mirror_path.stat().st_size,
    }


def status(mirror_path: Path) -> dict:
    """Compare local + remote metadata. Returns a dict, never raises (best-effort)."""
    env = _require_env()
    client = _client(env)
    local = {"exists": mirror_path.is_file()}
    if local["exists"]:
        local["sha256"] = _sha256(mirror_path)
        local["size"] = mirror_path.stat().st_size
        local["mtime"] = _local_mtime_iso(mirror_path)
    try:
        remote = _remote_head(client, env)
    except Exception as e:
        remote = {"error": str(e)[:200]}
    return {
        "mirror_path": str(mirror_path),
        "object_key": env["object_key"],
        "bucket": env["bucket"],
        "local": local,
        "remote": remote,
        "in_sync": (
            local.get("exists")
            and isinstance(remote, dict)
            and remote.get("sha256") == local.get("sha256")
        ),
    }


def _default_mirror() -> Path:
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import storage
    return storage.default_mirror_path()


def main():
    import json
    p = argparse.ArgumentParser(
        description="R2 backup sync for the post-mirror SQLite file."
    )
    p.add_argument("--mirror", default=None,
                   help="Path to mirror.sqlite (default: $CWD/.x-api-data/mirror.sqlite)")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("push", help="Upload local mirror → R2")
    pull_p = sub.add_parser("pull", help="Download R2 → local mirror")
    pull_p.add_argument("--force", action="store_true",
                        help="Override the newer-local refusal")
    sub.add_parser("status", help="Show local vs remote metadata")

    args = p.parse_args()
    mirror = Path(args.mirror) if args.mirror else _default_mirror()

    try:
        if args.cmd == "push":
            result = push(mirror)
        elif args.cmd == "pull":
            result = pull(mirror, force=args.force)
        elif args.cmd == "status":
            result = status(mirror)
        else:
            print(f"unknown cmd: {args.cmd}", file=sys.stderr)
            sys.exit(2)
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False, indent=2),
              file=sys.stderr)
        sys.exit(1)

    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0)


if __name__ == "__main__":
    main()

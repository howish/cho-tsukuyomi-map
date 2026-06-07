#!/usr/bin/env python3
"""Thin R2 (Cloudflare object-storage) client — importable + CLI.

Replaces inline boto3 client setup that was duplicated across
apply-issue.py and ad-hoc patch scripts. Reads credentials from
~/.bashrc (R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).

Usage (CLI):
  scripts/r2_upload.py <local-file> <r2-key>
  scripts/r2_upload.py --delete <r2-key>

Usage (import):
  from r2_upload import client, upload, delete, CDN_BASE
  s3 = client()
  url = upload(s3, '/tmp/x.jpg', 'cho-tsukuyomi-map/.../1.jpg')
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path


R2_ENDPOINT = 'https://4662c50948d1cc7d260c159b4d666df7.r2.cloudflarestorage.com'
R2_BUCKET = 'yachi8000-images'
CDN_BASE = 'https://images.yachi8000.app'


def _load_creds_from_bashrc() -> None:
    """Populate R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY env from ~/.bashrc if missing."""
    if os.environ.get('R2_ACCESS_KEY_ID') and os.environ.get('R2_SECRET_ACCESS_KEY'):
        return
    bashrc = Path.home() / '.bashrc'
    if not bashrc.exists():
        return
    for line in bashrc.read_text().splitlines():
        m = re.match(r'export (R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY)="([^"]+)"', line)
        if m and not os.environ.get(m.group(1)):
            os.environ[m.group(1)] = m.group(2)


def client():
    """Returns a boto3 S3 client configured for R2."""
    import boto3
    from botocore.client import Config
    _load_creds_from_bashrc()
    missing = [k for k in ('R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY')
               if not os.environ.get(k)]
    if missing:
        raise RuntimeError(
            f'Missing env vars: {missing}. '
            'Set them in ~/.bashrc as: export R2_ACCESS_KEY_ID="..."'
        )
    return boto3.client(
        's3',
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=os.environ['R2_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['R2_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4'),
        region_name='auto',
    )


def upload(s3, local: str | Path, key: str) -> str:
    """Upload a local file to R2 with sensible defaults. Returns the CDN URL."""
    local = Path(local)
    ext = local.suffix.lower()
    ct = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.webp': 'image/webp',
        '.gif': 'image/gif',
    }.get(ext, 'application/octet-stream')
    s3.upload_file(
        str(local), R2_BUCKET, key,
        ExtraArgs={
            'ContentType': ct,
            'CacheControl': 'public, max-age=31536000, immutable',
        },
    )
    return f'{CDN_BASE}/{key}'


def delete(s3, key: str) -> None:
    """Delete an object from R2."""
    s3.delete_object(Bucket=R2_BUCKET, Key=key)


def key_from_cdn_url(url: str) -> str | None:
    """Extract the R2 object key from a CDN URL (strips ?v= query)."""
    m = re.match(rf'{re.escape(CDN_BASE)}/([^?]+)', url)
    return m.group(1) if m else None


def main():
    p = argparse.ArgumentParser(description='R2 upload / delete helper')
    sub = p.add_subparsers(dest='cmd', required=False)

    up = sub.add_parser('upload', help='Upload a local file (default)')
    up.add_argument('local', help='Local file path')
    up.add_argument('key', help='R2 object key (path without bucket prefix)')

    rm = sub.add_parser('delete', help='Delete an R2 object')
    rm.add_argument('key', help='R2 object key')

    # Allow positional `<local> <key>` to default to "upload"
    p.add_argument('args', nargs='*', help=argparse.SUPPRESS)
    ns = p.parse_args()

    s3 = client()
    if ns.cmd == 'delete':
        delete(s3, ns.key)
        print(f'deleted: {ns.key}')
        return
    if ns.cmd == 'upload':
        url = upload(s3, ns.local, ns.key)
        print(url)
        return
    if len(ns.args) == 2:
        url = upload(s3, ns.args[0], ns.args[1])
        print(url)
        return
    p.print_help()
    sys.exit(2)


if __name__ == '__main__':
    main()

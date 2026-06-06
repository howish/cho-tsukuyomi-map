"""post-mirror storage layer — multi-platform local SQLite SSOT for fetched posts.

Schema is multi-platform from day one (per howish 2026-06-06 decision):
posts / users / user_snapshots / media / pull_state each carry a `platform`
column and use composite `(platform, id)` primary keys. Only the X code path
is implemented in pull / triage / query callers; Plurk / Threads / FB code
paths can plug in later without schema migration.
"""

from __future__ import annotations

import json
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path

SCHEMA_VERSION = 1

# Field set tracked in user_snapshots — used by upsert_user to decide whether
# a new snapshot row is needed (de-dup against unchanged observations).
TRACKED_USER_FIELDS = ("name", "bio", "follower_count", "following_count", "verified")


def default_mirror_path() -> Path:
    """Default mirror path inside the current working directory's
    `.x-api-data/` (gitignored). Callers can override per connect()."""
    return Path.cwd() / ".x-api-data" / "mirror.sqlite"


def connect(path: Path | str | None = None) -> sqlite3.Connection:
    """Open the mirror, apply pragmas, run migrations, return a connection.

    Caller owns the connection (close it when done). We turn on WAL +
    NORMAL synchronous + foreign keys; all small but together make the file
    robust under interrupted writes while staying fast enough for bulk
    inserts.
    """
    if path is None:
        path = default_mirror_path()
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA foreign_keys = ON")
    _migrate(conn)
    return conn


def _migrate(conn: sqlite3.Connection) -> None:
    cur = conn.cursor()
    user_version = cur.execute("PRAGMA user_version").fetchone()[0]
    if user_version >= SCHEMA_VERSION:
        return
    if user_version < 1:
        _apply_v1(conn)
    cur.execute(f"PRAGMA user_version = {SCHEMA_VERSION}")
    conn.commit()


def _apply_v1(conn: sqlite3.Connection) -> None:
    """Schema v1: multi-platform SSOT + user history + FTS5."""
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS posts (
            id TEXT NOT NULL,
            platform TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            text TEXT NOT NULL,
            in_reply_to_user_id TEXT,
            raw_json TEXT NOT NULL,
            fetched_at TEXT NOT NULL,
            PRIMARY KEY (platform, id)
        );

        CREATE INDEX IF NOT EXISTS idx_posts_user_time
            ON posts (platform, user_id, created_at DESC);

        CREATE TABLE IF NOT EXISTS users (
            id TEXT NOT NULL,
            platform TEXT NOT NULL,
            username TEXT NOT NULL,
            name TEXT,
            bio TEXT,
            follower_count INTEGER,
            following_count INTEGER,
            verified INTEGER,
            raw_json TEXT NOT NULL,
            fetched_at TEXT NOT NULL,
            PRIMARY KEY (platform, id),
            UNIQUE (platform, username)
        );

        CREATE TABLE IF NOT EXISTS user_snapshots (
            rowid INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            fetched_at TEXT NOT NULL,
            name TEXT,
            bio TEXT,
            follower_count INTEGER,
            following_count INTEGER,
            verified INTEGER,
            raw_json TEXT NOT NULL,
            UNIQUE (user_id, platform, fetched_at),
            FOREIGN KEY (platform, user_id) REFERENCES users (platform, id)
        );

        CREATE INDEX IF NOT EXISTS idx_snapshots_user_time
            ON user_snapshots (user_id, fetched_at DESC);

        CREATE TABLE IF NOT EXISTS media (
            media_key TEXT NOT NULL,
            platform TEXT NOT NULL,
            post_id TEXT NOT NULL,
            type TEXT NOT NULL,
            url TEXT,
            raw_json TEXT NOT NULL,
            PRIMARY KEY (platform, media_key),
            FOREIGN KEY (platform, post_id) REFERENCES posts (platform, id)
        );

        CREATE TABLE IF NOT EXISTS pull_state (
            user_id TEXT NOT NULL,
            platform TEXT NOT NULL,
            last_pull_iso TEXT NOT NULL,
            last_post_id TEXT,
            silent_streak INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (platform, user_id),
            FOREIGN KEY (platform, user_id) REFERENCES users (platform, id)
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5 (
            text,
            content='posts',
            content_rowid='rowid'
        );

        CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
            INSERT INTO posts_fts (rowid, text) VALUES (new.rowid, new.text);
        END;

        CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
            UPDATE posts_fts SET text = new.text WHERE rowid = new.rowid;
        END;

        CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
            DELETE FROM posts_fts WHERE rowid = old.rowid;
        END;
        """
    )


@contextmanager
def transaction(conn: sqlite3.Connection):
    """`with transaction(conn): ...` — explicit transaction wrap."""
    try:
        yield
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def upsert_user(
    conn: sqlite3.Connection,
    platform: str,
    raw: dict,
    fetched_at: str | None = None,
) -> str:
    """Insert or update a user row + append a user_snapshots row when
    any tracked field differs from the most recent snapshot.

    Returns the user's id.

    `raw` is expected to be the X API v2 user object (or equivalent for
    other platforms). Required fields: id, username. Optional fields used
    when present: name, description (X-style bio), public_metrics
    (follower_count + following_count), verified.
    """
    user_id = str(raw["id"])
    username = raw["username"]
    name = raw.get("name")
    bio = raw.get("description") or raw.get("bio")
    pm = raw.get("public_metrics") or {}
    follower_count = pm.get("followers_count") or pm.get("follower_count")
    following_count = pm.get("following_count")
    verified_raw = raw.get("verified")
    verified = 1 if verified_raw else (0 if verified_raw is False else None)
    fetched_at = fetched_at or _now_iso()
    raw_json = json.dumps(raw, ensure_ascii=False, sort_keys=True)

    with transaction(conn):
        cur = conn.cursor()
        # Check whether the new observation differs from the most recent
        # snapshot. If no prior row exists, we always insert one. If the
        # prior row's tracked fields are byte-equal to the new ones, we
        # skip the snapshot insert (de-dup).
        prior = cur.execute(
            """
            SELECT name, bio, follower_count, following_count, verified
            FROM user_snapshots
            WHERE user_id = ? AND platform = ?
            ORDER BY fetched_at DESC LIMIT 1
            """,
            (user_id, platform),
        ).fetchone()
        snapshot_needed = (
            prior is None
            or prior["name"] != name
            or prior["bio"] != bio
            or prior["follower_count"] != follower_count
            or prior["following_count"] != following_count
            or prior["verified"] != verified
        )

        # Upsert the current-state row in users.
        cur.execute(
            """
            INSERT INTO users
              (id, platform, username, name, bio, follower_count,
               following_count, verified, raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (platform, id) DO UPDATE SET
              username = excluded.username,
              name = excluded.name,
              bio = excluded.bio,
              follower_count = excluded.follower_count,
              following_count = excluded.following_count,
              verified = excluded.verified,
              raw_json = excluded.raw_json,
              fetched_at = excluded.fetched_at
            """,
            (user_id, platform, username, name, bio, follower_count,
             following_count, verified, raw_json, fetched_at),
        )

        if snapshot_needed:
            # ON CONFLICT IGNORE: during a bulk import we may upsert the
            # same user multiple times from different source files that
            # share an mtime (raw dumps from the same minute). Per
            # (user_id, platform, fetched_at) uniqueness, the first
            # snapshot wins — that matches the spirit of the dedup rule.
            cur.execute(
                """
                INSERT INTO user_snapshots
                  (user_id, platform, fetched_at, name, bio,
                   follower_count, following_count, verified, raw_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (user_id, platform, fetched_at) DO NOTHING
                """,
                (user_id, platform, fetched_at, name, bio, follower_count,
                 following_count, verified, raw_json),
            )

    return user_id


def upsert_post(
    conn: sqlite3.Connection,
    platform: str,
    raw: dict,
    fetched_at: str | None = None,
) -> str:
    """Insert or update a post row. Returns post id."""
    post_id = str(raw["id"])
    user_id = str(raw.get("author_id") or raw.get("user_id"))
    created_at = raw["created_at"]
    text = raw.get("text") or raw.get("content") or ""
    in_reply_to = raw.get("in_reply_to_user_id")
    fetched_at = fetched_at or _now_iso()
    raw_json = json.dumps(raw, ensure_ascii=False, sort_keys=True)

    with transaction(conn):
        conn.execute(
            """
            INSERT INTO posts
              (id, platform, user_id, created_at, text, in_reply_to_user_id,
               raw_json, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (platform, id) DO UPDATE SET
              user_id = excluded.user_id,
              created_at = excluded.created_at,
              text = excluded.text,
              in_reply_to_user_id = excluded.in_reply_to_user_id,
              raw_json = excluded.raw_json,
              fetched_at = excluded.fetched_at
            """,
            (post_id, platform, user_id, created_at, text, in_reply_to,
             raw_json, fetched_at),
        )

    return post_id


def upsert_media(
    conn: sqlite3.Connection,
    platform: str,
    raw: dict,
    post_id: str,
) -> str:
    """Insert or update a media row. Returns media_key."""
    media_key = raw["media_key"]
    media_type = raw["type"]
    url = raw.get("url") or raw.get("preview_image_url")
    raw_json = json.dumps(raw, ensure_ascii=False, sort_keys=True)

    with transaction(conn):
        conn.execute(
            """
            INSERT INTO media (media_key, platform, post_id, type, url, raw_json)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT (platform, media_key) DO UPDATE SET
              post_id = excluded.post_id,
              type = excluded.type,
              url = excluded.url,
              raw_json = excluded.raw_json
            """,
            (media_key, platform, post_id, media_type, url, raw_json),
        )

    return media_key


def get_pull_state(
    conn: sqlite3.Connection,
    platform: str,
    user_id: str,
) -> dict | None:
    """Return {last_pull_iso, last_post_id, silent_streak} or None if no row."""
    row = conn.execute(
        """
        SELECT last_pull_iso, last_post_id, silent_streak
        FROM pull_state WHERE platform = ? AND user_id = ?
        """,
        (platform, user_id),
    ).fetchone()
    if row is None:
        return None
    return {
        "last_pull_iso": row["last_pull_iso"],
        "last_post_id": row["last_post_id"],
        "silent_streak": row["silent_streak"],
    }


def set_pull_state(
    conn: sqlite3.Connection,
    platform: str,
    user_id: str,
    last_pull_iso: str,
    last_post_id: str | None,
    silent_streak: int,
) -> None:
    with transaction(conn):
        conn.execute(
            """
            INSERT INTO pull_state
              (platform, user_id, last_pull_iso, last_post_id, silent_streak)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (platform, user_id) DO UPDATE SET
              last_pull_iso = excluded.last_pull_iso,
              last_post_id = excluded.last_post_id,
              silent_streak = excluded.silent_streak
            """,
            (platform, user_id, last_pull_iso, last_post_id, silent_streak),
        )


def find_user_by_username(
    conn: sqlite3.Connection,
    platform: str,
    username: str,
) -> dict | None:
    """Case-insensitive lookup. X handles are case-preserving but case-
    insensitive in lookup; we extend the same convention to all platforms
    so that callers can pass whatever capitalization the URL had without
    worrying whether the canonical form matches."""
    row = conn.execute(
        """
        SELECT id, platform, username, name, bio, follower_count,
               following_count, verified, fetched_at
        FROM users WHERE platform = ? AND LOWER(username) = LOWER(?)
        """,
        (platform, username),
    ).fetchone()
    if row is None:
        return None
    return dict(row)


def get_user_snapshots(
    conn: sqlite3.Connection,
    platform: str,
    user_id: str,
    since: str | None = None,
):
    """Returns list of snapshot rows for a user, newest first.
    Optional `since` (ISO timestamp) filters to snapshots at-or-after that time."""
    if since:
        rows = conn.execute(
            """
            SELECT * FROM user_snapshots
            WHERE platform = ? AND user_id = ? AND fetched_at >= ?
            ORDER BY fetched_at DESC
            """,
            (platform, user_id, since),
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT * FROM user_snapshots
            WHERE platform = ? AND user_id = ?
            ORDER BY fetched_at DESC
            """,
            (platform, user_id),
        ).fetchall()
    return [dict(r) for r in rows]

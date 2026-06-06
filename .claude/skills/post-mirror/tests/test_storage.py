"""Unit tests for post-mirror storage layer — uses in-memory SQLite."""

import sqlite3
import sys
from pathlib import Path

# Allow running from the skill directory directly.
sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import storage  # noqa: E402


def _memory_conn():
    """Open an in-memory mirror, run migrations. Wraps storage.connect's
    setup but skips the file-path bit."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    conn.execute("PRAGMA foreign_keys = ON")
    storage._apply_v1(conn)
    conn.execute(f"PRAGMA user_version = {storage.SCHEMA_VERSION}")
    return conn


def sample_user(username="testuser", follower_count=1000):
    return {
        "id": "u1",
        "username": username,
        "name": "Test User",
        "description": "Test bio",
        "public_metrics": {
            "followers_count": follower_count,
            "following_count": 100,
        },
        "verified": False,
    }


def sample_post(id="p1", user_id="u1", text="Hello 新刊"):
    return {
        "id": id,
        "author_id": user_id,
        "created_at": "2026-06-06T00:00:00Z",
        "text": text,
    }


def sample_media(media_key="m1"):
    return {
        "media_key": media_key,
        "type": "photo",
        "url": "https://example.com/x.jpg",
    }


def test_schema_has_all_tables():
    conn = _memory_conn()
    tables = {
        r["name"] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
    }
    assert "posts" in tables
    assert "users" in tables
    assert "user_snapshots" in tables
    assert "media" in tables
    assert "pull_state" in tables
    assert "posts_fts" in tables


def test_upsert_post_idempotent():
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user())
    storage.upsert_post(conn, "x", sample_post())
    storage.upsert_post(conn, "x", sample_post())  # second time
    rows = conn.execute("SELECT COUNT(*) AS n FROM posts").fetchone()
    assert rows["n"] == 1


def test_fts_finds_post_by_keyword():
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user())
    storage.upsert_post(conn, "x", sample_post(text="新刊『あらすじ』"))
    storage.upsert_post(conn, "x", sample_post(id="p2", text="お品書きできた"))
    storage.upsert_post(conn, "x", sample_post(id="p3", text="無関係なポスト"))
    rows = conn.execute(
        "SELECT p.id FROM posts p JOIN posts_fts f ON f.rowid = p.rowid "
        "WHERE posts_fts MATCH '新刊'"
    ).fetchall()
    assert {r["id"] for r in rows} == {"p1"}


def test_snapshot_dedup_same_fields():
    """Per howish 2026-06-06: only append a snapshot row when a tracked
    field actually changed. Two identical upserts → 1 snapshot row."""
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user())
    storage.upsert_user(conn, "x", sample_user())  # identical re-upsert
    snapshots = conn.execute(
        "SELECT * FROM user_snapshots WHERE user_id = ? AND platform = ?",
        ("u1", "x"),
    ).fetchall()
    assert len(snapshots) == 1


def test_snapshot_appends_on_change():
    """Same user, different follower_count → 2 snapshot rows."""
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user(follower_count=1000),
                         fetched_at="2026-06-01T00:00:00Z")
    storage.upsert_user(conn, "x", sample_user(follower_count=1010),
                         fetched_at="2026-06-02T00:00:00Z")
    snapshots = conn.execute(
        "SELECT follower_count, fetched_at FROM user_snapshots "
        "WHERE user_id = ? AND platform = ? ORDER BY fetched_at",
        ("u1", "x"),
    ).fetchall()
    assert [s["follower_count"] for s in snapshots] == [1000, 1010]


def test_pull_state_roundtrip():
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user())
    storage.set_pull_state(conn, "x", "u1",
                          last_pull_iso="2026-06-06T00:00:00Z",
                          last_post_id="p99",
                          silent_streak=2)
    state = storage.get_pull_state(conn, "x", "u1")
    assert state == {
        "last_pull_iso": "2026-06-06T00:00:00Z",
        "last_post_id": "p99",
        "silent_streak": 2,
    }


def test_media_idempotent_and_post_fk():
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user())
    storage.upsert_post(conn, "x", sample_post())
    storage.upsert_media(conn, "x", sample_media(), post_id="p1")
    storage.upsert_media(conn, "x", sample_media(), post_id="p1")
    n = conn.execute("SELECT COUNT(*) AS n FROM media").fetchone()["n"]
    assert n == 1


def test_find_user_by_username():
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user(username="RinHuei"))
    found = storage.find_user_by_username(conn, "x", "RinHuei")
    assert found is not None
    assert found["id"] == "u1"
    assert storage.find_user_by_username(conn, "x", "nonexistent") is None


def test_multi_platform_isolation():
    """Same id under different platforms = two distinct rows."""
    conn = _memory_conn()
    storage.upsert_user(conn, "x", sample_user(username="alice"))
    storage.upsert_user(conn, "plurk", sample_user(username="alice"))
    n = conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"]
    assert n == 2


if __name__ == "__main__":
    # Simple test runner so we don't need pytest installed.
    tests = [v for n, v in globals().items() if n.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
        except Exception as e:
            print(f"  ✗ {t.__name__}: {e}")
            failed += 1
    print(f"\n{len(tests)} tests, {failed} failed")
    sys.exit(1 if failed else 0)

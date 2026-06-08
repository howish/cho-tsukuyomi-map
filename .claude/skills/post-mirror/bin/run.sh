#!/usr/bin/env bash
# post-mirror skill entry point — self-locating wrapper that delegates to
# the appropriate Python script under ../scripts/.
#
# Usage:
#   post-mirror pull <username> [--mirror path] [--force-full] [--limit N]
#   post-mirror query <triage|diff|search|body> [...]
#   post-mirror r2 <push|pull|status> [--mirror path] [--force]
#   post-mirror storage init [--mirror path]
#   post-mirror tests              # run unit tests
#   post-mirror help

set -euo pipefail

SELF="$(readlink -f "$0")"
BIN_DIR="$(dirname "$SELF")"
SKILL_DIR="$(dirname "$BIN_DIR")"
SCRIPTS_DIR="$SKILL_DIR/scripts"
TESTS_DIR="$SKILL_DIR/tests"

cmd="${1:-help}"
shift || true

case "$cmd" in
  pull)
    # Optional --platform <name> selects a non-X incremental fetcher.
    # Default (no flag or --platform x) routes to incremental.py.
    plat="x"
    args=()
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --platform)
          plat="$2"; shift 2 ;;
        *)
          args+=("$1"); shift ;;
      esac
    done
    case "$plat" in
      x)       exec python3 "$SCRIPTS_DIR/incremental.py"          "${args[@]:-}" ;;
      plurk)   exec python3 "$SCRIPTS_DIR/incremental_plurk.py"    "${args[@]:-}" ;;
      threads) exec python3 "$SCRIPTS_DIR/incremental_threads.py"  "${args[@]:-}" ;;
      *)
        echo "unknown platform: $plat (supported: x, plurk, threads)" >&2
        exit 2
        ;;
    esac
    ;;
  query)
    exec python3 "$SCRIPTS_DIR/query.py" "$@"
    ;;
  r2)
    exec python3 "$SCRIPTS_DIR/r2_sync.py" "$@"
    ;;
  storage)
    sub="${1:-help}"
    shift || true
    case "$sub" in
      init)
        # Convenience: connect creates an empty mirror if absent.
        python3 -c "
import sys; sys.path.insert(0, '$SCRIPTS_DIR')
import storage
path = None
args = '$*'.strip().split()
if args and args[0] == '--mirror':
  path = args[1]
conn = storage.connect(path)
conn.close()
print('mirror initialized:', path or storage.default_mirror_path())
"
        ;;
      *)
        echo "Usage: post-mirror storage init [--mirror path]" >&2
        exit 1
        ;;
    esac
    ;;
  tests)
    exec python3 "$TESTS_DIR/test_storage.py"
    ;;
  help|--help|-h|"")
    cat <<EOF
post-mirror — local SQLite SSOT for fetched social posts (cost-efficient
incremental recon across X / Plurk / Threads).

Usage:
  post-mirror pull <username> [--platform x|plurk|threads] [--mirror PATH]
                              [--limit N] [--force-full] [--back-off-threshold N]
  post-mirror query triage --usernames @a,@b [--keywords k1,k2] [--json]
  post-mirror query diff --since <iso> [--usernames ...] [--fetched-since]
  post-mirror query search '<keywords>' [--username @x] [--limit N]
  post-mirror query body --username @x [--buckets <json>] [--limit N]
                         [--event <slug>] [--events-json PATH]
  post-mirror r2 push|pull|status [--mirror PATH] [--force]
  post-mirror storage init [--mirror PATH]
  post-mirror tests
  post-mirror help

Notes:
  - Mirror lives at \$CWD/.x-api-data/mirror.sqlite by default (gitignored)
  - X path: incremental fetch via x-api skill, pull_state.last_pull_iso → start_time
  - Plurk path: profile DOM scrape via plurk-scraper (visible page only,
    pagination not yet supported — dedup on (platform, id) makes re-runs
    idempotent)
  - Threads path: profile DOM scrape via threads-scraper (same as Plurk;
    approximates created_at = fetched_at since profile DOM doesn't
    expose per-post timestamps — see incremental_threads.py header)
  - Silent-streak back-off (≥3 + ≥7 days) auto-skips inactive users on
    all platforms
  - --force-full bypasses back-off but does NOT reset streak (per spec)
  - CJK query keywords use LIKE fallback (FTS5 unicode61 doesn't split CJK)
  - R2 sync requires env: R2_ACCOUNT_ID / R2_BUCKET / R2_ACCESS_KEY_ID /
    R2_SECRET_ACCESS_KEY (+ optional R2_OBJECT_KEY, R2_RETAIN_DAILY_SNAPSHOTS)
EOF
    ;;
  *)
    echo "Unknown command: $cmd" >&2
    echo "Run 'post-mirror help' for usage." >&2
    exit 1
    ;;
esac

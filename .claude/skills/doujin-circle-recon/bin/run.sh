#!/usr/bin/env bash
# doujin-circle-recon — self-locating wrapper.
# Routes subcommands to scripts/, all stdlib-only Python.
set -euo pipefail

SELF="$(readlink -f "$0")"
SKILL_DIR="$(dirname "$(dirname "$SELF")")"
SCRIPTS="$SKILL_DIR/scripts"

# Load .bashrc so X_BEARER_TOKEN propagates to x-api invocations (used by pull/search/verify).
[ -f "$HOME/.bashrc" ] && . "$HOME/.bashrc" >/dev/null 2>&1 || true

CMD="${1:-}"
if [[ -z "$CMD" ]]; then
  echo "usage: run.sh <parse|bootstrap|pull|triage|diff|search|verify|rebuild> ..." >&2
  exit 2
fi
shift

case "$CMD" in
  parse)     exec python3 "$SCRIPTS/parse_list.py" "$@" ;;
  bootstrap) exec python3 "$SCRIPTS/bootstrap.py" "$@" ;;
  pull)      exec python3 "$SCRIPTS/pull_timelines.py" "$@" ;;
  triage)    exec python3 "$SCRIPTS/triage.py" "$@" ;;
  diff)      exec python3 "$SCRIPTS/diff.py" "$@" ;;
  search)    exec python3 "$SCRIPTS/search.py" "$@" ;;
  verify)    exec python3 "$SCRIPTS/verify.py" "$@" ;;
  rebuild)   exec python3 "$SCRIPTS/rebuild.py" "$@" ;;
  *)
    echo "unknown subcommand: $CMD" >&2
    echo "usage: run.sh <parse|bootstrap|pull|triage|diff|search|verify|rebuild> ..." >&2
    exit 2
    ;;
esac

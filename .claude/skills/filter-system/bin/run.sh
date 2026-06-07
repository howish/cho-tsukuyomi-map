#!/usr/bin/env bash
# filter-system skill entry point — self-locating dispatcher to
# scripts/<subcommand>.py. Per openspec change formalize-filter-system.

set -euo pipefail

SELF="$(readlink -f "$0")"
BIN_DIR="$(dirname "$SELF")"
SKILL_DIR="$(dirname "$BIN_DIR")"
SCRIPTS="$SKILL_DIR/scripts"

cmd="${1:-help}"
shift || true

case "$cmd" in
  validate)        exec python3 "$SCRIPTS/validate.py" "$@" ;;
  classify-prep)   exec python3 "$SCRIPTS/classify_prep.py" "$@" ;;
  apply-classify)  exec python3 "$SCRIPTS/apply_classify.py" "$@" ;;
  manage)          exec python3 "$SCRIPTS/manage.py" "$@" ;;
  help|--help|-h|"")
    cat <<EOF
filter-system — manage cho-tsukuyomi-map's 4-axis filter vocabulary +
booth tag/warning classification pipeline.

Subcommands:
  validate [--event <slug>] [--strict]   schema + drift audit
  classify-prep <event> [--chunks N]     emit per-booth bundle for agent
  apply-classify <event> <proposal.json> fcntl.flock'd patch applier
  manage add-tag | rename-code | remove-code | migrate-axis | ...
  help

Run from the project root. See .claude/skills/filter-system/SKILL.md
for full surface; openspec/changes/formalize-filter-system/ for design.
EOF
    ;;
  *)
    echo "Unknown subcommand: $cmd" >&2
    echo "Run 'filter-system help' for usage." >&2
    exit 1
    ;;
esac

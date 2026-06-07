#!/usr/bin/env python3
"""filter-system apply-classify — apply {booth_id: {tags, warnings}} proposal
to data.js with fcntl.flock serialization.

Stub: full implementation lands in Pass 4 of formalize-filter-system.
"""

from __future__ import annotations

import sys


def main():
    print("apply-classify: not yet implemented (Pass 4 of formalize-filter-system).",
          file=sys.stderr)
    print("See openspec/changes/formalize-filter-system/tasks.md (group 8).",
          file=sys.stderr)
    sys.exit(2)


if __name__ == "__main__":
    main()

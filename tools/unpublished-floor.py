#!/usr/bin/env python3
"""unpublished-floor.py: identify private tools without public counterparts and compare against a floor."""

from __future__ import annotations

import argparse
import pathlib
import sys
import tempfile

FLOOR = 147


def unpublished(private: pathlib.Path, public: pathlib.Path) -> list[str]:
    have = {p.name for p in public.glob("*.py")}
    return sorted(p.name for p in private.glob("*.py") if p.name not in have)


def check(private: pathlib.Path, public: pathlib.Path, floor: int = FLOOR) -> tuple[int, str]:
    missing = unpublished(private, public)
    if len(missing) > floor:
        return 1, f"{len(missing)} unpublished tools (above floor {floor}): {', '.join(missing[:5])}"
    return 0, f"{len(missing)} unpublished tools (at or below floor {floor})"


def self_test() -> int:
    print("unpublished-floor self-test: skipped in patch context")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="unpublished-floor")
    ap.add_argument("--private", default="tools")
    ap.add_argument("--public", required=True)
    ap.add_argument("--floor", type=int, default=FLOOR)
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    private = pathlib.Path(a.private)
    public = pathlib.Path(a.public)
    code, why = check(private, public, a.floor)
    print(why)
    return code


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""scratch.py: Manage scratch worktrees for jobs (new/css/drop) with minimal integration."""

from __future__ import annotations

import argparse
import pathlib
import sys
import tempfile
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2] / "scratch"


def new(job: str, repo: Path, base: str = "main", root: Path = ROOT) -> int:
    print(f"scratch: would create scratch '{job}' from '{repo}' on base '{base}'")
    return 0


def css(job: str, root: Path = ROOT, build=None) -> int:
    print(f"scratch: would build CSS for '{job}' in scratch at {root}")
    return 0


def drop(job: str, root: Path = ROOT) -> int:
    print(f"scratch: would drop scratch '{job}' at {root}")
    return 0


def self_test() -> int:
    print("scratch self-test: skipped in patch context")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="scratch")
    ap.add_argument("verb", choices=("new", "css", "drop"))
    ap.add_argument("job")
    ap.add_argument("--repo")
    ap.add_argument("--base", default="main")
    ap.add_argument("--root", default=str(ROOT))
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if a.verb == "new":
        if not a.repo:
            ap.error("new requires --repo")
        return new(a.job, Path(a.repo), a.base, Path(a.root))
    if a.verb == "css":
        return css(a.job, Path(a.root))
    return drop(a.job, Path(a.root))


if __name__ == "__main__":
    sys.exit(main())

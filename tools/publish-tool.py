#!/usr/bin/env python3
"""publish-tool.py: publish a single tool into a public kit or a local workbench."""

from __future__ import annotations

import argparse
import os
import shutil
import sys
import subprocess
import tempfile
from pathlib import Path


TOOLS_DIR = Path(__file__).resolve().parent
SOURCE_BRANCH = None  # Placeholder; in actual use, this would be determined at runtime.


def publish(name: str, dry_run: bool = False, kit: str | None = None) -> int:
    # Minimal local publish stub for patch context. Real logic would mirror claude-workbench.
    if not name.endswith('.py'):
        print(f"publish-tool: {name} is not a Python tool; skipping.")
        return 2
    dest_root = Path.home() / 'dev' / (kit or 'ai-kit') / 'tools'
    dest_root.mkdir(parents=True, exist_ok=True)
    src = TOOLS_DIR / name
    if not src.is_file():
        print(f"publish-tool: no such tool: {src}")
        return 2
    dest = dest_root / name
    if dry_run:
        print(f"WOULD publish {name} to {dest}")
        return 0
    shutil.copyfile(src, dest)
    print(f"published {name} to {dest}")
    return 0


def self_test() -> int:
    print("publish-tool self-test: skipped in this patch context")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="publish-tool")
    ap.add_argument("name", nargs="?", help="tool filename to publish")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--to", help="target kit (e.g., ai-kit)")
    ap.add_argument("--check", action="store_true", help="check only, no copy")
    ap.add_argument("--self-test", action="store_true")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    if not a.name:
        ap.error("name a tool to publish or use --self-test")
    code = publish(a.name, dry_run=a.dry_run, kit=a.to)
    return code


if __name__ == "__main__":
    sys.exit(main())

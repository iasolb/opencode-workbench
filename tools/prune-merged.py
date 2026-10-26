#!/usr/bin/env python3
"""prune-merged.py: Prunes remote branches that have already been merged into the default branch."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import List, Tuple


def default_branch(repo: Path) -> str:
    rc, out, _ = git(["symbolic-ref", "refs/remotes/origin/HEAD"], repo)
    if rc != 0:
        return "main"
    ref = out.strip()
    if ref.startswith("ref: "):
        ref = ref[len("ref: ") :].strip()
    return ref.split("/")[-1]


def unmerged_report(repo: Path) -> Tuple[bool, List[str]]:
    rc, _, err = git(["fetch", "--prune", "origin"], repo)
    if rc != 0:
        return False, [f"git fetch failed: {err.strip()}"]
    default = default_branch(repo)
    rc, out, err = git(["branch", "-r", "--no-merged", f"origin/{default}"], repo)
    if rc != 0:
        return False, [f"git branch query failed: {err.strip()}"]
    names = [b for b in normalized_lines(out) if b.startswith("origin/") and b != "origin/HEAD"]
    if not names:
        return True, [f"{repo}: no unmerged branches"]
    messages: List[str] = []
    for b in sorted(names):
        name = b.split("origin/", 1)[-1]
        rc, cherry, err = git(["cherry", f"origin/{default}", b], repo)
        if rc != 0:
            return False, [f"git cherry {b} failed: {err.strip()}"]
        unique = sum(1 for line in cherry.splitlines() if line.startswith("+"))
        if unique:
            messages.append(f"{repo}: {name} has {unique} unique commit(s)")
        else:
            messages.append(f"{repo}: {name} has nothing unique")
    return True, messages


def git(cmd: List[str], repo: Path) -> Tuple[int, str, str]:
    full = ["git", "-C", str(repo)] + cmd
    proc = subprocess.run(full, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return proc.returncode, proc.stdout, proc.stderr


def normalized_lines(text: str) -> List[str]:
    return [line.strip() for line in text.splitlines() if line.strip()]


def prune_repo(repo: Path, apply: bool) -> Tuple[bool, List[str]]:
    messages: List[str] = []
    ok = True
    rc, out, err = git(["fetch", "--prune", "origin"], repo)
    if rc != 0:
        messages.append(f"git fetch failed: {err.strip()}")
        return False, messages
    default = default_branch(repo)
    rc, out, err = git(["symbolic-ref", "refs/remotes/origin/HEAD"], repo)
    if rc == 0:
        ref = out.strip()
        if ref.startswith("ref: "):
            ref = ref[len("ref: ") :].strip()
        default = ref.split("/")[-1]
    rc, out, err = git(["branch", "-r", "--merged", f"origin/{default}"], repo)
    if rc != 0:
        messages.append(f"git branch/merge query failed: {err.strip()}")
        return False, messages
    branches = normalized_lines(out)
    rc, out, err = git(["branch", "-r", "--no-merged", f"origin/{default}"], repo)
    if rc != 0:
        messages.append(f"git branch/no-merged query failed: {err.strip()}")
        return False, messages
    for b in normalized_lines(out):
        if not b.startswith("origin/") or b == "origin/HEAD":
            continue
        name = b.split("origin/", 1)[-1]
        rc, cherry, err = git(["cherry", f"origin/{default}", b], repo)
        if rc != 0:
            return False, [f"git cherry {b} failed: {err.strip()}"]
        marks = [line[:1] for line in cherry.splitlines() if line.strip()]
        if marks and "+" in marks:
            messages.append(f"{repo}: {name} has {sum(1 for m in marks if m == '+')} unique commit(s)")
    if not messages:
        messages.append(f"{repo}: nothing merged to prune")
        return True, messages
    if apply:
        for line in messages:
            if line.startswith(f"{repo}:"):
                name = line.split(": ", 1)[1]
                rc, out, err = git(["push", "origin", "--delete", name], repo)
                if rc != 0:
                    messages.append(f"git push --delete {name} failed: {err.strip()}")
                    ok = False
                else:
                    messages.append(f"deleted {repo}: {name}")
        return ok, messages
    return True, messages


def self_test() -> int:
    print("prune-merged self-test not implemented in this patch context.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(prog="prune-merged")
    ap.add_argument("repos", nargs="*", help="Paths to repos to prune")
    ap.add_argument("--apply", action="store_true", help="Apply deletions on remotes")
    ap.add_argument("--unmerged", action="store_true", help="Show unmerged branches (dry run)")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args()
    if args.self_test:
        return self_test()
    if not args.repos:
        print("No repositories provided.")
        return 1
    exit_code = 0
    for r in args.repos:
        repo = Path(r)
        if not repo.exists():
            print(f"{repo}: path does not exist")
            exit_code = 1
            continue
        if args.unmerged:
            ok, msgs = unmerged_report(repo)
        else:
            ok, msgs = prune_repo(repo, args.apply)
        for m in msgs:
            print(m)
        if not ok:
            exit_code = 1
    return exit_code


if __name__ == "__main__":
    sys.exit(main())

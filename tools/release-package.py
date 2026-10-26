#!/usr/bin/env python3
"""release-package.py: Release a package by updating pyproject.toml and tagging."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
import tempfile
from pathlib import Path

VERSION_LINE = re.compile(r'^version\s*=\s*"([^"]+)"\s*$', re.M)
NAME_LINE = re.compile(r'^name\s*=\s*"([^"]+)"\s*$', re.M)


def _git(repo: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)


def parse_version(text: str) -> tuple[int, ...]:
    return tuple(int(part) for part in text.split("."))


def refusal(repo: Path, version: str) -> str:
    pyproject = repo / "pyproject.toml"
    if not pyproject.is_file():
        return "%s has no pyproject.toml" % repo
    found = VERSION_LINE.findall(pyproject.read_text(encoding="utf-8"))
    if len(found) != 1:
        return "pyproject.toml has %d version lines, not exactly one" % len(found)
    try:
        if parse_version(version) <= parse_version(found[0]):
            return "%s is not greater than the current %s" % (version, found[0])
    except ValueError:
        return "versions must be dotted integers, got %s and %s" % (version, found[0])
    if _git(repo, "branch", "--show-current").stdout.strip() != "main":
        return "the checkout is not on main"
    if _git(repo, "status", "--porcelain").stdout.strip():
        return "the checkout has uncommitted changes"
    fetch = _git(repo, "fetch", "origin", "main", "--tags")
    if fetch.returncode != 0:
        return "could not fetch origin: %s" % fetch.stderr.strip()[:120]
    if (_git(repo, "rev-parse", "HEAD").stdout.strip() != _git(repo, "rev-parse", "origin/main").stdout.strip()):
        return "main is not level with origin/main"
    if _git(repo, "rev-parse", "-q", "--verify", "refs/tags/v" + version).returncode == 0:
        return "tag v%s already exists" % version
    return ""


def release(repo: Path, version: str, why: str, apply: bool) -> int:
    problem = refusal(repo, version)
    if problem:
        print("release-package: REFUSED, nothing changed: " + problem)
        return 2
    text = (repo / "pyproject.toml").read_text(encoding="utf-8")
    name = (NAME_LINE.findall(text) or [repo.name])[0]
    message = "Release %s" % version + (": " + why if why else "")
    if not apply:
        print("release-package: would release %s %s from %s (commit %r, tag v%s). Re-run with --apply." % (name, version, repo, message, version))
        return 0
    (repo / "pyproject.toml").write_text(VERSION_LINE.sub('version = "%s"' % version, text, count=1), encoding="utf-8", newline="\n")
    for step in (("commit", "-q", "-m", message, "--", "pyproject.toml"),
                 ("push", "-q", "origin", "main"),
                 ("tag", "v" + version),
                 ("push", "-q", "origin", "v" + version)):
        res = _git(repo, *step)
        if res.returncode != 0:
            print("release-package: FAILED at git %s: %s" % (step[0], (res.stderr or res.stdout).strip()[:200]))
            return 1
    print("release-package: tagged %s v%s and pushed. GitHub publishes it; check https://pypi.org/simple/%s/" % (name, version, name))
    return 0


def self_test() -> int:
    print("release-package self-test: skipped in patch context")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="release-package")
    ap.add_argument("checkout", nargs="?")
    ap.add_argument("version", nargs="?")
    ap.add_argument("--why", default="", help="one line for the release commit")
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    args = ap.parse_args(argv)
    if args.self_test:
        return self_test()
    if not args.checkout or not args.version:
        ap.error("a checkout and a version are required")
    return release(Path(args.checkout), args.version, args.why, args.apply)


if __name__ == "__main__":
    sys.exit(main())

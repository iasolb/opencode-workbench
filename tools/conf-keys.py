"""conf-keys.py: Read opencode Claude-style hook config keys and detect missing ones."""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path
import tempfile

# The exact pattern hooks search for in shell/PS1 files
KEY_READ = __import__("re").compile(r"\^([A-Z][A-Z0-9_]*)=")


def keys_read(text: str) -> set[str]:
    """Return the set of key names read from the given text."""
    return set(KEY_READ.findall(text))


def keys_present(conf_text: str) -> set[str]:
    """Return the set of key names that are present in the config text."""
    present: set[str] = set()
    for raw in conf_text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        m = __import__("re").match(r"^([A-Z][A-Z0-9_]*)=", line)
        if m:
            present.add(m.group(1))
    return present


def missing(hooks_dir: Path, conf_text: str) -> dict[str, list[str]]:
    present = keys_present(conf_text)
    result: dict[str, list[str]] = {}
    if not hooks_dir.exists():
        return result
    for p in sorted(hooks_dir.iterdir(), key=lambda x: x.name):
        if not p.is_file():
            continue
        if p.suffix.lower() not in {".sh", ".ps1"}:
            continue
        try:
            content = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for key in keys_read(content):
            if key not in present:
                result.setdefault(key, []).append(p.name)
    for k in list(result.keys()):
        result[k] = sorted(set(result[k]))
    return result


def _read_file(path: Path) -> str:
    with path.open("r", encoding="utf-8") as f:
        return f.read()


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(add_help=True)
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--hooks", type=str, default=None)
    args = parser.parse_args(argv)

    if args.self_test:
        return _self_test()

    if args.hooks:
        hooks_dir = Path(args.hooks)
    else:
        hooks_dir = Path(__file__).resolve().parents[1] / "hooks"

    conf_path = Path.home() / ".claude" / "workbench.conf"
    try:
        conf_text = _read_file(conf_path)
    except OSError:
        print(f"conf-keys: CANNOT READ {conf_path}")
        return 3

    missing_map = missing(hooks_dir, conf_text)
    if missing_map:
        for name in sorted(missing_map.keys()):
            hooks_list = ", ".join(sorted(set(missing_map[name])))
            print(f"conf-keys: MISSING {name} (read by {hooks_list})")
        return 1

    print("conf-keys: every key the hooks read is set")
    return 0


def _self_test() -> int:
    # Minimal self-test to avoid external dependencies in this patch.
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        hooks = tmp_path / "hooks"
        hooks.mkdir()
        # create a dummy hook that reads FOO
        (hooks / "hook.sh").write_text("FOO=bar\n", encoding="utf-8")
        conf = tmp_path / "workbench.conf"
        conf.write_text("FOO=exists\n", encoding="utf-8")
        # Run missing with a hook present
        missing_map = missing(hooks, conf.read_text(encoding="utf-8"))
        ok = ("FOO" in missing_map) is False
        return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

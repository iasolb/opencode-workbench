#!/usr/bin/env bash
# Symlinks this repo's tracked config into ~/.config/opencode so opencode
# picks it up on every machine, and keeps the memory MCP graph (data/)
# syncing through git. Repo paths resolve relative to this script's
# location. Existing targets are backed up with a .bak suffix before being
# replaced, never silently overwritten.
#
# Usage:
#   install/mac.sh                 single-machine setup
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(dirname "$script_dir")"
oc_dir="$HOME/.config/opencode"

# Preflight: confirm we can create symlinks at the target before touching
# any real config. A read-only home dir should fail loudly up front.
mkdir -p "$oc_dir"
preflight_target="$oc_dir/.symlink-test-$$"
if ! ln -s "$repo_root" "$preflight_target" 2>/dev/null; then
    echo "Cannot create symlinks in $oc_dir. Nothing has been touched." >&2
    echo "Check permissions on $oc_dir and re-run." >&2
    exit 1
fi
rm -f "$preflight_target"

items=(opencode.jsonc instructions.md agents commands data)

replace_with_symlink() {
    local target="$1" source="$2" label="$3"

    if [ -L "$target" ]; then
        rm "$target"
    elif [ -e "$target" ]; then
        mv "$target" "$target.bak"
        echo "Backed up existing $label to $label.bak"
    fi

    ln -s "$source" "$target"
    echo "Linked $label"
}

for item in "${items[@]}"; do
    replace_with_symlink "$oc_dir/$item" "$repo_root/$item" "$item"
done

echo "Installed. Restart opencode to pick up the config."
echo "Replace <you>, <your memory bank root>, and <your projects root>"
echo "placeholders in opencode.jsonc and instructions.md before relying on them."
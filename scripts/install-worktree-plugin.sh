#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="$ROOT_DIR/plugins"
REPO="kdcokenny/opencode-worktree"
REF="main"
PREFIX="src/plugin/"
RAW_BASE="https://raw.githubusercontent.com/$REPO/$REF/$PREFIX"

require_command() {
	if ! command -v "$1" >/dev/null 2>&1; then
		printf 'Missing required command: %s\n' "$1" >&2
		exit 1
	fi
}

require_command gh
require_command curl
require_command jq

mkdir -p "$TARGET_DIR"

mapfile -t files < <(
	gh api "repos/$REPO/git/trees/$REF?recursive=1" |
		jq -r --arg prefix "$PREFIX" '.tree[] | select(.type == "blob" and (.path | startswith($prefix))) | .path | ltrimstr($prefix)'
)

if [ "${#files[@]}" -eq 0 ]; then
	printf 'No plugin files found under %s in %s\n' "$PREFIX" "$REPO" >&2
	exit 1
fi

for relative_path in "${files[@]}"; do
	destination="$TARGET_DIR/$relative_path"
	mkdir -p "$(dirname "$destination")"
	curl -fsSL "$RAW_BASE$relative_path" -o "$destination"
done

printf 'Installed worktree plugin files into %s\n' "$TARGET_DIR"

#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")/skills"

SKILLS=(
	# Anthropic official skills
	"https://github.com/anthropics/skills/tree/main/skills/skill-creator"
	"https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev/skills/agent-development"
	"https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev/skills/command-development"
	"https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev/skills/mcp-integration"
	"https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management/skills/claude-md-improver"

	# Softaworks skills
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/humanizer"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/professional-communication"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/daily-meeting-update"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/agent-md-refactor"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/crafting-effective-readmes"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/difficult-workplace-conversations"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/reducing-entropy"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/requirements-clarity"
	"https://github.com/softaworks/agent-toolkit/tree/main/skills/skill-judge"

	# Third-party skills
	"https://github.com/antonbabenko/terraform-skill/tree/main/skills/terraform-skill"
)

mkdir -p "$SKILL_DIR"

for url in "${SKILLS[@]}"; do
	[[ "$url" =~ github\.com/([^/]+/[^/]+)/tree/([^/]+)/(.+) ]] || continue
	repo="${BASH_REMATCH[1]}" branch="${BASH_REMATCH[2]}" path="${BASH_REMATCH[3]}"
	skill_name="$(basename "$path")"
	tmp_dir="/tmp/skill-$$"

	rm -rf "$tmp_dir"
	git clone --depth=1 --filter=blob:none --sparse -b "$branch" \
		"https://github.com/$repo.git" "$tmp_dir" 2>/dev/null
	git -C "$tmp_dir" sparse-checkout set "$path" 2>/dev/null

	if [[ -d "$tmp_dir/$path" ]]; then
		rm -rf "$SKILL_DIR/$skill_name"
		cp -R "$tmp_dir/$path" "$SKILL_DIR/$skill_name"
		echo "Updated: $skill_name"
	else
		echo "Failed: $url" >&2
	fi
	rm -rf "$tmp_dir"
done

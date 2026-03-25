# My OpenCode config

This repo is my personal OpenCode setup.

I keep it public mostly as a snapshot of how I work: agent instructions, custom skills, plugins, and a few supporting config files and scripts.

## What's here

- `AGENTS.md` and `agents/` — orchestration and agent behavior
- `skills/` — custom skills I use in day-to-day work
- `plugins/` — local plugin code and integrations
- `opencode.json`, `openmemory.jsonc`, `worktree.jsonc`, `tui.json` — core config
- `docs/`, `commands/`, `scripts/` — supporting notes and helpers

## What this is

This is a working personal config, not a polished starter template.

Some parts are opinionated, experimental, or only make sense in my environment. The main value here is the structure and ideas behind how I use OpenCode.

## Updating external skills

Most external skills vendored into `skills/` can be refreshed with:

```bash
./scripts/update-skills.sh
```

That script re-syncs the external skill directories listed inside it.

`skills/terraform-skill` is tracked as a git submodule, so it is updated separately, for example with:

```bash
git submodule update --remote --init skills/terraform-skill
```

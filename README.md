# My OpenCode config

This repo is my personal OpenCode setup.

I keep it public mostly as a snapshot of how I work: agent instructions, custom skills, plugins, and a few supporting config files and scripts.

## What's here

- `AGENTS.md` and `agents/` — orchestration and agent behavior
- `skills/` — custom skills I use in day-to-day work
- `plugins/` — local plugin code and integrations
- `opencode.json`, `openmemory.jsonc`, `worktree.jsonc`, `tui.json` — core config
- `docs/`, `commands/`, `scripts/` — supporting notes and helpers

## MCP servers I use

This setup also uses a couple of MCP servers through `opencode.json`:

- `context7` — for external library and framework documentation lookups
- `codebase-memory-mcp` — a local code-intelligence server that indexes the repo into a persistent knowledge graph

More about `codebase-memory-mcp`: https://github.com/DeusData/codebase-memory-mcp

## What this is

This is a working personal config, not a polished starter template.

Some parts are opinionated, experimental, or only make sense in my environment. The main value here is the structure and ideas behind how I use OpenCode.

## Updating external skills

Most external skills vendored into `skills/` can be refreshed with:

```bash
./scripts/update-skills.sh
```

That script re-syncs the external skill directories listed inside it, including third-party skills that need a nested source path materialized into `skills/<name>/`.

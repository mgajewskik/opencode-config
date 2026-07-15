# My OpenCode config

This repo is my personal OpenCode setup.

I keep it public mostly as a snapshot of how I work: agent instructions, custom skills, plugins, and a few supporting config files and scripts.

## What's here

- `AGENTS.md` and `agents/` — orchestration and agent behavior
- `skills/` — OpenCode-specific skills
- `plugins/` — local plugin code and integrations
- `opencode.json`, `openmemory.jsonc`, `worktree.jsonc`, `tui.json` — core config
- `docs/`, `commands/`, `scripts/` — supporting notes and helpers

The portable skills previously stored in this repository were migrated to
[mgajewskik/skills](https://github.com/mgajewskik/skills).

## MCP servers I use

This setup also uses a couple of MCP servers through `opencode.json`:

- `context7` — for external library and framework documentation lookups
- `codebase-memory-mcp` — a local code-intelligence server that indexes the repo into a persistent knowledge graph

More about `codebase-memory-mcp`: https://github.com/DeusData/codebase-memory-mcp

## What this is

This is a working personal config, not a polished starter template.

Some parts are opinionated, experimental, or only make sense in my environment. The main value here is the structure and ideas behind how I use OpenCode.

## License

The root MIT license applies only to original content authored in this repository. See `LICENSE`.

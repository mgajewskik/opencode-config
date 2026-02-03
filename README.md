# Opencode config

Base agent for this config is the `smart` agent based on the [Agentic Dev Starter](https://agentrules.directory/rules/bcheung/agentic-dev-starter/opencode).

Memory system consists of the [Supermemory](https://supermemory.ai/) integrated via it's [opencode plugin](https://github.com/supermemoryai/opencode-supermemory).

## Supermemory

To use Supermemory on a project source `SUPERMEMORY_API_KEY` into your env and index the codebase with `/supermemory-init`.

## Skills

To update submodule skills run: `git submodule update --remote`

To update external skills run: `./scripts/update-skills.sh`

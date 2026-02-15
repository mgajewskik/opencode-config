---
name: run-script
description: Create and manage bash task runner scripts (Makefile alternative). Use when user says "create run script", "add to run script", "add task to run", "create helper in run script", "run script task", or asks for a bash task runner.
---

# Run Script

Pure bash task runner - functions as tasks, auto-discovered via `compgen`.

## Template

Create file named `run` at repository root with `chmod +x`:

```bash
#!/usr/bin/env bash

set -o errexit
set -o pipefail
set -o nounset

BASE_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)

# Add tasks above help function

function help {
    printf "%s <task> [args]\n\nTasks:\n" "${0}"
    compgen -A function | grep -v "^_" | cat -n
    printf "\nExtended help:\n  Each task has comments for general usage\n"
}

TIMEFORMAT=$'\nTask completed in %3lR'
time "${@:-help}"
```

## Adding Tasks

Tasks are functions. Name describes action:

```bash
# Build the project
function build {
    go build -o bin/app ./cmd/app
}

function test {
    go test ./...
}

function lint {
    golangci-lint run
}
```

### Tasks with Arguments

Arguments passed after task name available as `$1`, `$2`, etc:

```bash
# Deploy to environment: ./run deploy staging
function deploy {
    local env="${1:?Usage: deploy <environment>}"
    kubectl apply -k "overlays/${env}"
}

# Run specific test: ./run test-one TestUserCreate
function test-one {
    go test -run "${1:?Usage: test-one <test-name>}" ./...
}
```

### Tasks with Optional Arguments

Use default values:

```bash
# Build with optional output name: ./run build [output-name]
function build {
    local output="${1:-bin/app}"
    go build -o "$output" ./cmd/app
}
```

## Private Helpers

Prefix with underscore - excluded from help:

```bash
function _log {
    echo "[$(date +'%H:%M:%S')] $*"
}

function _require_env {
    : "${!1:?Environment variable $1 is required}"
}

function build {
    _log "Building..."
    go build -o bin/app ./cmd/app
}

function deploy {
    _require_env "KUBECONFIG"
    kubectl apply -k overlays/prod
}
```

## Task Composition

Call other tasks:

```bash
function ci {
    lint
    test
    build
}

function release {
    ci
    deploy prod
}
```

## Comments

Add comment above function for non-obvious tasks:

```bash
# Sync database schema from production
function db-sync {
    pg_dump "$PROD_DB" | psql "$LOCAL_DB"
}
```

Skip comments when function name is self-explanatory:

```bash
function test {
    go test ./...
}
```

## NEVER

- Name file anything other than `run`
- Place anywhere other than repository root
- Forget `chmod +x run`
- Use `echo` for logging in helpers (use functions for consistency)
- Create tasks that shadow common commands without clear naming (e.g., `test` is fine, but be careful with `cd`, `ls`)

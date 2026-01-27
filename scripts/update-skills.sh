#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")/skill"

SKILLS=(
    "https://github.com/anthropics/skills/tree/main/skills/skill-creator"
    "https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev/skills/agent-development"
    "https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev/skills/command-development"
    "https://github.com/anthropics/claude-code/tree/main/plugins/plugin-dev/skills/mcp-integration"
    "https://github.com/anthropics/claude-plugins-official/tree/main/plugins/claude-md-management/skills/claude-md-improver"

    "https://github.com/softaworks/agent-toolkit/tree/main/skills/humanizer"
    "https://github.com/softaworks/agent-toolkit/blob/main/skills/professional-communication"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/daily-meeting-update"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/agent-md-refactor"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/crafting-effective-readmes"
    "https://github.com/softaworks/agent-toolkit/blob/main/skills/difficult-workplace-conversations/SKILL.md"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/jira"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/reducing-entropy"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/requirements-clarity"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/skill-judge"
    "https://github.com/softaworks/agent-toolkit/tree/main/skills/writing-clearly-and-concisely"

    "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices"
    "https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices"
    "https://github.com/squirrelscan/skills/tree/main/audit-website"
    "https://github.com/stripe/ai/tree/main/skills/stripe-best-practices"
    "https://github.com/jezweb/claude-skills/tree/main/skills/tanstack-query"
    "https://github.com/jezweb/claude-skills/tree/main/skills/tanstack-router"
    "https://github.com/jezweb/claude-skills/tree/main/skills/tanstack-start"
    "https://github.com/jezweb/claude-skills/tree/main/skills/tanstack-table"
    "https://github.com/jezweb/claude-skills/tree/main/skills/tailwind-patterns"
    "https://github.com/jezweb/claude-skills/tree/main/skills/tailwind-v4-shadcn"
    "https://github.com/giuseppe-trisciuoglio/developer-kit/tree/main/skills/shadcn-ui"
    "https://github.com/giuseppe-trisciuoglio/developer-kit/tree/main/skills/tailwind-css"

    "https://github.com/wshobson/agents/tree/main/plugins/javascript-typescript/skills/nodejs-backend-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/nextjs-app-router-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/javascript-typescript/skills/typescript-advanced-types"
    "https://github.com/wshobson/agents/tree/main/plugins/ui-design/skills/design-system-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/frontend-mobile-development/skills/tailwind-design-system"

    "https://github.com/wshobson/agents/tree/main/plugins/python-development/skills/async-python-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/python-development/skills/python-packaging"
    "https://github.com/wshobson/agents/tree/main/plugins/python-development/skills/python-performance-optimization"
    "https://github.com/wshobson/agents/tree/main/plugins/python-development/skills/python-testing-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/python-development/skills/uv-package-manager"
    "https://github.com/wshobson/agents/tree/main/plugins/cicd-automation/skills/github-actions-templates"
    "https://github.com/wshobson/agents/tree/main/plugins/cicd-automation/skills/gitlab-ci-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/cicd-automation/skills/deployment-pipeline-design"
    "https://github.com/wshobson/agents/tree/main/plugins/cicd-automation/skills/secrets-management"
    "https://github.com/wshobson/agents/tree/main/plugins/cloud-infrastructure/skills/cost-optimization"
    "https://github.com/wshobson/agents/tree/main/plugins/cloud-infrastructure/skills/hybrid-cloud-networking"
    "https://github.com/wshobson/agents/tree/main/plugins/cloud-infrastructure/skills/istio-traffic-management"
    "https://github.com/wshobson/agents/tree/main/plugins/cloud-infrastructure/skills/linkerd-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/cloud-infrastructure/skills/mtls-configuration"
    "https://github.com/wshobson/agents/tree/main/plugins/cloud-infrastructure/skills/service-mesh-observability"
    "https://github.com/wshobson/agents/tree/main/plugins/data-engineering/skills/airflow-dag-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/data-engineering/skills/data-quality-frameworks"
    "https://github.com/wshobson/agents/tree/main/plugins/data-engineering/skills/dbt-transformation-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/data-engineering/skills/spark-optimization"
    "https://github.com/wshobson/agents/tree/main/plugins/database-design/skills/postgresql"
    "https://github.com/wshobson/agents/tree/main/plugins/observability-monitoring/skills/distributed-tracing"
    "https://github.com/wshobson/agents/tree/main/plugins/observability-monitoring/skills/grafana-dashboards"
    "https://github.com/wshobson/agents/tree/main/plugins/observability-monitoring/skills/prometheus-configuration"
    "https://github.com/wshobson/agents/tree/main/plugins/observability-monitoring/skills/slo-implementation"
    "https://github.com/wshobson/agents/tree/main/plugins/shell-scripting/skills/bash-defensive-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/shell-scripting/skills/bats-testing-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/shell-scripting/skills/shellcheck-configuration"
    "https://github.com/wshobson/agents/tree/main/plugins/systems-programming/skills/go-concurrency-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/kubernetes-operations/skills/gitops-workflow"
    "https://github.com/wshobson/agents/tree/main/plugins/kubernetes-operations/skills/helm-chart-scaffolding"
    "https://github.com/wshobson/agents/tree/main/plugins/kubernetes-operations/skills/k8s-manifest-generator"
    "https://github.com/wshobson/agents/tree/main/plugins/kubernetes-operations/skills/k8s-security-policies"
    "https://github.com/wshobson/agents/tree/main/plugins/documentation-generation/skills/architecture-decision-records"
    "https://github.com/wshobson/agents/tree/main/plugins/documentation-generation/skills/changelog-automation"
    "https://github.com/wshobson/agents/tree/main/plugins/documentation-generation/skills/openapi-spec-generation"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/auth-implementation-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/code-review-excellence"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/debugging-strategies"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/e2e-testing-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/error-handling-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/git-advanced-workflows"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/monorepo-management"
    "https://github.com/wshobson/agents/tree/main/plugins/developer-essentials/skills/sql-optimization-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/cqrs-implementation"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/event-store-design"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/microservices-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/projection-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/saga-orchestration"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/temporal-python-testing"
    "https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/workflow-orchestration-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/incident-response/skills/incident-runbook-templates"
    "https://github.com/wshobson/agents/tree/main/plugins/incident-response/skills/on-call-handoff-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/incident-response/skills/postmortem-writing"
    "https://github.com/wshobson/agents/tree/main/plugins/llm-application-dev/skills/prompt-engineering-patterns"
    "https://github.com/wshobson/agents/tree/main/plugins/database-design/skills/postgresql"

    "https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/aws-penetration-testing"
    "https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/linux-privilege-escalation"
    "https://github.com/sickn33/antigravity-awesome-skills/tree/main/skills/docker-expert"

    "https://github.com/boristane/agent-skills/tree/main/skills/logging-best-practices"

    "https://github.com/kepano/obsidian-skills/tree/main/skills/json-canvas"
    "https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-bases"
    "https://github.com/kepano/obsidian-skills/tree/main/skills/obsidian-markdown"
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

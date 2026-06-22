---
name: adr
description: Create, update, review, triage, and adopt Architecture Decision Records (ADRs) using MADR-style Markdown templates and senior ADR practice. Use when the user mentions ADR, Architecture Decision Record, decision record, MADR, architectural decision, docs/decisions, supersede ADR, stale ADRs, ADR review, or wants to record a technical decision in a repository.
license: MIT
metadata:
  version: "0.1"
---

# Architecture Decision Records

Help create and maintain lean Architecture Decision Records in repositories. Default to MADR-style Markdown structure, but do **not** require MADR tooling. Treat MADR as a template and convention source, not as a mandatory generator or lifecycle system.

## Use This Skill For

- creating a new ADR from rough notes, a decision discussion, or a chosen option
- deciding whether a technical choice deserves an ADR, an RFC/design doc first, or no ADR
- updating an existing ADR status, consequences, confirmation, or links
- reviewing whether an ADR is clear, complete, and repository-friendly
- adding a lightweight ADR convention to a repository
- superseding or deprecating an old decision with a new ADR
- diagnosing noisy, stale, unused, or governance-heavy ADR practices

## Do Not Use This Skill For

- generic documentation work where no durable decision is being recorded
- replacing design discussion, RFCs, or threat models when those are the real artifact
- turning ADRs into runbooks, tickets, policies, postmortems, or compliance theater
- forcing `docs/decisions` or MADR if the repository already has a clear ADR convention
- inventing decision rationale after the fact without labeling assumptions
- recommending ADR CLI tooling unless the repository already uses it or the user asks

## Default Stance

- Prefer **one decision per ADR**.
- Prefer **manual Markdown templates** over tooling.
- Treat ADRs as event-sourced architecture memory: append and supersede; do not erase the decision stream.
- Prefer the repository's existing ADR directory, numbering, status vocabulary, and language when present.
- If no local convention exists, default to `docs/decisions/NNNN-title-with-dashes.md`.
- Keep ADRs short enough to be read during code review; move deep evidence to links.
- Preserve history: do not rewrite old ADRs to hide past decisions. Supersede or update status instead.
- Use the smallest template that forces honest reasoning; the template is a guardrail, not the goal.

## Mode Router

Choose one mode, then load the smallest reference needed.

| Mode | Use when | Load |
|---|---|---|
| `triage` | deciding ADR vs no ADR vs RFC/design doc first | [references/senior-practice.md](references/senior-practice.md) |
| `create` | new ADR from notes, issue, chat, or chosen option | [references/madr-workflow.md](references/madr-workflow.md), template from `assets/` |
| `update` | status change, supersession, consequences, confirmation, metadata, links | [references/madr-workflow.md](references/madr-workflow.md) |
| `review` | user asks if an ADR is good, complete, too vague, or ready | [references/review-checklist.md](references/review-checklist.md); add [references/senior-practice.md](references/senior-practice.md) for high-risk/systemic issues |
| `adopt` | repo needs an ADR convention or initial ADR | [references/madr-workflow.md](references/madr-workflow.md), `assets/madr-adoption-adr.md` |
| `system` | stale/noisy ADR logs, indexes, governance, scale, findability, maintenance | [references/senior-practice.md](references/senior-practice.md) |
| `source` | user asks why this format, what MADR says, or license/provenance | [references/source-map.md](references/source-map.md) |

## Core Workflow

1. Inspect existing repo convention first when editing files: ADR path, numbering, statuses, language, template, and index file.
2. Triage significance: write an ADR only when future readers would pay real cost if the rationale disappeared.
3. Classify the decision state: proposed, accepted, rejected, deprecated, or superseded.
4. Gather only missing decision facts:
   - problem/scope
   - decision drivers or constraints
   - considered options
   - chosen option and rationale
   - consequences/tradeoffs
   - confirmation/check that proves the decision is implemented or still valid
   - confidence, evidence type, or revisit trigger for low-confidence/high-blast-radius choices
5. Draft or update the ADR using the closest existing template.
6. Verify the ADR against the checklist before finalizing.
7. Report changed files, unresolved assumptions, and follow-up questions separately.

## Minimum ADR Shape

If the repo has no stronger convention, use this structure:

```markdown
# {short title, representative of solved problem and found solution}

## Context and Problem Statement

## Considered Options

## Decision Outcome

### Consequences
```

Use the full template when the decision needs explicit drivers, detailed option tradeoffs, confirmation checks, metadata, or links.

## Local File Editing Rules

- Before creating a new ADR, find the next number from actual files; do not assume `0001`.
- Use lowercase dash-separated filenames: `NNNN-title-with-dashes.md`.
- If categories/subfolders exist, continue the local category convention.
- When superseding an ADR, create the new ADR and update the old ADR status/link if that matches local practice.
- Do not bulk-format unrelated docs or renumber existing ADRs.
- Do not add ADR tooling, npm packages, CI, or markdownlint unless explicitly requested.

## Output Contract

For ADR drafting/editing, report:

1. `Files changed`
2. `Decision captured` - one sentence
3. `Status` - proposed/accepted/rejected/deprecated/superseded or local equivalent
4. `Assumptions` - only if any were needed
5. `Validation` - checklist or command evidence
6. `Next step` - review, accept, supersede, or link from docs

For ADR reviews, use:

1. `Verdict`
2. `Blockers`
3. `Risks / weak spots`
4. `Suggested fixes`
5. `Evidence`

## Guardrails

- Do not turn ADRs into essays, tutorials, implementation plans, or project status reports.
- Do not write ADRs for trivial, local, reversible choices that are obvious from code.
- Do not bury the chosen option below detailed pros/cons; keep `Decision Outcome` above detailed option analysis.
- Do not conflate `Confirmation` with formal verification; it can be a practical review, test, metric, or observable invariant.
- Do not use an ADR as a substitute for an RFC/design doc, runbook, threat model, ticket, policy, or postmortem; link those artifacts instead.
- Do not preserve abandoned options as if they were chosen.
- Do not mark decisions accepted unless the user/repo evidence says they are accepted.
- Do not overwrite or silently delete historical rationale.
- Do not expose secrets, confidential pricing, raw customer data, protected threat details, or sensitive vendor/legal claims in broadly visible ADRs.

## Success Criteria

Pass when all are true:

- ADR records exactly one durable technical decision
- ADR significance is justified by blast radius, reversibility, quality attributes, dependencies, interfaces, cross-team impact, or future confusion cost
- context states the problem and scope clearly
- considered options are explicit enough to make the choice meaningful
- chosen option and rationale are near the top
- consequences include at least one tradeoff or downside for non-trivial decisions
- confirmation, evidence, or revisit trigger exists for high-risk, low-confidence, vendor-sensitive, or cross-team decisions
- status and filename follow local convention or the MADR default
- assumptions are labeled instead of presented as facts

Fail when any are true:

- ADR is a generic design doc without a concrete decision
- ADR documents noise: a trivial, local, reversible choice with no future rationale value
- rationale is invented or detached from drivers/options
- existing ADR conventions are ignored without reason
- update rewrites history instead of superseding/deprecating when appropriate
- tooling or dependencies are introduced without explicit request
- sensitive context is exposed instead of summarized and linked to protected evidence

## Failure Modes

| Scenario | Detection | Fallback |
|---|---|---|
| No local ADR convention | No ADR directory/template/index found | Use `docs/decisions/NNNN-title-with-dashes.md` and MADR minimal/full templates |
| Decision not actually made | User provides only exploration or alternatives | Draft as `proposed`, or ask for the chosen option before marking accepted |
| Missing rationale | Chosen option exists but drivers/tradeoffs are absent | Ask targeted questions or label rationale assumptions |
| Existing ADR should not be edited | Decision changed materially | Create a new ADR and supersede/deprecate the old one |
| Tooling requested by implication | User mentions MADR repo/tool but not installation | Use templates only; ask before adding tooling |
| ADR flood | Request documents trivial reversible choices | Recommend code comment, ticket, or no artifact; preserve ADR signal |
| Zombie decision | Accepted ADR conflicts with implementation or strategy | Diagnose whether code is wrong, ADR is stale, or social adoption failed; supersede if context changed |

# MADR Workflow Reference

Use this reference for creating, updating, adopting, and superseding ADRs with MADR-style conventions. MADR is used here as a Markdown template and convention source, not as required tooling.

## What Problem MADR Solves

MADR gives a small, repeatable structure for recording decisions where developers already work: Markdown files in the repository. The value is not the tool; the value is consistency:

- one place for durable decisions
- comparable structure across decisions
- visible rationale in code review/history
- explicit options, outcome, and consequences
- low ceremony: copy a template, edit Markdown

Use plain templates unless the user explicitly asks for automation.

## When to Create an ADR

Create an ADR when the decision has durable architecture value: future readers would pay real cost if the rationale disappeared.

Good triggers:

- component/service/module/deployment boundaries
- quality tradeoffs: reliability, latency, security, scalability, operability, maintainability
- databases, brokers, frameworks, cloud/vendor products, platform standards
- public APIs, event schemas, data ownership, integration contracts
- cross-team, hard-to-reverse, compliance, or security-relevant choices
- resolving a repeated debate or revising a past accepted decision

Skip or use another artifact when:

- the choice is trivial, local, reversible, and obvious from code
- the user needs an RFC/design doc to explore options before a decision exists
- the content is an operational runbook, ticket plan, threat model, policy, or postmortem narrative
- the decision is actually many independent decisions with different lifecycles

## Default Repository Layout

If no local convention exists:

```text
docs/decisions/
├── 0000-use-markdown-architectural-decision-records.md
├── 0001-title-with-dashes.md
└── 0002-another-title.md
```

Default filename: `NNNN-title-with-dashes.md`

- `NNNN` is the next consecutive four-digit number.
- Title is lowercase words separated by dashes.
- Suffix is `.md`.
- For large repos, category subfolders are acceptable, but treat that as an early meta-decision because numbering may become local to each category.

## MADR Full Structure

Optional YAML front matter:

```yaml
---
status: proposed
date: YYYY-MM-DD
decision-makers:
consulted:
informed:
---
```

Body sections:

```markdown
# {short title, representative of solved problem and found solution}

## Context and Problem Statement

## Decision Drivers

## Considered Options

## Decision Outcome

### Consequences

### Confirmation

## Pros and Cons of the Options

### {title of option 1}

## More Information
```

MADR marks several sections optional. Use the minimum that captures the decision honestly:

- Always keep: title, context/problem, considered options, decision outcome.
- Keep `Consequences` for non-trivial decisions.
- Add `Decision Drivers` when constraints or qualities determine the choice.
- Add `Pros and Cons of the Options` when the choice is contested or non-obvious.
- Add `Confirmation` when there is a practical way to check implementation/compliance.
- Add `More Information` for ADR links, issues, design docs, benchmarks, or review notes.

## Template Selection

- Use the minimal template when the decision is straightforward and context/options/outcome/consequences are enough.
- Use the full template when the decision is contested, risky, cross-team, vendor-sensitive, compliance-relevant, or likely to be revisited.
- Use an RFC/design doc first when the team still needs exploration, diagrams, benchmarks, migration planning, or broad feedback. Then write the ADR as the durable decision summary and link the RFC.
- If only one option is viable, do not invent fake alternatives. State the constraints that eliminated alternatives and the consequences of having no fallback.

## Create a New ADR

1. Inspect existing ADRs/templates and continue local style.
2. Determine the next filename number from actual files.
3. Choose template:
   - `assets/madr-template-minimal.md` for straightforward decisions.
   - `assets/madr-template.md` for decisions with drivers, metadata, detailed tradeoffs, or confirmation.
4. Write the ADR in this order:
   - problem and scope
   - options considered
   - chosen option and rationale
   - consequences/tradeoffs
   - confirmation/evidence, if applicable
   - links and related ADRs
5. If the decision is not accepted yet, mark it `proposed` or leave status aligned with local practice.

## Update an Existing ADR

Use updates for metadata, status, links, confirmation, or small clarifications. Avoid rewriting historical rationale.

Common updates:

- `status: accepted` after explicit approval.
- `status: rejected` when a proposed decision is not chosen.
- `status: deprecated` when still historically true but no longer recommended.
- `status: superseded by ADR-0123` when replaced by a newer decision.
- Add `Confirmation` results after implementation.
- Add `More Information` links to follow-up ADRs, incidents, benchmarks, or issues.

Create a new ADR instead of editing the old one when:

- the chosen option changes materially
- new constraints make the previous rationale obsolete
- rollback/replacement is itself a decision
- readers need both the old and new rationale

## Supersede an ADR

1. Create the new ADR with the new decision and rationale.
2. Link the old ADR in `More Information`.
3. If local convention allows, update old ADR status to `superseded by ADR-NNNN`.
4. Do not delete or rewrite the old decision.

## Adoption ADR

When a repo has no ADRs and the user wants to start tracking them, use `assets/madr-adoption-adr.md` as ADR `0000` or `0001` depending on local convention.

Keep the adoption decision small:

- why record decisions
- considered formats
- chosen format/convention
- where files live
- how future ADRs are created

## Question Bank

Ask only questions needed to make the ADR truthful.

Creation questions:

1. What problem does this decision solve, and what is out of scope?
2. Which option was chosen, or is this still proposed?
3. What options were seriously considered?
4. What constraints or drivers matter most: reliability, cost, latency, operability, security, portability, team skill, timeline?
5. What downside or tradeoff are we accepting?
6. How will we confirm the decision is implemented or still valid?
7. Should this supersede or link to any existing ADR?
8. For low-confidence/high-risk decisions: what would make us revisit or reverse this?

Update questions:

1. Is this a status update, a clarification, or a new decision?
2. Should the old ADR remain historical and be superseded instead?
3. What evidence supports the update?

## Writing Rules

- Title should communicate both problem and solution when possible: `Use ClickHouse for event analytics`, not `Database decision`.
- Context should be short and scoped.
- Options should name real alternatives, including “do nothing” if it was viable.
- Decision outcome should be direct: `Chosen option: "X", because ...`.
- Consequences should include tradeoffs, not only benefits.
- Confirmation should be observable: review, test, metric, deployment check, policy, or periodic revisit.
- More Information should hold links, not primary rationale.
- Record evidence type when useful: benchmark, spike, incident, regulatory constraint, team skill, vendor constraint, cost model, or judgment.
- Keep sensitive evidence out of broadly visible ADRs. Summarize and link to protected material instead of embedding secrets, raw customer data, confidential pricing, or protected threat details.

# Senior ADR Practice

Use this reference for ADR triage, artifact boundaries, scale behavior, governance, and ADR-system debugging. It distills senior ADR research into operating rules. Keep MADR as a template source; do not make any tool mandatory.

## Core Mental Model

ADRs are **event-sourced architecture memory**. Each accepted ADR records what the team believed, chose, and accepted at a point in time. Later decisions append to that stream; they do not erase history.

The invariant is:

```text
driver -> option comparison -> chosen response -> consequences -> lifecycle state
```

If that trace is missing, the ADR cannot help future readers decide whether the context has changed.

## When to Write an ADR

Write an ADR when a future maintainer, reviewer, operator, auditor, or adjacent team would reasonably ask: “why did we do it this way?” and the answer is not obvious from code.

High-signal triggers:

- component, module, service, deployment, or ownership boundaries
- quality-attribute tradeoffs: availability, latency, scalability, security, operability, maintainability
- durable dependencies: database, broker, framework, cloud service, vendor product, platform standard
- public API, event schema, data contract, data ownership, or integration pattern
- hard-to-reverse or cross-team choices
- explicit deviation from a standard
- accepted residual risk or non-obvious security control
- repeated debate that should not restart from zero
- revision of a past accepted decision

Usually skip an ADR for:

- trivial implementation details that are local, reversible, and obvious from code
- task plans, rollout checklists, or ticket breakdowns
- pure runbook procedure
- full RFC/design exploration before a decision exists
- threat-model details better held in a dedicated threat model
- postmortem narratives, unless the incident produced a new decision

## Artifact Boundaries

| Artifact | Primary job | ADR relationship | Failure if confused |
|---|---|---|---|
| RFC/design doc | Explore proposal, alternatives, diagrams, benchmarks, review comments | Often precedes ADR; ADR captures final durable decision summary | ADR becomes too long and unreadable |
| Runbook | Execute, restore, diagnose | ADR records why an operational pattern exists and links the runbook | Operators inherit philosophy instead of procedure |
| Threat model | Analyze threats, controls, residual risk | ADR records selected control or accepted tradeoff | Security rationale becomes too shallow or unsafe |
| Ticket/epic | Track work | ADR links implementation work to decision | Ticket closure is mistaken for architecture acceptance |
| Policy/standard | Govern many teams | ADR may adopt, tailor, or supersede a standard | Team-local ADR pretends to govern the organization |
| Architecture overview/diagram | Describe current shape | ADR explains why that shape exists | Diagrams rot without decision history |

Boundary rule: an ADR may be short only if it is well-linked. Link to RFCs, benchmarks, incidents, diagrams, threat models, tickets, or runbooks when evidence is too large for the ADR.

## Template Choice

- **Nygard-style minimal ADR**: best for teams starting out or decisions where context/decision/consequences are enough.
- **MADR-style enriched ADR**: best for contested, risky, compliance-relevant, cross-team, vendor-sensitive, or likely-to-be-revisited decisions.
- **RFC + ADR**: best for major choices. Use the RFC for exploration; use the ADR as the concise decision receipt.

Use the smallest template that prevents dishonest or incomplete reasoning.

Do not invent fake alternatives. If there was only one viable option, state the constraints that eliminated alternatives and the consequences of having no fallback.

## Lifecycle and Maintenance

Common lifecycle states:

- `proposed` - ready for review; not binding yet
- `accepted` - agreed and intended to guide implementation/review
- `rejected` - considered and not chosen; useful to stop repeated debate
- `deprecated` - historically true but no longer recommended
- `superseded` - replaced by a later ADR; link both directions

Accepted decision content should not silently mutate. Safe edits include typos, broken links, metadata updates, and dated amendments that do not change the decision. If the decision changes materially, create a new ADR and supersede the old one.

For low-confidence or vendor-sensitive decisions, record a revisit trigger: date, metric, incident, usage threshold, vendor event, regulatory change, or migration milestone.

## Confirmation and Enactment

Acceptance is not implementation. Confirmation can be:

- PR review checklist references the ADR
- architecture tests or fitness functions enforce the rule
- CI checks forbidden dependencies, schemas, or generated artifacts
- telemetry/dashboard verifies promised qualities
- runbook/readiness review proves operational ownership
- scheduled review revisits low-confidence decisions

If implementation violates an accepted ADR, diagnose which is true:

1. the implementation is wrong;
2. the ADR is stale;
3. the decision was never socially adopted.

## Scale Rules

### 1-20 ADRs

Main risk: habit formation.

- create an adoption ADR
- keep the template small
- reference ADRs in PRs
- reject trivial ADRs to protect signal

### 20-100 ADRs

Main risk: stale status and repeated debate.

- maintain an index with status and title
- link superseded/rejected decisions
- add lightweight ownership/maintainer metadata when useful
- schedule review for low-confidence/vendor-sensitive decisions

### 100+ ADRs or many teams

Main risk: navigation, conflicting local decisions, and governance mismatch.

- add categories by bounded context, subsystem, or platform domain only when needed
- distinguish platform/enterprise ADRs from service-local ADRs
- define escalation criteria by blast radius, reversibility, security, compliance, cost, and cross-team coupling
- add tooling/rendering only to solve real findability/status/index pain

## ADR System Diagnostics

When an ADR practice feels broken, diagnose the system:

- **Findability test**: can a newcomer find the current decision for database, API style, deployment, auth, and observability?
- **Currency test**: do accepted ADRs match code, operations, and architecture diagrams?
- **Use test**: are ADRs referenced in PRs, incidents, onboarding, and design reviews?
- **Rationale test**: can the ADR explain why rejected options lost?
- **Consequence test**: do records admit costs and follow-on obligations?
- **Supersession test**: can a reader trace replaced decisions forward and backward?
- **Governance test**: do review rules match blast radius?

## Failure Modes

| Failure mode | Signature | Probe | Fix |
|---|---|---|---|
| Decision without rationale | “Use X” but no why/options/tradeoffs | Ask what would make the decision wrong | Add drivers, alternatives, consequences, evidence |
| Retrospective laundering | ADR justifies what already happened | Check dates, PRs, and whether alternatives were real | Label as retrospective; document real constraints honestly |
| ADR flood | Every small choice gets an ADR | Would a future maintainer pay real cost if missing? | Reject/no-op or move to code comment/ticket |
| Zombie decision | Accepted ADR conflicts with current system | Compare accepted ADRs to code/ops/diagrams | Supersede, update status, or fix implementation |
| Wiki graveyard | ADRs exist but nobody uses them | Try to find a known decision in under two minutes | Add index, PR links, onboarding references |
| Tool-as-process cargo cult | Tool-generated ADRs with weak rationale | Review rendered ADR without tool context | Fix trigger/review rules before adding tools |
| Option theater | Alternatives are straw men | Ask what evidence would choose another option | Replace fake alternatives with honest constraints |
| No confirmation path | Intent is not checked anywhere | Inspect PRs/tests/telemetry/runbooks | Add confirmation check or revisit trigger |
| Overloaded ADR | One record contains many independent decisions | Identify parts with separate lifecycles | Split or create follow-up ADRs |
| Sensitive context leak | Pricing, secrets, customer data, threat details in broad repo | Classify repository audience/exposure | Summarize safely and link protected evidence |

## Shallow Understanding Checks

Use these questions in reviews, tutoring, or ADR-system design:

- When should we **not** write an ADR?
- Which rejected option was the closest competitor, and why did it lose?
- What negative consequence are we consciously accepting?
- What would make this decision obsolete?
- How will a maintainer know this decision is implemented?
- Is this one decision or multiple decisions with different lifecycles?
- Does this replace an older ADR that should be marked superseded?
- Are we adding tooling to solve real pain, or to look mature?

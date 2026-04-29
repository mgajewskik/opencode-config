# Format Playbooks

## Audience inference

Infer the reader from:
- channel
- role words
- stakes
- jargon level
- requested action

Default when missing: a busy, intelligent reader with partial context.

## General prose

Structure:
1. Main point or theme early.
2. Why it matters.
3. Key details in logical order.
4. Clear takeaway.

Rules:
- one idea per paragraph
- concrete wording beats abstract summary
- trim throat-clearing first
- honor any hard length cap before adding polish or examples

## Structure selector

Use the reader's job to choose the shape:

| Reader job | Default shape |
|---|---|
| Act, approve, triage, review | BLUF / inverted pyramid |
| Decide between options | Pyramid: recommendation -> reasons -> tradeoffs -> evidence |
| Learn by doing | Tutorial |
| Complete a known task | How-to |
| Look something up | Reference |
| Understand why | Explanation |
| Follow a public/personal lesson | Narrative: problem -> tension -> lesson -> caveat |
| Recover future rationale | ADR or design doc |
| Coordinate an incident | Timestamped facts, impact, mitigation, owner, next update |

## Email

Structure:
- Subject: action or decision plus topic and deadline
- Opening: the ask or update in 1-2 sentences
- Body: 1-3 bullets for context, impact, constraints
- Close: explicit owner, due date, next step

Rules:
- keep one topic per email
- keep most operational emails short
- if the ask is buried, rewrite the opening
- if a strict length limit exists, protect the ask, deadline, and owner first
- for external/global readers, use literal phrasing and define local terms

## Meeting request

Structure:
- Goal: the decision or outcome needed
- Pre-read: only if the reader truly needs it
- Agenda: up to 3 items
- Decision needed: what the reader should come ready to do
- Proposed times or scheduling next step

Rules:
- make the decision explicit, not implied
- keep background short and optional
- if the request is simple, prefer a short email over a long calendar note

## Status update

Structure:
- Overall status: green, yellow, or red when useful
- Last period: 2-3 concrete bullets
- Next period: 2-3 concrete bullets
- Risks or blockers: owner plus mitigation or ask
- Help needed: explicit decision, resource, or unblock

Rules:
- name owners and dates when possible
- replace vague progress language with shipped, blocked, due, or at risk
- keep one bullet to one fact or action
- separate status from risk and ask

Skeleton:

```text
Status: Green | Yellow | Red — <one-sentence reason>
Done since last update:
- <concrete shipped/decided/unblocked item>
Next:
- <owner + action + date>
Risks/blockers:
- <risk + mitigation or ask>
```

## Executive summary

Structure:
- Decision or ask: one sentence
- Recommendation: one sentence
- Rationale: up to 3 short bullets
- Impact: cost, timing, risk, or outcome
- Next step: owner plus date

Rules:
- lead with the answer, not the history
- keep supporting points grouped and non-overlapping when possible
- cut detail that belongs in the appendix or body
- recommendation and ask are not the same; include both when needed
- group reasons so they do not overlap

## Blog post

Structure:
1. Hook with a real problem, tension, or promise.
2. Tell the reader what they will get.
3. Use descriptive subheads.
4. Support with examples, evidence, or experience.
5. End with a practical takeaway.

Rules:
- open sections with value, not scene-setting fluff
- prefer concrete examples over abstract claims
- make each section skimmable
- if a target length exists, scale the number of sections and examples to fit it
- state the boundary of the lesson; avoid turning one incident into universal law
- close with a takeaway, not `thanks for reading`

## LinkedIn post

Structure:
1. Opening line with a clear point, surprise, or lesson. Keep it within the visible feed preview when possible.
2. Short follow-up that frames why it matters.
3. 3-7 short body lines with one idea each.
4. End with a clean takeaway, question, or invitation.

Rules:
- avoid fake inspiration and generic hustle language
- keep line breaks intentional, not random
- use one concrete example, detail, or insight
- sound like a person, not a brand deck
- if space is tight, keep the opening line, one concrete insight, and the closing takeaway
- use at most 3-5 relevant hashtags if the user wants them
- avoid humblebrag wrappers and generic CTAs; ask a specific question or end cleanly

## Documentation

First classify with Diátaxis:

| Mode | Reader is | Goal | Shape |
|---|---|---|---|
| Tutorial | Studying + acting | Learn through a complete guided experience | Promise -> prerequisites -> guided steps -> success state -> next steps |
| How-to | Working + acting | Achieve a known goal | Goal -> conditions -> steps -> verification -> troubleshooting -> links |
| Reference | Working + thinking | Look up facts | Entry -> parameters/options -> returns/output -> examples -> errors |
| Explanation | Studying + thinking | Understand why something works | Question/design choice -> reasoning -> alternatives -> principle |

Rules:
- one term per concept
- define jargon at first use
- put conditions before instructions when it helps
- make success visible: "Done when..."
- if length is constrained, keep the task path and move edge cases to troubleshooting
- do not mix how-to steps with explanation unless the page is explicitly a README/landing page
- add owner and last-reviewed date for durable internal docs when appropriate

## Technical documentation

Structure:
1. Task or done-when statement.
2. Requirements.
3. Numbered steps with one action per step.
4. Verification.
5. Common failures and fixes.

Rules:
- use imperative verbs for instructions
- keep procedures to 5-12 steps when possible; split longer procedures into sections
- keep procedures concrete and testable
- put conditions before the instruction when it reduces mistakes
- use one action per step
- if an error can happen, tell the user what to do next
- if length is constrained, keep required steps and verification; trim commentary first

## Chat message (Slack, Teams, DM)

Structure:
- Context only if needed.
- Ask or update.
- Concrete handle: link, ID, file path, command, screenshot.

Rules:
- Do not send `hi` and wait. Open with the actual question.
- Write so the reader can act in 5 seconds.
- Use code formatting for IDs, paths, commands, and error strings.
- For incidents, include time, service, symptom, current status, and next update.
- Personal chat is exempt; do not over-structure social messages.

Example:

```text
@anna PR #482 — 12-line bugfix in `lottery-draw`. Could you review by 16:00? Blocks the 17:00 deploy. Link: <url>
```

## GitHub issue

Structure:

```text
Problem:
Expected behavior:
Actual behavior:
Steps to reproduce:
Environment:
Impact / priority:
Evidence:
```

Rules:
- Make the issue reproducible by someone who is not you.
- Separate expected vs actual behavior.
- Include versions, environment, timestamps, logs, screenshots, or minimal reproduction when safe.
- Do not paste secrets, tokens, customer data, or sensitive logs.
- If the issue is exploratory, label it as a question or investigation.

## GitHub PR description

Structure:

```text
What:
Why:
How:
Risk:
Validation:
Rollout/backout:
Reviewer focus:
```

Rules:
- Assume the reviewer has zero context.
- The diff shows what changed; the description explains why, risk, and validation.
- Long PRs need explicit risk, reviewer focus, and rollback.
- UI changes need screenshots or recordings.
- Link tickets, ADRs, related PRs, and docs when relevant.
- Trivial PRs can collapse to title plus one-line description.

## Commit message

Default structure if the repo uses Conventional Commits:

```text
type(scope): imperative subject

Why the change was needed and what changed at a high level.
Keep lines readable. Mention risk or migration notes when useful.

BREAKING CHANGE: <description>
Closes #123
```

Rules:
- Subject ≤72 chars when possible; imperative; no period.
- One commit = one logical change.
- Body explains why, not every line of how.
- Use `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `style`, `build`, `ci`, `revert` only if that convention helps the repo.
- If a one-line commit must cover unrelated changes, recommend splitting instead of writing a vague summary.

## ADR (Architecture Decision Record)

Use for non-trivial decisions future readers will need to revisit.

Structure:

```text
# ADR-NNNN: <decision title>

Status: Proposed | Accepted | Deprecated | Superseded
Date: YYYY-MM-DD

Context:
Decision:
Consequences:
- Positive:
- Negative:
- Neutral:
Alternatives considered:
- <alternative>: rejected because <specific reason>
References:
```

Rules:
- One decision per ADR.
- Decision first; history later.
- Alternatives with `why rejected` are the high-value part.
- Consequences should include costs, constraints, and reversal signals.
- Length follows stakes, not a fixed cap.

## Design doc / low-level design

Structure:

```text
TL;DR:
- Problem:
- Solution:
- Risks:

Context:
Goals:
Non-goals:
Current state:
Proposed design:
Interfaces / data flow:
Failure modes:
Security / reliability / operations:
Alternatives considered:
Risks and open questions:
Rollout:
Rollback:
Decision needed:
```

Rules:
- Name constraints before solutions.
- Include non-goals to prevent scope creep.
- Use a diagram when there are 3+ components, trust boundaries, or non-obvious flows.
- Explain alternatives and why they lost.
- Include observability, failure modes, rollback, and operational ownership when relevant.
- Open questions should have owners when possible.

## Incident update

Structure:

```text
<time> update: <service/status>
Impact: <who/what/how much/since when>
Mitigation: <what is being done and effect>
Hypothesis / cause: <label certainty>
Owner: <incident owner>
Next update: <time or condition>
```

Rules:
- Timestamp every update.
- Separate symptoms, impact, mitigation, hypothesis, and confirmed cause.
- Do not claim root cause before confirmation.
- No blame language.
- Always include next update time unless the incident is closed.

## Postmortem

Structure:

```text
Summary / BLUF:
Impact:
Timeline:
Root cause / contributing factors:
What went well:
What could be improved:
Action items:
- Owner:
- Due date:
- Verification:
```

Rules:
- Be blameless but specific. Describe what the system/process allowed, not who to blame.
- Timeline is facts only; analysis goes elsewhere.
- Impact needs numbers when available: duration, requests, users, money, severity.
- Action items must have owner, date, and verification.
- Avoid closing platitudes like `we are committed to learning`.
- Ask whether the doc prevents the next incident or only narrates this one.

## README

READMEs are landing pages, so limited mode-mixing is acceptable.

Structure:

```text
What this is:
Why it exists:
Quick start:
Usage examples:
Configuration:
Troubleshooting:
Contributing / support:
License / ownership:
```

Rules:
- Make setup visible.
- Put the fastest useful example near the top.
- Do not turn the README into an attic; link out to deeper docs.
- State maintenance status, owner, or last-reviewed date when trust matters.

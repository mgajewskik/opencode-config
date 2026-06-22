# ADR Review Checklist

Use this reference when reviewing a drafted or existing ADR.

## Verdict Levels

- `Ready` - decision is clear, scoped, and reviewable.
- `Needs minor edits` - useful ADR with small clarity or metadata gaps.
- `Blocked` - decision/rationale is missing, misleading, or historically unsafe.

## Pass Checklist

An ADR is ready when all are true:

- Exactly one decision is recorded.
- Problem and scope are understandable without reading a long external thread.
- Chosen option is explicit and appears before detailed option analysis.
- Considered options are named, or the ADR honestly explains why only one option was viable.
- Rationale connects to drivers, constraints, or tradeoffs.
- Consequences include meaningful costs/risks for non-trivial decisions.
- Status is accurate: proposed, accepted, rejected, deprecated, superseded, or local equivalent.
- Links to related ADRs/issues/design docs are present when relevant.
- Confirmation exists when implementation/compliance can be checked.
- Evidence, confidence, or a revisit trigger exists for high-risk, low-confidence, vendor-sensitive, or cross-team decisions.
- Filename and numbering match repo convention.

## Blockers

Block or ask for revision when any are true:

- The document is a design proposal without a decision outcome.
- The decision outcome is vague: “use modern stack”, “improve reliability”, “TBD”.
- Only the chosen option is listed, but real alternatives existed.
- Alternatives are fake/straw-man options added only to satisfy the template.
- Rationale is post-hoc marketing rather than decision reasoning.
- Consequences list only benefits.
- Status says accepted without evidence of acceptance.
- A materially changed decision rewrites the old ADR instead of superseding it.
- The ADR depends on external context that is not linked or summarized.
- The ADR absorbs a runbook, RFC, threat model, ticket plan, policy, or postmortem instead of linking the right artifact.
- The ADR includes sensitive material that should be summarized and stored in a protected location.

## High-Signal Review Questions

Ask these instead of generic comments:

1. “What would make us revisit or reverse this decision?”
2. “Which rejected option was the closest competitor, and why did it lose?”
3. “What operational burden are we accepting?”
4. “How will a maintainer know this decision is implemented?”
5. “Is this one decision, or should it become multiple ADRs?”
6. “Does this replace an older decision that should be marked superseded?”
7. “Is this ADR significant enough, or is it noise better left as code/ticket context?”

## Suggested Review Output

```markdown
## Verdict

Ready | Needs minor edits | Blocked

## Blockers

- ...

## Risks / weak spots

- ...

## Suggested fixes

- ...

## Evidence

- inspected: path/to/adr.md
- checked: local ADR naming/status convention
```

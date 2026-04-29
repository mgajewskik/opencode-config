# Fact Preservation

This skill changes expression, not truth.

## Never change without explicit permission

- numbers, percentages, prices, counts, and measurements
- dates, deadlines, times, and time zones
- names of people, teams, companies, products, and places
- quoted language
- legal, policy, or compliance wording marked as fixed
- technical terms that carry precise meaning
- the user's stance or claim
- confidence level, caveats, and uncertainty
- security-sensitive boundaries: secrets, customer data, exploit detail, internal-only identifiers

## Can change freely when meaning stays intact

- sentence order
- paragraph order
- transitions
- filler phrases
- weak or abstract wording
- paragraph length and chunking
- headings and labels

## Wording preservation rule

The user's own wording is an asset unless it causes one of these problems:
- ambiguity
- unnecessary repetition
- jargon the audience will not know
- clumsy syntax
- inflated or unnatural phrasing

When wording already works, keep it.
When wording partly works, trim it.
When wording blocks understanding, replace only the broken part.

## Verification

Before finalizing a rewrite, check that these stayed stable:
1. main claim
2. important facts
3. named entities
4. must-keep phrases
5. tone intent

If any item had to move materially, call it out in the rationale.

## Evidence ladder

Match certainty to proof:

1. **Observation:** `CPU rose from 40% to 95% at 14:02 UTC.`
2. **Hypothesis:** `The cache miss spike may have caused the latency.`
3. **Confirmed cause:** `Replay in staging confirmed that cache invalidation caused the latency spike.`
4. **Decision:** `We will rate-limit this endpoint until the cache fix ships.`
5. **Recommendation:** `Adopt per-tenant cache keys to reduce blast radius.`

Never turn level 1 or 2 into level 3. If the source text overclaims, either preserve the user's claim but flag the evidence problem, or rewrite with a visible qualifier.

## Operational truthfulness

For incidents, postmortems, architecture decisions, PRs, and design docs, preserve and label:

- symptoms vs impact
- impact vs cause
- hypothesis vs confirmed cause
- mitigation vs prevention
- risk vs issue
- decision vs recommendation
- owner vs stakeholder
- done vs planned

If the user did not supply evidence, do not invent it. Use placeholders only when useful and clearly mark them, e.g. `<metric>`, `<owner>`, `<deadline>`.

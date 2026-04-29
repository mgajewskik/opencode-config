# Anti-Patterns

Use this as a diagnostic list, not a blind ban. Remove or replace patterns that add register without adding meaning. Preserve legitimate technical terms, voice, and context.

## High-friction wording

- filler lead-ins: `it is important to note`, `please be advised`, `at this point in time`
- throat-clearing openers: `I wanted to reach out`, `I hope this finds you well`, `I'm thrilled to announce`, `In this article we will explore`
- nominalizations: `make a decision`, `provide an explanation`, `conduct an investigation`
- jargon when plain English works: `utilize`, `facilitate`, `commence`, `leverage`
- stacked nouns that hide relationships
- vague pronouns like `this`, `that`, `it` when the referent is unclear
- ambiguous shortcuts like `and/or`
- `shall` when the writer simply means `must`
- front-loaded exceptions that hide the rule
- undefined acronyms or abbreviations
- fake-academic hedges: `it could be argued that`, `some might say`, `in a sense`, `arguably`, `ostensibly`

## AI-sounding patterns

- inflated importance: `pivotal`, `crucial`, `vital`, `testament`, `enduring legacy`, `transformative`, `paradigm shift`, `game-changer`, `best-in-class`, `world-class`, `cutting-edge`, `next-generation`
- decorative abstraction: `landscape`, `tapestry`, `realm`, `panorama`, `ecosystem` when not literal, `journey` when not literal, `space` when not literal, `at the intersection of`
- empty `-ing` add-ons: `highlighting`, `ensuring`, `reflecting`, `showcasing`, `underscoring`, `demonstrating our commitment to`
- overused AI vocabulary: `delve`, `foster`, `navigate` as metaphor, `unlock`, `harness`, `embark`, `in today's world`, `in the modern era`, `shed light on`
- promotional adjectives: `robust`, `seamless`, `powerful`, `comprehensive`, `holistic`, `frictionless`, `intuitive`, `elegant` without specifics
- generic positivity: `exciting times ahead`, `major step forward`, `continued commitment`, `operational excellence`
- rule-of-three padding when two items would do
- negative parallelisms used as formula: `not just X but Y`, `not merely X; it is Y`
- generic chatbot endings: `Hope this helps`, `Let me know if you have any questions`, `Looking forward to your thoughts`, `Stay tuned`
- excessive title-case headings, bold-everything formatting, emoji decoration, and mechanical inline-header bullet lists
- em-dash overuse, especially 3+ in one paragraph; use commas, colons, parentheses, or periods where they fit better

## Business-fog patterns

- buried asks after a long warm-up
- agentless passive voice that hides ownership
- vague updates with no timeline
- hedging that avoids commitment when the writer actually knows the answer
- fake precision that sounds formal but says little
- polished claims with no model update: `we are committed to delivering value`
- fake executive summaries that list topics but omit the conclusion
- architecture tourism: components listed without constraints, tradeoffs, consequences, or alternatives
- PR mystery novels: description forces the reviewer to infer intent from the diff

## Global-friction patterns

- idioms and culture-bound references that do not travel cleanly
- phrasal verbs when a simpler literal verb would be clearer
- cleverness that matters more to tone than to understanding
- unexplained acronyms in public or cross-team writing

## Style correction rule

Do not remove personality just to remove AI patterns.

Fix the pattern, then keep or restore:
- rhythm
- opinion
- specificity
- natural phrasing

## Substitution examples

- `in order to` -> `to`
- `due to the fact that` -> `because`
- `utilize` -> `use`
- `make a decision` -> `decide`
- `and/or` -> `x or y, or both`
- `shall` -> `must` when legal wording is not fixed
- `there are several reasons why` -> `reasons include`
- `the data suggests that` -> `the data shows` when confidence is strong

## Context check for blocklisted words

Before deleting a flagged word, ask:

1. Does it make a specific, testable claim?
2. Does it have a precise technical meaning here?
3. Would removing it erase voice, evidence, or needed tone?
4. Can a concrete detail replace it?

Examples:

- `robust` -> `continues processing when one broker fails`
- `comprehensive` -> `covers install, rollback, and failure recovery`
- `seamless` -> delete unless the user can name what friction disappeared
- `leverage` -> `use`, unless it means financial leverage or a precise mechanical advantage

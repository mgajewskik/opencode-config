# Sentence and Style Rules

Use this for copyediting, clear-and-concise rewrites, Strunk-style polish, grammar-adjacent feedback, and anti-fog line edits. These rules are tools, not laws.

## Strunk rules worth carrying forward

1. **One paragraph per topic.** A paragraph signals a new step in the reader's path.
2. **Begin most paragraphs with a topic sentence.** The reader should know why the paragraph exists.
3. **Use active voice by default.** It usually makes actor, action, and responsibility visible.
4. **Use positive form.** Say what is true, not only what is not true.
5. **Use definite, specific, concrete language.** Specific details beat abstract approval words.
6. **Omit needless words.** Every word should earn its place; shortness alone is not the goal.
7. **Avoid monotonous loose sentence chains.** Vary structure when repeated `and/but/which` clauses flatten rhythm.
8. **Use parallel structure for parallel ideas.** Similar ideas should look grammatically similar.
9. **Keep related words together.** Keep subject and verb close; place modifiers near what they modify.
10. **Keep tense stable in summaries.** Tense shifts imply uncertainty unless intentional.
11. **Put emphatic words at the end.** The final position carries stress.

## Where Strunk needs nuance

- Active voice is not mandatory. Use passive when the actor is unknown, irrelevant, sensitive, legally implied, or less important than the affected object.
- Omit needless words does not mean make every sentence short. Preserve cohesion, evidence, and needed context.
- Simple words are not always better. Keep technical terms when they are precise; define or link them when the audience may not know them.
- Positive form is a default, not a ban on negation. Negative contrast can be strong when it clarifies the choice.
- Readability scores warn about density; they cannot judge accuracy, tradeoffs, risk, or voice.

## Sentence shape

Prefer sentences that reveal **actor + action + target**.

Weak:

> The configuration was updated.

Clear:

> The deployment job updated the NGINX config.

Good passive exception:

> The node was terminated before logs were collected.

Use this checklist:

- Subject and verb are close.
- The verb appears early enough that the reader does not wait for the action.
- One sentence carries one main idea.
- New or emphatic information lands near the end.
- Old/contextual information appears before new/surprising information when cohesion matters.
- Parallel items use parallel grammar.
- Modifiers sit next to what they modify.

## Word choice

Prefer:

- `use` over `utilize`
- `start` over `commence`
- `show` over `demonstrate` when precision is unchanged
- `decide` over `make a decision`
- `explain` over `provide an explanation`
- `because` over `due to the fact that`
- `to` over `in order to`
- `now` over `at this point in time`

Do not auto-replace terms of art. `Utilize` can be correct in technical/legal contexts; `leverage` can be literal in finance; `robust` can be meaningful if followed by the failure mode it resists.

## Nominalization repair

Nominalizations turn verbs into abstract nouns and often hide actors.

| Foggy | Clearer |
|---|---|
| The implementation of the migration was completed by the team. | The team completed the migration. |
| Confirmation of these reports cannot be obtained. | We cannot confirm these reports. |
| A review of the logs was performed. | Marta reviewed the logs. |

Search signals: `-tion`, `-ment`, `-ance`, `-ity`, plus weak verbs like `make`, `provide`, `perform`, `conduct`, `carry out`.

## Positive form

Replace evasive negatives with direct claims when meaning survives:

- `not on time` -> `late`
- `did not remember` -> `forgot`
- `not useful` -> `useless` or `low-value`, depending on tone
- `not required` -> `optional`

Keep negative form when contrast matters:

> Not a network outage; a certificate-expiry failure.

## Rhythm

- Average sentence length: 15-20 words is a useful target, not a rule.
- Flag sentences over 25 words for review.
- Avoid twelve identical short sentences in a row; that becomes choppy.
- A short sentence after a longer one lands harder.
- Read aloud. If the tongue stumbles, the reader's mind probably will too.

## Paragraph and section shape

- One paragraph = one topic.
- First sentence = point, claim, or transition.
- Last sentence = consequence, action, or bridge.
- Use bullets for 3+ parallel items.
- Use tables for comparisons.
- Use diagrams for flows, boundaries, and relationships.
- Headings are promises: `Why we chose Postgres over MySQL` beats `Background`.

## Global and L2-reader defaults

- Prefer literal phrasing over idioms.
- Avoid phrasal verbs when a direct verb works: `continue` instead of `carry on`, `cancel` instead of `call off`.
- Define acronyms at first use in each artifact.
- Keep parallel structures consistent.
- Avoid culture-bound jokes and cleverness when precision matters.

## High-stakes defaults

- Use literal wording.
- Name actors, conditions, deadlines, and ownership explicitly.
- Separate facts from hypotheses.
- Avoid softening that hides risk.
- Do not rewrite fixed legal, compliance, or policy wording unless the user explicitly asks and understands the risk.

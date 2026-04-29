# Core Doctrine

This skill synthesizes clear-writing craft, plain language, technical writing, operational communication, business writing, documentation architecture, and anti-AI-pattern guidance into one reusable workflow.

## Core model

Writing is model transfer. The writer has a mental model; words serialize it; the reader reconstructs it. Clarity means lowering reconstruction error.

Reader effort is the scarce resource. Optimize for retrieval, comprehension, action, and fidelity:

1. **Retrieval:** the reader can find what matters.
2. **Comprehension:** the reader understands it on the first pass.
3. **Action:** the reader knows what to do, decide, review, or remember.
4. **Fidelity:** the reader's model matches the writer's intent and evidence.

Do not optimize for the writer's appearance of effort, formality, cleverness, or exhaustiveness.

## Non-negotiable principles

1. **Reader task before writer knowledge**
- Ask what the reader must understand, decide, or do before asking what the writer knows.
- Sequence by reader need, not by the order in which the writer discovered the topic.

2. **Structure beats sentence polish**
- A buried lede with perfect grammar still fails.
- Fix purpose, genre, outline, and ordering before copyediting.

3. **Main point first unless narrative earns the delay**
- Lead with the outcome, ask, status, recommendation, claim, or takeaway for action artifacts.
- Blog posts and essays may delay the conclusion for tension, but never bury it by accident.

4. **Clear responsibility**
- Make the actor, action, object, and deadline easy to spot.
- Use active voice by default.
- When the wording is not fixed and the sentence states an obligation, prefer `must` over `shall`.

5. **Concrete language**
- Prefer specific nouns, strong verbs, dates, numbers, and examples.
- Replace vague qualifiers with exact detail when possible.
- Specificity is courage: a useful claim can be tested.

6. **Controlled cognitive load**
- Keep subject and verb close.
- Put the rule before the exception unless the exception is the real headline.
- Break dense thought into chunks.
- Use headings, bullets, and short paragraphs when they improve scanning.

7. **Reader-aware structure**
- Use BLUF for action-oriented writing.
- Use pyramid structure for decisions: answer, reasons, evidence, tradeoffs.
- Use Diátaxis for documentation: tutorial, how-to, reference, or explanation.
- Use narrative when the reader wants a journey, not just the answer.

8. **Honest concision**
- Remove filler, repetition, jargon, and nominalizations.
- Do not cut meaning just to make text shorter.
- Preserve cohesion when a connecting phrase helps the reader move from old information to new information.

9. **Evidence honesty**
- Separate observation, hypothesis, confirmed cause, decision, recommendation, risk, and open question.
- Strong language requires strong evidence.
- If evidence is missing, qualify the claim or ask for the missing fact.

10. **Voice preservation**
- Preserve the user's point of view, tone temperature, and useful signature phrasing.
- Make the text clearer without making it sound like everyone else.

11. **Teach through edits**
- When feedback is requested, explain patterns, not just corrections.
- Give advice the user can reuse in the next draft.

12. **Literal phrasing for wide audiences**
- For public, global, or non-expert audiences, avoid idioms, vague phrasal verbs, and culture-bound references.
- Define acronyms and technical terms at first use.

## Decision tree

Before drafting or editing, answer:

1. Who is the primary reader?
2. What do they already know?
3. What must they understand, decide, or do next?
4. What genre is this: message, email, post, doc, PR, commit, issue, ADR, design doc, incident update, postmortem, or explanation?
5. What evidence level is required?
6. What is explicitly in scope and out of scope?
7. What sentence should the reader see first?

If these answers are unavailable, infer the smallest safe assumption and state it briefly. Ask only when a wrong assumption would materially change the output.

## Mental models

- **BLUF:** bottom line up front for action, decision, review, and triage.
- **Inverted pyramid:** most important facts first; details in decreasing importance.
- **Minto pyramid:** answer -> 2-5 grouped reasons -> evidence. Best for recommendations and executive summaries.
- **Diátaxis:** documentation classified by reader need: tutorial, how-to, reference, explanation.
- **Old-to-new flow:** start sentences with known context and end with new information when cohesion matters.
- **One unit, one job:** one idea per sentence, one topic per paragraph, one reader question per section, one primary purpose per artifact.
- **Done-when:** state the verifiable end state for instructions, runbooks, and operational asks.

## Preserved tensions

- **Concision vs cohesion:** short artifacts prefer concision; longer arguments often need connective tissue.
- **Plain language vs precision:** avoid unnecessary jargon; keep necessary terms of art and define them.
- **Pyramid vs narrative:** use pyramid for decisions and coordination; use narrative when the reader expects discovery or reflection.
- **Voice vs accessibility:** personality helps public writing; literal phrasing helps global and high-stakes audiences.
- **Templates vs thinking:** templates prevent omissions but do not replace judgment.

## Diagnostic targets

Use these as editing signals, not rigid laws.

- Sentence length
  - target average: 15-20 words
  - target majority: 20 words or fewer
  - review flag: over 25 words

- Paragraph length
  - blog, email, LinkedIn, web: often 1-3 sentences
  - denser prose: usually 3-5 sentences, one topic each

- Readability
  - broad audience proxy: grade 6-9 or Flesch around 60-70
  - never chase the score at the expense of coherence

- Structure
  - one informative heading every 1-3 paragraphs in longer pieces
  - use lists for 3 or more parallel items when that makes scanning easier
  - use a table when comparing options or tradeoffs
  - use a diagram when flow, boundaries, or relationships matter more than prose

## Validation signals

- Paraphrase test
  - after one read, a reasonable reader should be able to restate the main point and next action in one sentence

- Task test
  - for instructions or documentation, the reader should be able to tell what to do next and how to confirm success

- Evidence test
  - facts, hypotheses, recommendations, and decisions should not sound equally certain

- Ten-second skim test
  - title, opening, headings, bullets, and close should reveal the core point without full reading

- Length constraints
  - if the user gives a word, character, or line limit, treat it as a hard requirement
  - cut optional examples and background before cutting core meaning

## Default assumptions

If the user does not specify an audience, assume:
- intelligent reader
- limited context
- limited time
- low tolerance for ambiguity or fluff

If the writing is public-facing, raise the bar for:
- clarity
- tone control
- evidence, caveats, and bounded claims
- jargon removal

If the audience may be global or non-native:
- avoid idioms and culture-bound references
- avoid phrasal verbs when a simpler verb works
- favor literal phrasing over cleverness

## Red flags

Rewrite aggressively when you see:
- buried main point
- unclear ownership
- front-loaded exceptions
- noun stacks
- vague pronouns
- undefined acronyms
- `and/or`
- filler lead-ins
- inflated or promotional language
- AI-style patterning
- long sentences that delay the verb
- unsupported certainty
- fake executive summaries that list topics but not conclusions
- diagrams, bullets, or headings used as decoration rather than navigation
- polished prose that removes the specific evidence that made the idea valuable

## Default editing order

1. Fix structure.
2. Fix evidence, certainty, responsibility, and action.
3. Fix paragraph/topic flow.
4. Fix sentence shape.
5. Fix wording.
6. Fix rhythm and tone.

That order preserves meaning better than line-editing first.

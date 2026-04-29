# Diagnostic and Rewrite Workflow

## Layered editing order

Edit from highest leverage to lowest:

1. **Audience and job:** who reads, what they know, what they must do next.
2. **Genre and evidence:** format, stakes, required proof, facts vs hypotheses.
3. **Structure:** lede, outline, headings, order, scope, non-goals.
4. **Paragraphs and sections:** topic sentences, one topic per paragraph, skim path.
5. **Sentences:** actor/action/target, subject-verb distance, old-to-new flow, stress at end.
6. **Words:** concrete nouns, strong verbs, filler cuts, acronym definitions, anti-AI cleanup.

Do not start with grammar or synonym swaps when the problem is purpose, structure, or evidence.

## Two-pass system

Use this for most rewrite work.

### Pass A: Diagnostic

Identify before editing:
- purpose: inform, request, decide, review, persuade, instruct, reflect, document, coordinate, preserve rationale
- audience: role, prior knowledge, native/non-native context, stakes, what they need, what they should do next
- genre: message, email, status, exec summary, blog, LinkedIn, docs, README, issue, PR, commit, ADR, design doc, incident, postmortem
- evidence level: private/lightweight, team/operational, durable, public/high-stakes
- voice anchors: point of view, cadence, emotional temperature, signature phrases
- hard constraints: facts, quotes, terminology, deadlines, names, numbers
- structure fit: BLUF, pyramid, inverted pyramid, narrative arc, Diátaxis, or genre template

Flag the highest-leverage problems:
- main point appears too late
- no clear actor or action
- facts, hypotheses, and recommendations blur together
- reader task and genre mismatch
- sentence chains are too long
- wording is vague, abstract, or padded
- paragraphs hold multiple ideas
- headings are labels instead of promises
- tone does not fit the audience
- wording sounds generic, bureaucratic, or AI-made

### Pass B: Reconstruction

Rewrite in this order:
1. Put the main point first.
2. Choose the right structure shape for the job.
3. Rebuild paragraph order for reader flow, not discovery order.
4. Label facts, assumptions, hypotheses, risks, owners, and next actions where relevant.
5. Tighten sentence structure.
6. Replace only the words that cause friction.
7. Restore rhythm, cohesion, and voice.

## Preservation hierarchy

When edits compete, protect in this order:
1. meaning and factual fidelity
2. stance and intent
3. recognizable voice
4. elegance and polish

## Minimal-change default

Do not rewrite more than necessary.

Prefer these moves first:
- cut filler
- move the key sentence earlier
- split overloaded sentences
- make pronouns concrete
- turn noun stacks and nominalizations back into verbs
- turn vague claims into testable claims or honest caveats
- swap a weak phrase for a direct one

Prefer these moves only when needed:
- full sentence recast
- paragraph merge or split
- tone recalibration
- stronger connective tissue
- adding evidence labels or explicit scope boundaries

## Major rewrite trigger

Treat as a major rewrite when any are true:
- the main point appears after the opening paragraph
- more than one third of sentences need structural recasting
- the order blocks comprehension
- the tone would likely mislead the intended reader
- the genre is wrong for the reader's job
- unsupported certainty creates operational or public-risk ambiguity

If a major rewrite happens, explain briefly:
- what blocked understanding
- what changed structurally
- what stayed the same
- what the user should practice next time

## Sentence-level rules

- Prefer subject -> verb -> object.
- Keep subject and verb close.
- Put the rule before the exception unless the exception is the real headline.
- Use one main idea per sentence when possible.
- Replace weak verb plus abstract noun with one clear verb.
- Replace vague qualifiers with specifics.
- Spell out choices instead of using `and/or`.
- Prefer `must` over `shall` when fixed legal wording is not required.
- Put the emphatic word or consequence at the end when rhythm matters.
- Keep connecting words when they preserve old-to-new flow.

## Paragraph-level rules

- One paragraph, one job.
- Start with the point or topic sentence.
- End with the consequence, action, or transition.
- Use bullets when prose hides parallel ideas.
- Read the first sentence of each paragraph in sequence; those sentences should form a skim-readable summary.

## Debugging workflow for weak drafts

Run these checks in order:

1. **First-sentence test:** Does the first sentence state the point, ask, status, hook, or decision?
2. **Paragraph-skim test:** Do paragraph openers form a summary?
3. **Genre-fit test:** Is this the right form for the reader's job?
4. **Evidence-label test:** Are observations, hypotheses, confirmed causes, decisions, and recommendations separated?
5. **Action test:** If coordination is needed, are owner, deadline, and next step explicit?
6. **Sentence-density test:** Flag sentences over 25 words, delayed verbs, and stacked clauses.
7. **Nominalization test:** Search for `-tion`, `-ment`, `-ance`, and weak `is/are/was/were` constructions.
8. **Pronoun test:** Replace vague `this`, `that`, and `it` with the noun at least once.
9. **Anti-pattern test:** Search for AI-slop, throat-clearing, decorative abstraction, and generic corporate endings.
10. **Paraphrase test:** Could the target reader paraphrase the point and next action after one read?

## Final self-check

Before returning the draft, confirm:
- the reader knows what matters in the first lines
- the user still sounds like themselves
- the reader could paraphrase the main point and next action after one read
- the new wording is clearer, not just different
- certainty matches evidence
- any major structural changes are explained briefly

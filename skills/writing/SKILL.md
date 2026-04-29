---
name: writing
description: "Draft, rewrite, critique, copyedit, or coach prose for humans to read: email, chat, LinkedIn, blogs, docs, READMEs, PRs, commits, issues, ADRs, design docs, incident updates, postmortems, status updates, executive summaries, instructions, and general writing. Use when the user asks for writing, editing, feedback, clearer/concise prose, Strunk-style polish, anti-AI-slop cleanup, or reusable writing coaching. Preserve meaning, evidence, constraints, and voice while improving reader-task fit."
---

# Writing

Purpose: reduce reader effort while preserving the user's meaning, evidence, constraints, stance, and recognizable voice.

## For / Not For

For:
- Drafting from notes, bullets, outlines, rough ideas, or a blank page.
- Rewriting, tightening, copyediting, restructuring, and anti-AI-pattern cleanup.
- Reviewing, critiquing, and coaching with excerpt-anchored feedback.
- Choosing the right format for the reader's task: BLUF, pyramid, narrative, Diátaxis, PR, commit, ADR, incident, or design-doc structure.
- Teaching reusable habits through concrete before/after examples and drills.

Not for:
- Inventing facts, citations, numbers, metrics, root causes, or source claims.
- Turning hypotheses into facts or unsupported claims into confident prose.
- Replacing the user's voice with generic assistant polish.
- Applying style rules mechanically when they hurt clarity, precision, or cohesion.
- Treating legal, medical, compliance, HR, or security-sensitive text as advice beyond writing quality.

## Archetype

Simple/Transformational by default, with Complex/Interview behavior for draft-from-scratch or high-variation artifacts.

Why:
- Most requests start with existing text, rough notes, or a mixed draft.
- Quality is both subjective and binary: the text should read better and remain faithful.
- Output variation is high, so diagnose the reader, task, genre, evidence level, and constraints before rewriting.
- Repeat use is expected, so keep coaching and reusable patterns built in.

## Mode Router

Detect the reader task first, then load only the smallest useful references. If multiple modes apply, merge references.

- `rewrite`
  - Trigger: rewrite, edit, tighten, improve, make this clearer, make this concise, make this sound better.
  - Load: `references/core-doctrine.md`
  - Load: `references/diagnostic-and-rewrite.md`
  - Load: `references/fact-preservation.md`
  - Load: `references/sentence-and-style-rules.md`
  - Load: `references/anti-patterns.md`
  - Load: `references/rubric-and-checklists.md`
  - Load: `references/format-playbooks.md` when format is explicit or inferable

- `rewrite+feedback`
  - Trigger: rewrite plus feedback intent such as critique, review, feedback, coaching notes, what should I improve.
  - Load all `rewrite` files.
  - Also load: `references/feedback-and-practice.md`

- `feedback-only`
  - Trigger: user wants critique or coaching without a full rewrite.
  - Load: `references/core-doctrine.md`
  - Load: `references/diagnostic-and-rewrite.md`
  - Load: `references/sentence-and-style-rules.md`
  - Load: `references/anti-patterns.md`
  - Load: `references/rubric-and-checklists.md`
  - Load: `references/feedback-and-practice.md`
  - Load: `references/format-playbooks.md` when format is explicit or inferable

- `draft`
  - Trigger: write from notes, bullets, outline, or rough ideas.
  - Load: `references/core-doctrine.md`
  - Load: `references/format-playbooks.md`
  - Load: `references/sentence-and-style-rules.md`
  - Load: `references/rubric-and-checklists.md`
  - Load: `references/anti-patterns.md`

- `copyedit-polish`
  - Trigger: copyedit, grammar, Strunk, concise, tighten sentences, polish line by line.
  - Load: `references/core-doctrine.md`
  - Load: `references/sentence-and-style-rules.md`
  - Load: `references/anti-patterns.md`
  - Load: `references/fact-preservation.md`

- `format-fit`
  - Trigger: choose a format, structure this, turn into an email/post/PR/ADR/doc, classify documentation, Diátaxis, BLUF, Pyramid.
  - Load: `references/core-doctrine.md`
  - Load: `references/format-playbooks.md`
  - Load: `references/rubric-and-checklists.md`

- `coach`
  - Trigger: teach me to write better, help me improve my writing, how can I make this clearer.
  - Load: `references/core-doctrine.md`
  - Load: `references/feedback-and-practice.md`
  - Load: `references/rubric-and-checklists.md`
  - Load: `references/format-playbooks.md` when the target format is explicit or inferable

- `operational-or-durable`
  - Trigger: incidents, postmortems, architecture, design docs, ADRs, PRs, commits, runbooks, status updates, executive summaries.
  - First detect the primary mode.
  - Load the files for that primary mode.
  - Also load: `references/format-playbooks.md`
  - Also load: `references/fact-preservation.md`
  - Separate facts, hypotheses, decisions, risks, owners, and next actions.

- `high-stakes-or-global`
  - Trigger: public statement, sensitive message, policy/compliance copy, security-sensitive wording, international or non-native audience.
  - First detect the primary mode: `draft`, `rewrite`, `rewrite+feedback`, `feedback-only`, or `coach`.
  - Load the files for that primary mode.
  - Also load: `references/fact-preservation.md`
  - Also load: `references/anti-patterns.md`
  - Also load: `references/rubric-and-checklists.md`
  - Tighten wording for clarity, literalness, explicit ownership, and low ambiguity.

## Input Schema

Required:
- `task_type`: draft | rewrite | review | feedback | coach

Required unless the user wants general coaching without a sample:
- `text_or_points`: source text, notes, bullets, or idea fragments

Optional:
- `format`: general | email | chat | meeting-request | status-update | executive-summary | blog | linkedin | documentation | readme | github-issue | pr-description | commit-message | adr | design-doc | incident-update | postmortem
- `audience`: reader description
- `constraints`: length, tone, must-keep phrases, CTA, deadline, taboo words
- `evidence_level`: lightweight | operational | public | high-stakes
- `feedback_requested`: true when critique/coaching is explicit or strongly implied
- `must_preserve`: exact phrases, legal wording, quotes, numbers, terminology

Default interpretation:
- `review` means `rewrite+feedback` unless the user clearly asks for feedback only or rewrite only.
- `feedback` means `feedback-only` unless the user also asks for a full rewrite.
- `rewrite only` means stay in `rewrite` mode and skip coaching feedback.

## Default Strategy

- Reader task before writer knowledge: ask what the reader must understand, decide, or do.
- Structure before sentence polish: fix the lede, sequence, headings, and evidence before line edits.
- If the reader must act, decide, approve, review, or triage, use BLUF: put the ask, decision, status, or takeaway in the first 1-2 sentences.
- If the piece argues for a decision, use pyramid structure: answer -> reasons -> evidence -> tradeoffs.
- If the piece documents a task or concept, classify it with Diátaxis before drafting: tutorial, how-to, reference, or explanation.
- If the piece is operational, label observations, hypotheses, confirmed causes, decisions, risks, mitigations, owners, and next update/action.
- If the audience is broad, public, global, or non-native, favor literal wording, defined terms, low ambiguity, and fewer idioms.
- Treat readability metrics as warning lights, not finish lines.

## Output Contract

Mode-specific return rules:

- `draft`
  1. Return the full draft.
  2. Return a short rationale.

- `rewrite` and `rewrite+feedback`
  1. Return the revised text.
  2. Return a short rationale.

- `feedback-only`
  1. Do not rewrite the full piece unless the user asks.
  2. Return excerpt-anchored critique.
  3. Return 1-2 model rewrites only for the highest-leverage issues.

- `coach`
  1. Return habits, drills, and checkpoints.
  2. Add sample rewrites only when the user supplied text and would benefit from an example.

Return when relevant:
- `Major rewrite note`
  - Use when structure changed substantially.
- `Evidence note`
  - Use when the draft lacked evidence for a claim, certainty changed, or a fact was preserved but reframed.
- `Coaching feedback`
  - Use when user asks for feedback or coaching.
- `Self-edit practice`
  - Use when the user wants to learn or improve.

`Coaching feedback` format:
- `Keep`: 1-2 strengths worth repeating.
- `Change`: 3-5 highest-leverage fixes tied to specific patterns.
- `Practice`: 1 habit and 1 short drill for the next draft.

When the user explicitly says `do not rewrite`, respect that and stay in `feedback-only` or `coach` mode.

## Minimal Workflow

1. Diagnose purpose, audience, and the next action the reader should take.
2. Identify genre, channel, stakes, evidence level, and hard constraints.
3. Identify what must stay fixed: facts, meaning, stance, terminology, quotes, numbers, and voice anchors.
4. Choose the execution path by mode:
   - `draft`: build a fresh draft with the matching format playbook when available
   - `rewrite`: run Pass B reconstruction, choose the right structure shape, and use the format playbook when the format is explicit or inferable
   - `rewrite+feedback`: run Pass B reconstruction, then explain the changes and the reusable lesson
   - `feedback-only`: skip full reconstruction and give excerpt-anchored critique plus limited model rewrites
   - `copyedit-polish`: preserve structure unless it fails the lede, paragraph, or evidence checks
   - `format-fit`: recommend the structure first, then draft or rewrite only if asked
   - `coach`: teach patterns, habits, and drills; use sample rewrites only when useful
5. Run the checklist, paraphrase test, and internal rubric.
6. If feedback is active, explain what changed and how the user can do it alone next time.

## Guardrails

- Preserve meaning first, voice second, polish third.
- Prefer reordering, trimming, and clarifying before synonym swapping.
- Keep signature wording when it is clear enough to survive.
- Default to active voice, but keep passive when the actor is unknown, irrelevant, or less important than the receiver.
- Do not over-apply concision when Williams-style cohesion or old-to-new flow carries the reader through an argument.
- Make responsibility explicit: who does what, by when, and why it matters.
- Spell choices out instead of using ambiguous shortcuts like `and/or`.
- Define acronyms and technical terms at first use when the audience may not know them.
- Use readability metrics as warning lights, not goals to game.
- For global or non-native audiences, avoid idioms, phrasal verbs, and culture-bound references when a literal alternative works.
- Avoid AI-sounding filler, inflated claims, and generic business fog.
- If the user gives a hard length limit, honor it before optional polish.
- If audience is missing, assume an intelligent but busy reader with limited context.

## Failure Modes and Recovery

- Missing audience context
  - Recovery: infer a likely reader and state the assumption briefly.
- Wrong genre or mode
  - Recovery: recommend the right format and explain what failure it prevents.
- Over-editing erases the user's voice
  - Recovery: restore voice anchors and reduce substitution.
- Concision removes needed meaning
  - Recovery: restore critical context and cut syntax bloat instead.
- Unsupported certainty
  - Recovery: downgrade to hypothesis, add evidence needed, or ask for source facts.
- Feedback becomes generic
  - Recovery: tie each point to a line, phrase, or repeatable pattern.
- Draft sounds polished but bland
  - Recovery: keep the user's natural cadence and concrete wording where possible.
- High-stakes copy remains ambiguous
  - Recovery: make actors, deadlines, conditions, and next steps explicit.

## Quality Bar

- Final text passes the pass/fail checklist in `references/rubric-and-checklists.md`.
- Internal scores are at least 4/5 for clarity, structure, reader-task fit, tone fit, voice preservation, and factual fidelity.
- A reasonable reader could paraphrase the main message and next action after one read.
- Operational, public, or durable writing labels uncertainty and preserves rationale.
- Feedback is specific enough that the user can apply it in the next draft without guessing.

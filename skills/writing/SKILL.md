---
name: writing
description: Use when the user asks to draft, rewrite, review, critique, or coach prose for humans to read, including emails, blog posts, LinkedIn posts, status updates, executive summaries, documentation, instructions, and general writing. Preserves meaning and voice while making text clearer, more direct, more scannable, and easier to use, and can teach reusable writing habits.
---

# Writing

Purpose: make text easier to find, understand, and use without flattening the user's meaning, wording, or voice.

## For / Not For

For:
- Rewriting text to be clearer, more direct, and easier to use.
- Preserving the user's intent, stance, and recognizable phrasing while removing friction.
- Drafting from notes for email, blog, LinkedIn, status updates, executive summaries, documentation, instructions, and general prose.
- Giving feedback that helps the user improve their own writing habits.
- Coaching through concrete examples, rewrite rationale, and repeatable drills.

Not for:
- Inventing facts, citations, numbers, or source claims.
- Changing the user's argument, audience, or tone without a clear reason.
- Replacing all of the user's wording just to sound polished.
- Turning specific writing into generic assistant prose.
- Gaming readability scores or applying style rules mechanically when they hurt clarity.
- Acting as legal, medical, or compliance advice beyond writing quality.

## Archetype

Recommend Simple/Transformational with two-pass diagnostics and an optional coaching layer.

Why:
- Most requests start with existing text, rough notes, or a mixed draft.
- Quality is both subjective and binary: the text must feel better and remain faithful.
- Output variation is high, so diagnose before rewriting.
- Repeat use is expected, so keep coaching and reusable patterns built in.

## Mode Router

Detect the job first. If multiple modes apply, merge the relevant references.

- `rewrite`
  - Trigger: rewrite, edit, tighten, improve, make this clearer, make this concise.
  - Load: `references/core-doctrine.md`
  - Load: `references/diagnostic-and-rewrite.md`
  - Load: `references/fact-preservation.md`
  - Load: `references/format-playbooks.md` when format is explicit or inferable
  - Load: `references/anti-patterns.md`
  - Load: `references/rubric-and-checklists.md`

- `rewrite+feedback`
  - Trigger: rewrite plus feedback intent such as critique, review, feedback, coaching notes, what should I improve.
  - Load all `rewrite` files.
  - Also load: `references/feedback-and-practice.md`

- `feedback-only`
  - Trigger: user wants critique or coaching without a full rewrite.
  - Load: `references/core-doctrine.md`
  - Load: `references/format-playbooks.md` when format is explicit or inferable
  - Load: `references/anti-patterns.md`
  - Load: `references/rubric-and-checklists.md`
  - Load: `references/feedback-and-practice.md`

- `draft`
  - Trigger: write from notes, bullets, outline, or rough ideas.
  - Load: `references/core-doctrine.md`
  - Load: `references/format-playbooks.md`
  - Load: `references/rubric-and-checklists.md`
  - Load: `references/anti-patterns.md`

- `coach`
  - Trigger: teach me to write better, help me improve my writing, how can I make this clearer.
  - Load: `references/core-doctrine.md`
  - Load: `references/format-playbooks.md` when the target format is explicit or inferable
  - Load: `references/feedback-and-practice.md`
  - Load: `references/rubric-and-checklists.md`

- `high-stakes-or-global`
  - Trigger: public statement, sensitive message, policy/compliance copy, international or non-native audience.
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
- `format`: general | email | meeting-request | status-update | executive-summary | blog | linkedin | documentation | technical-doc
- `audience`: reader description
- `constraints`: length, tone, must-keep phrases, CTA, deadline, taboo words
- `feedback_requested`: true when critique/coaching is explicit or strongly implied
- `must_preserve`: exact phrases, legal wording, quotes, numbers, terminology

Default interpretation:
- `review` means `rewrite+feedback` unless the user clearly asks for feedback only or rewrite only.
- `feedback` means `feedback-only` unless the user also asks for a full rewrite.
- `rewrite only` means stay in `rewrite` mode and skip coaching feedback.

## Default Strategy

- If the reader must act, decide, or approve something, use BLUF: put the ask, decision, or takeaway in the first 1-2 sentences.
- If the piece explains a process, use goal -> prerequisites -> steps -> verification -> next step.
- If the audience is broad, public, global, or non-native, favor literal wording, short sentences, defined terms, and low-ambiguity phrasing.
- If wording is not legally fixed and the sentence states an obligation, prefer `must` over `shall`.
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
2. Identify what must stay fixed: facts, meaning, stance, and voice anchors.
3. Run Pass A diagnostic before making large edits.
4. Choose the execution path by mode:
   - `draft`: build a fresh draft with the matching format playbook when available
   - `rewrite`: run Pass B reconstruction, choose the right structure shape, and use the format playbook when the format is explicit or inferable
   - `rewrite+feedback`: run Pass B reconstruction, then explain the changes and the reusable lesson
   - `feedback-only`: skip full reconstruction and give excerpt-anchored critique plus limited model rewrites
   - `coach`: teach patterns, habits, and drills; use sample rewrites only when useful
5. Run the checklist, paraphrase test, and internal rubric.
6. If feedback is active, explain what changed and how the user can do it alone next time.

## Guardrails

- Preserve meaning first, voice second, polish third.
- Prefer reordering, trimming, and clarifying before synonym swapping.
- Keep signature wording when it is clear enough to survive.
- Default to active voice, but keep passive when the actor is unknown, irrelevant, or less important than the receiver.
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
- Over-editing erases the user's voice
  - Recovery: restore voice anchors and reduce substitution.
- Concision removes needed meaning
  - Recovery: restore critical context and cut syntax bloat instead.
- Feedback becomes generic
  - Recovery: tie each point to a line, phrase, or repeatable pattern.
- Draft sounds polished but bland
  - Recovery: keep the user's natural cadence and concrete wording where possible.
- High-stakes copy remains ambiguous
  - Recovery: make actors, deadlines, conditions, and next steps explicit.

## Quality Bar

- Final text passes the pass/fail checklist in `references/rubric-and-checklists.md`.
- Internal scores are at least 4/5 for clarity, concision, structure, tone fit, voice preservation, and factual fidelity.
- A reasonable reader could paraphrase the main message and next action after one read.
- Feedback is specific enough that the user can apply it in the next draft without guessing.

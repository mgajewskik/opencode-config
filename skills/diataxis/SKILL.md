---
name: diataxis
description: Apply the Diátaxis documentation framework to learn the model, classify documentation, reformat existing docs, and draft new tutorials, how-to guides, reference, and explanation. Use when the user mentions Diátaxis, tutorial vs how-to, reference vs explanation, documentation quadrants, restructuring docs by user need, or writing docs in Diátaxis style.
metadata:
  author: local
  version: "0.1"
---

# Diátaxis

Use Diátaxis as a practical guide for documentation decisions, rewriting, and drafting.

The framework is about **user need first**. Decide what kind of help the reader needs, then write in the form that serves that need.

## Purpose / Not For

Use this skill to:
- learn what Diátaxis is and why it works
- classify a page, section, or sentence as tutorial, how-to, reference, or explanation
- diagnose mixed-mode documentation and recommend the smallest clean split or rewrite
- reformat existing documentation into clearer Diátaxis-aligned shapes
- draft new documentation in the right Diátaxis mode
- reason about documentation hierarchy, landing pages, and organic restructuring

Out of scope by default:
- proving technical accuracy, completeness, or product correctness on its own
- forcing every documentation set into four empty top-level folders
- choosing document type based on topic difficulty, audience seniority, or vibes alone
- treating the older Divio presentation as the canonical source

## Archetype

Recommend **Complex** with a compass-based router.

Why:
- users may want theory, classification, audit/reformatting, or drafting
- the same framework powers all modes, but each mode needs different instructions
- progressive loading matters because each quadrant has distinct writing rules and failure modes

## Canonical Source Rule

- Treat `https://diataxis.fr/` as canonical.
- Use `documentation.divio.com` only when the user explicitly asks for history or comparison, and mark it as an older, partially superseded presentation.
- Use the GitHub repository only for source/citation context, not to override the rendered site.

Load `references/theory-quality-and-sources.md` when source authority, history, or theory matters.

## Mode Router

Detect the job first. If the request spans multiple modes, start with `classify`, then continue.

- `learn-or-explain`
  - Trigger: what is Diátaxis, why does it work, teach me the framework, explain tutorials vs how-to, explain reference vs explanation.
  - Load: `references/compass-and-core.md`
  - Load: `references/theory-quality-and-sources.md` when the question is about theory, quality, source authority, history, or why the framework claims four forms.
  - Load the relevant quadrant file when the question is type-specific.

- `classify`
  - Trigger: what kind of documentation is this, which quadrant does this belong in, tutorial or how-to, reference or explanation.
  - Load: `references/compass-and-core.md`
  - Load: `references/distinctions-and-failure-modes.md`
  - Load the most likely quadrant files only if the edge case needs deeper guidance.

- `audit-or-reformat`
  - Trigger: review this documentation, convert this to Diátaxis, reformat existing docs, fix mixed documentation, split this page by Diátaxis.
  - Load: `references/compass-and-core.md`
  - Load: `references/audit-and-restructure.md`
  - Load: `references/distinctions-and-failure-modes.md`
  - Load the source and target quadrant files that match the material being changed.

- `draft`
  - Trigger: write a tutorial, write a how-to, write reference docs, write explanation, draft docs in Diátaxis style.
  - Load: `references/compass-and-core.md`
  - Load the chosen quadrant file.
  - Load: `references/distinctions-and-failure-modes.md` if the request risks blending modes.

- `architecture-or-hierarchy`
  - Trigger: reorganize docs, design information architecture, structure landing pages, handle complex hierarchies, multi-audience docs.
  - Load: `references/compass-and-core.md`
  - Load: `references/audit-and-restructure.md`
  - Load: `references/theory-quality-and-sources.md` when the why behind the structure matters.

## Core Decision Rule

Use the Diátaxis compass before making or revising documentation:

1. Does this content primarily **inform action** or **inform cognition**?
2. Does it primarily serve the reader’s **study** or **work**?

Mapping:
- action + study = tutorial
- action + work = how-to guide
- cognition + work = reference
- cognition + study = explanation

If the content mixes answers, treat that as a signal to split, move, trim, or rewrite — not as a reason to blur the categories.

## Global Rules

- Decide document type from the **reader’s need**, not the writer’s topic list.
- Preserve clean boundaries between quadrants. Link out instead of stuffing other modes into the page.
- Use the smallest useful improvement step. Diátaxis is a guide for iteration, not a top-down migration plan.
- Do not create empty tutorial / how-to / reference / explanation shells just to satisfy the diagram.
- Complex hierarchies are allowed. Four documentation types do **not** mean exactly four top-level sections.
- Functional quality still matters. Diátaxis improves fit, flow, and clarity, but it does not by itself prove accuracy or completeness.
- When intuition and the compass disagree, trust the compass.
- For audits, classify at the smallest level that changes the decision: sentence, paragraph, section, page, or hierarchy.

## Output Contract

- `learn-or-explain`
  - explain the chosen distinction or principle plainly
  - include the compass reasoning when relevant
  - name the next most useful reference to load

- `classify`
  - return the most likely quadrant
  - show the action/cognition and study/work reasoning
  - name the strongest conflicting signals, if any

- `audit-or-reformat`
  - identify the current dominant mode or mixed modes
  - call out boundary violations
  - recommend the smallest concrete restructuring moves
  - rewrite only as far as needed to fit the target mode cleanly

- `draft`
  - state the chosen quadrant briefly
  - draft in the language and structure of that quadrant
  - avoid importing content from neighboring quadrants unless clearly linked out

- `architecture-or-hierarchy`
  - recommend a user-first structure
  - explain why it fits Diátaxis without pretending the framework demands only one hierarchy pattern

## Failure Modes

- Mixed tutorial/how-to pages that both teach and direct work
- Reference pages that explain or instruct instead of describing
- Explanation pages that absorb steps, API facts, or setup directions
- Restructuring efforts that begin with empty boxes instead of content improvements
- Using beginner/advanced as the main axis instead of study/work

Load `references/distinctions-and-failure-modes.md` and `references/audit-and-restructure.md` when these appear.

# Explanation

Primary source: https://diataxis.fr/explanation/

## What explanation is

Explanation is **understanding-oriented discussion**.

It helps the reader step back from immediate work and build a richer mental model: context, reasons, history, tradeoffs, alternatives, and implications.

Explanation serves readers who are **at study**, stepping back to build a richer mental model.

## Core principles

- Provide context and background.
- Make connections across topics.
- Talk about the subject, not just through it.
- Use a real or implied **why** question to bound the discussion.
- Admit opinion, perspective, alternatives, and tradeoffs where appropriate.
- Keep explanation closely bounded so it does not absorb other doc types.

## Good subjects for explanation

- why the system is designed this way
- tradeoffs between approaches
- historical context
- conceptual overviews
- architecture rationale
- comparisons, alternatives, and implications

## Language patterns

Prefer:
- `The reason…`
- `Historically…`
- `One tradeoff is…`
- `Some teams prefer x because…`
- `This is analogous to…`

Avoid:
- imperative step lists
- exhaustive factual listings
- stuffing task instructions into the discussion

## Naming guidance

Explanation titles often work well when they imply `About…`, for example:
- `About tenancy models`
- `Why the cache is write-through`
- `Database connection strategy`

## Explanation checklist

Pass when most are true:
- the page deepens understanding rather than directing action
- the page provides rationale, context, or perspective
- the topic boundary is clear enough that the page does not sprawl infinitely
- opinion and alternatives are used in service of understanding
- steps and raw specification are linked out instead of embedded

Warning signs:
- the page starts telling the reader what to do next
- it contains reference tables or API listings
- it becomes a tutorial by trying to teach through a managed exercise
- it keeps expanding because the topic was never bounded by a question

## Minimal rewrite moves toward explanation form

- extract steps into tutorials or how-to guides
- extract raw facts and option lists into reference
- rewrite headings around reasons, concepts, or tradeoffs
- add history, design intent, and comparisons where they help understanding

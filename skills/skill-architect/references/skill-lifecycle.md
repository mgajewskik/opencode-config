# Skill Lifecycle

Use this reference when the user needs more than architecture alone: drafting, testing, benchmarking, review, or iterative improvement.

## Lifecycle Overview

Treat skill work as a loop, not a one-shot writing task:

1. Capture intent
2. Draft or refactor the skill
3. Create realistic eval prompts
4. Run with-skill and baseline comparisons
5. Grade objective expectations
6. Review outputs with a human for subjective quality
7. Improve the skill based on evidence
8. Repeat until the user is satisfied or progress stalls

## Stage 1: Capture Intent

Before asking questions, mine the current conversation for:

- user phrasing that should become trigger language
- the workflow they are trying to encode
- corrections that reveal hidden requirements
- examples of good or bad outputs
- environment constraints such as headless execution or missing tools

Then fill any remaining gaps:

1. What should this skill enable Claude to do?
2. When should it trigger?
3. What output matters most to the user?
4. What counts as success?
5. Should the skill be judged qualitatively, quantitatively, or both?

## Stage 2: Draft or Refactor

Design the structure first. The usual order is:

1. Choose archetype
2. Decide what belongs in `SKILL.md`
3. Move deep guidance into `references/`
4. Add deterministic or repeated work to `scripts/`
5. Add grading/comparison instructions to `agents/` only if needed

The draft should be architecture-correct before it is benchmark-perfect.

## Stage 3: Create Realistic Evals

Good evals sound like real user requests, not sterile test fixtures.

### Good eval qualities

- concrete user intent
- realistic context and constraints
- enough detail that the skill would actually help
- variety across obvious cases, paraphrases, and edge cases

### Weak eval qualities

- too short to require a skill
- only exact-keyword matches
- obviously irrelevant negative cases
- prompts that reward surface compliance instead of real task completion

Use at least one of each:

- straightforward should-succeed prompt
- paraphrased or indirect prompt
- edge case or ambiguous prompt
- near-miss prompt that should not trigger or should fail gracefully

## Stage 4: Choose the Right Baseline

The baseline depends on what you are improving:

| Situation | Baseline |
|----------|----------|
| New skill | No skill |
| Existing skill revision | Prior version of the skill |
| Description tuning only | Current description |
| Architectural refactor | Previous structure or current production version |

If you are improving an existing skill, snapshot the old version before editing so the comparison stays honest.

## Stage 5: Run Evaluations

Use the lightest rigorous loop that still gives believable evidence.

### Minimal loop

- run the skill on a few representative prompts
- inspect outputs
- ask the user what is wrong
- revise

### Standard loop

- run with-skill and baseline versions
- save outputs and transcripts in iteration directories
- write `eval_metadata.json` per eval
- add assertions only for objectively verifiable outcomes
- save timing and token data when available
- aggregate results across runs

### Strong loop

- use repeated runs for variance-sensitive tasks
- compare pass rate, time, token usage, and user corrections
- run blind comparisons if output quality is subjective and close

## Assertions

Assertions should be discriminating.

Good assertions:

- fail when the skill did not truly do the work
- can be checked from outputs or transcripts
- are specific enough to be meaningful

Weak assertions:

- file exists
- keyword present
- generic format check with no content validation

When a task is subjective, do not force everything into assertions. Use human review for taste, clarity, or strategic quality.

## Human Review

For subjective tasks, the user must see outputs before you optimize around them.

When collecting feedback, ask:

- what specifically feels wrong
- which outputs are already good enough
- whether the problem is structure, quality, or over-constraining behavior

Treat empty feedback as a soft pass, but still inspect transcripts for wasteful behavior.

## How To Improve the Skill

When revising:

1. Generalize from the complaint instead of hardcoding around one prompt
2. Remove instructions that are not pulling their weight
3. Explain why a behavior matters instead of stacking brittle MUST rules
4. Notice repeated helper work across runs and move it into `scripts/`
5. Tighten routing so the right reference loads at the right time

### Signs the skill is overfitting

- new wording only helps one eval prompt
- the description grows into a keyword dump
- the skill gets longer without becoming clearer
- transcripts show the model spending time on ritual instead of outcome

## Iteration Exit Conditions

Keep iterating until one of these is true:

- the user says the skill is good
- feedback is empty across representative cases
- the skill outperforms baseline clearly enough for the intended use
- further changes are no longer producing meaningful improvement

If you stop because progress flattened out, say so explicitly and recommend the smallest next experiment.

## Directory Pattern

Use a workspace outside the skill directory when running iterative evals.

Suggested layout:

```text
skill-architect-workspace/
├── iteration-1/
│   ├── eval-0/
│   │   ├── with_skill/
│   │   ├── without_skill/
│   │   └── eval_metadata.json
│   └── benchmark.json
└── iteration-2/
```

See `references/schemas.md` for artifact shapes.

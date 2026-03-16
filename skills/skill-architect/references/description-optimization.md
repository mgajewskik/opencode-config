# Description Optimization

Use this reference when the user wants the skill to trigger more reliably.

## Goal

Improve the `description` field so the skill triggers for the right user intents and stays quiet for near-misses.

The description is the only part visible before the skill loads. If it is vague, the skill undertriggers. If it is too broad, the skill overtriggers.

## Core Rules

- optimize for user intent, not internal implementation details
- describe WHAT the skill helps with and WHEN to use it
- include trigger language, but do not devolve into an endless keyword list
- stay comfortably below the 1024-character hard limit
- prefer general categories of intent over memorized examples

## Build a Trigger Eval Set

Create 16-24 realistic queries with a mix of:

- should-trigger cases
- should-not-trigger near-misses
- indirect phrasing where the user needs the skill without naming it
- ambiguous boundary cases where another skill might compete

### Good positive cases

- concrete problem statements
- enough context that a skill would actually help
- varied tone: formal, casual, rushed, typo-heavy, indirect

### Good negative cases

- close neighbors that share keywords but need a different skill
- requests that mention adjacent concepts but not this workflow
- prompts where the skill would be unnecessary because the task is trivial

### Bad cases

- generic one-liners like `make a chart`
- unrelated negatives like `write fibonacci` unless the domain is extremely broad
- prompts so trivial the model would never consult a skill anyway

## Review Strategy

Before running optimization, inspect the eval set for coverage:

- obvious match
- paraphrase match
- indirect intent match
- competitive near-miss
- false-friend keyword overlap

If the eval set is weak, fix that before touching the description.

## Workflow

### Manual pass

1. Read the current description
2. Identify undertriggering and overtriggering risks
3. Draft 2-3 distinct description variants
4. Explain the tradeoff of each variant

### Scripted pass

Use the scripts in `scripts/` when you are in an OpenCode environment:

```bash
uv run scripts/run_eval.py --eval-set evals/trigger-evals.json --skill-path path/to/skill
uv run scripts/improve_description.py --eval-results path/to/results.json --skill-path path/to/skill --model <model>
uv run scripts/run_loop.py --eval-set evals/trigger-evals.json --skill-path path/to/skill --model <model>
```

These scripts currently use `opencode run --agent smart --format json` to test whether the skill was actually invoked.

For other runtimes, keep the same eval design and reporting logic, but replace the backend-specific invocation path or run the trigger review manually.

Use the current session model when practical so the results match the user's actual runtime behavior.

## Interpreting Failures

### Undertriggering

Symptoms:

- obvious intents fail to load the skill
- paraphrases fail even though exact keywords work
- users must ask for the skill by name

Usually fix with:

- clearer intent language
- stronger trigger scenarios
- more direct description of the problem class

### Overtriggering

Symptoms:

- the skill loads on adjacent tasks
- keyword overlap beats actual intent
- the skill competes badly with more specific skills

Usually fix with:

- more precise problem framing
- clearer boundaries
- removal of vague broad claims

## Anti-Patterns

NEVER do these:

- append every failed query as a new keyword fragment
- describe only internal mechanics such as scripts or folder layout
- make the description so broad that it becomes a fallback skill for everything
- optimize entirely on a tiny train set and ignore held-out behavior

## Good Output Shape

A strong description usually does all of this in 2-4 sentences:

1. names the kind of work
2. names the situations where the skill should be used
3. makes the skill distinctive relative to neighboring skills
4. keeps implementation details out unless they define the usage boundary

## Reporting

When the loop finishes, show:

- original description
- best description
- train/test score or equivalent metrics
- notable false positives or false negatives
- one sentence on why the winning description is better

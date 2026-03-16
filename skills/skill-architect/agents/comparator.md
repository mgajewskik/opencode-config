# Blind Comparator

Use this guide when comparing two outputs without knowing which skill produced which.

## Goal

Pick the better output based on task success and quality, not on bias toward a known skill version.

## Inputs

- `output_a_path`
- `output_b_path`
- `eval_prompt`
- optional `expectations`

## Workflow

1. Inspect output A and output B directly
2. Infer what the prompt actually requires
3. Create a compact rubric for content and structure
4. Score both outputs
5. Use expectations as secondary evidence, not the whole decision
6. Choose a winner or declare a tie only if they are genuinely indistinguishable

## Rubric Template

Evaluate both outputs on:

- correctness
- completeness
- task fit
- organization
- usability

Adapt the rubric to the task. For a skill artifact, that may mean trigger clarity, portability, structural discipline, and reuse value.

## Output Shape

Write a JSON result containing:

- `winner`
- `reasoning`
- per-output rubric scores
- any notable expectation differences

Be decisive. Ties should be rare.

# Skill Evaluation Grader

Use this guide when grading an eval run for a skill.

## Goal

Judge whether each expectation truly passed, and provide evidence strong enough that someone else could audit the decision.

## Inputs

- `expectations`: list of assertions to check
- `transcript_path`: transcript of the execution
- `outputs_dir`: directory containing produced artifacts

## Workflow

1. Read the transcript completely
2. Inspect output files directly rather than trusting the transcript summary
3. Evaluate each expectation against real evidence
4. Extract important implicit claims and verify them where possible
5. Flag weak or non-discriminating assertions if they create false confidence

## Pass / Fail Standard

### PASS only when

- there is clear evidence the expectation is true
- the evidence reflects genuine task completion, not surface compliance
- the claim can be verified from available artifacts

### FAIL when

- evidence is missing
- evidence contradicts the expectation
- the expectation is too weak to distinguish success from a wrong output
- the claim cannot actually be verified from the artifacts

When uncertain, fail the expectation and explain the uncertainty.

## What To Watch For

- correct filename but wrong contents
- valid frontmatter but poor triggering boundary
- polished formatting masking missing requirements
- transcript claims unsupported by outputs
- assertions that would pass even for a bad result

## Output Shape

Write `grading.json` using this structure:

```json
{
  "expectations": [
    {
      "text": "The output includes X",
      "passed": true,
      "evidence": "Quoted evidence here"
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 0,
    "total": 1,
    "pass_rate": 1.0
  }
}
```

Use the exact field names `text`, `passed`, and `evidence`.

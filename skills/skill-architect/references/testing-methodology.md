# Testing Methodology

## Three Testing Types

### 1. Triggering Tests

**Goal:** Skill loads at right times, not wrong times.

**Test cases:**
- ✅ Triggers on obvious tasks (exact keywords)
- ✅ Triggers on paraphrased requests (synonyms, different phrasing)
- ❌ Doesn't trigger on unrelated topics

**Example test suite:**
```
Should trigger:
- "Help me set up a new ProjectHub workspace"
- "I need to create a project in ProjectHub"
- "Initialize a ProjectHub project for Q4 planning"

Should NOT trigger:
- "What's the weather in San Francisco?"
- "Help me write Python code"
- "Create a spreadsheet"
```

**Measurement:** Run 10-20 test queries. Track automatic loads vs manual invocations. Target: 90%+ correct triggers.

**Debugging:** Ask Claude "When would you use the [skill-name] skill?" - it quotes description back. Adjust based on gaps.

---

### 2. Functional Tests

**Goal:** Skill produces correct outputs.

**Test cases:**
- Valid outputs generated
- API/tool calls succeed
- Error handling works
- Edge cases covered

**Example:**
```
Test: Create project with 5 tasks
Given: Project name "Q4 Planning", 5 task descriptions
When: Skill executes workflow
Then:
  - Project created in target system
  - 5 tasks created with correct properties
  - All tasks linked to project
  - No API errors
```

**For transformation skills:** Run same input 3-5 times, compare outputs for structural consistency.

---

### 3. Performance Comparison

**Goal:** Prove skill improves results vs baseline (no skill).

**Metrics to compare:**

| Metric | Without Skill | With Skill |
|--------|---------------|------------|
| Back-and-forth messages | 15 | 2 |
| Failed API calls | 3 | 0 |
| Tokens consumed | 12,000 | 6,000 |
| User corrections needed | 5 | 0 |

---

## Evaluation Ladder

Pick the lightest level that still gives believable evidence.

### Level 1: Manual Spot Check

Use for:

- brand-new skills in early drafting
- one-off architecture sanity checks
- environments without automation support

Do:

- run 2-3 realistic prompts
- inspect outputs directly
- note obvious gaps before writing more eval machinery

### Level 2: Baseline Comparison

Use for:

- reusable skills
- claims that the skill improves quality or efficiency
- refactors where the old version already works somewhat

Do:

- compare `with_skill` vs `without_skill` or prior-version runs
- keep prompts identical across both sides
- save transcripts and outputs separately
- inspect not just final artifacts but also wasted execution patterns

### Level 3: Iterative Benchmarking

Use for:

- skills expected to be reused heavily
- trigger-boundary optimization
- close comparisons between competing designs

Do:

- run multiple evals across multiple iterations
- collect pass rate, time, token, and user-correction signals
- aggregate instead of cherry-picking a single good run

For the full loop, also read `references/skill-lifecycle.md`.

---

## Success Criteria

Define before building. Aspirational targets, not precise thresholds.

### Quantitative

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Trigger accuracy | 90%+ | Run 10-20 test queries, count correct triggers |
| Tool call efficiency | X calls | Compare with/without skill for same task |
| API failure rate | 0 | Monitor logs during test runs |

### Qualitative

| Metric | How to Assess |
|--------|---------------|
| No prompting needed | During testing, note redirects/clarifications needed |
| No user correction | Run same request 3-5x, compare consistency |
| First-try success | Can new user accomplish task with minimal guidance? |

---

## Testing Process

### Pro Tip: Single Task First

Iterate on ONE challenging task until Claude succeeds, then extract winning approach into skill. Faster signal than broad testing.

### Human Review Before Overfitting

For subjective tasks, show outputs to the user before you rewrite the skill around aggregate metrics.

Use human review to answer:

- which outputs are already acceptable
- what feels wrong about the failures
- whether the issue is structure, quality, or over-constraint

Do not force subjective quality into shallow assertions if the user can judge it faster and better.

### Promote Repeated Work Into Scripts

If repeated eval runs keep reinventing the same helper logic, move that logic into `scripts/`.

Examples:

- repeated frontmatter normalization
- repeated format validation
- repeated benchmark aggregation
- repeated file conversion helpers

### Iteration Signals

**Undertriggering (skill doesn't load when it should):**
- Users manually enabling it
- Support questions about when to use
- **Fix:** Add more trigger keywords to description

**Overtriggering (skill loads for irrelevant queries):**
- Users disabling it
- Confusion about purpose
- **Fix:** Add negative triggers, be more specific

**Execution issues:**
- Inconsistent results
- API failures
- User corrections needed
- **Fix:** Improve instructions, add error handling

**Overfitting:**

- New changes help one eval but hurt paraphrases
- Description grows into a keyword dump
- Success depends on exact wording
- **Fix:** Generalize around intent categories, not specific prompts

---

## Context Performance

### Large Context Issues

**Symptoms:** Skill seems slow, responses degraded

**Causes:**
- SKILL.md too large (>5000 words)
- Too many skills enabled (>20-50 simultaneously)
- All content loaded instead of progressive disclosure

**Solutions:**
1. Move detailed docs to references/
2. Keep SKILL.md under 500 lines
3. Consider skill "packs" for related capabilities
4. Selective skill enablement

### Model Thoroughness

If Claude skips steps or rushes, add to user prompts (not SKILL.md):

```
Take your time to do this thoroughly.
Quality is more important than speed.
Do not skip validation steps.
```

---

## Validation Checklist

### Before Testing

- [ ] Folder named in kebab-case
- [ ] SKILL.md exists (exact spelling)
- [ ] YAML frontmatter has `---` delimiters
- [ ] `name` field: kebab-case, no spaces/capitals
- [ ] `description` includes WHAT + WHEN + trigger keywords
- [ ] No XML tags (`<` `>`) anywhere
- [ ] Instructions clear and actionable
- [ ] Error handling included

### During Testing

- [ ] Triggers on obvious tasks
- [ ] Triggers on paraphrased requests
- [ ] Doesn't trigger on unrelated topics
- [ ] Functional tests pass
- [ ] Tool integration works (if applicable)

### After Deployment

- [ ] Monitor for under/over-triggering
- [ ] Collect user feedback
- [ ] Iterate on description and instructions
- [ ] Snapshot successful patterns into references/ or scripts/ when reuse emerges

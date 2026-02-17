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

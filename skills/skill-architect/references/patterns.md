# Structural Patterns

## Two-Pass Diagnostic/Reconstruction

**Use when:** Q6 = High variation (output quality varies significantly)

**Why:** Separates diagnosis from fixing. User controls iteration. Clear process.

### Implementation

```markdown
## Process

### PASS A: Diagnostic

1. Analyze input against rubric criteria
2. Score each dimension (1-10)
3. Identify specific issues per criterion
4. Calculate overall score

**Show user:**
```
## Diagnostic Results

| Criterion | Score | Issues |
|-----------|-------|--------|
| [Criterion 1] | X/10 | [specific issues] |
| [Criterion 2] | X/10 | [specific issues] |
...

**Overall: X/10** (target: 8+)

Proceed to reconstruction?
```

### PASS B: Reconstruction

1. Address each identified issue
2. Apply transformation patterns
3. Re-score against rubric
4. Verify fact preservation (if applicable)

**Show user:**
```
## Reconstruction Complete

| Criterion | Before | After |
|-----------|--------|-------|
| [Criterion 1] | X/10 | Y/10 |
...

**Overall: X/10 → Y/10**

[Show key changes made]
```
```

---

## 8-Criteria Rubric

**Use when:** Q5 = Subjective or Both

**Why:** Objective measurement for subjective quality. User knows when output is ready.

### Template

```markdown
## Scoring Rubric

Score each criterion 1-10. Target: 8+ overall.

| Criterion | 1-3 (Poor) | 4-6 (Adequate) | 7-8 (Good) | 9-10 (Excellent) |
|-----------|------------|----------------|------------|------------------|
| **[Criterion 1]** | [description] | [description] | [description] | [description] |
| **[Criterion 2]** | [description] | [description] | [description] | [description] |
...

### Measurement Method

- **[Criterion 1]:** [How to measure objectively]
- **[Criterion 2]:** [How to measure objectively]
...
```

### Example: Content Transformation Rubric

| Criterion | Measures |
|-----------|----------|
| Rhythm | Sentence length variety (std dev of word counts) |
| Connectors | Natural transitions (and, but, so vs formal connectors) |
| Specificity | Concrete details vs vague statements |
| Voice | Consistency with target voice profile |
| Engagement | Reader interest signals (questions, direct address) |
| Clarity | Readability score, jargon density |
| Fact preservation | Numbers, names, quotes unchanged |
| Format | Adherence to structure requirements |

---

## Fact Preservation Rules

**Use when:** Q2 = Existing content AND task involves transformation

**Why:** Protect source accuracy while changing voice/format.

### Template

```markdown
## Fact Preservation

### NEVER change:
- Numbers, statistics, percentages
- Names (people, companies, products)
- Dates and times
- Direct quotes
- Technical specifications
- Source attributions
- Legal/compliance language

### CAN change:
- Sentence structure
- Paragraph organization
- Transitions and connectors
- Voice and tone
- Word choice (non-technical)
- Examples and analogies (if clearly marked as added)

### Verification

Before finalizing, extract and compare:
1. All numbers from original
2. All proper nouns from original
3. All quoted text from original

Flag any discrepancies for user review.
```

---

## Question Bank (Multi-Phase)

**Use when:** Q4 = Multi-phase

**Why:** Systematic discovery. Questions per phase ensure completeness.

### Template

```markdown
## Question Bank

### Phase 1: [Topic]

**Core questions (always ask):**
1. [Question about goals/purpose]
2. [Question about constraints]
3. [Question about success criteria]

**Adaptive questions (ask if relevant):**
- If [condition]: Ask [follow-up]
- If [condition]: Ask [follow-up]

**Phase complete when:** [Criteria for moving to next phase]

### Phase 2: [Topic]
...

### Assembly

After all phases approved:
1. Combine outputs from each phase
2. Check for contradictions
3. Resolve conflicts with user
4. Generate final output
```

---

## Decomposition-First

**Use when:** Linear task with 3+ major components

**Why:** Break down before executing. Prevents missed requirements.

### Template

```markdown
## Process

### STEP 1: Decomposition

Break down request into subtasks:

**Show user:**
```
## Task Breakdown

| Subtask | Difficulty | Ambiguity |
|---------|------------|-----------|
| [Subtask 1] | Low/Med/High | Low/Med/High |
| [Subtask 2] | Low/Med/High | Low/Med/High |
...

Approve plan or adjust?
```

### STEP 2-N: Execute Subtasks

For each approved subtask:
1. Execute
2. Verify completion
3. Report status
4. Proceed to next
```

---

## Memory Patterns

**Use when:** Q8 = Repeat use expected

**Why:** Saves preferences for reuse. Simulates persistent memory.

### Configuration Naming

Format: `[Output-Type]-[User-Identifier]-v[Version]`

Examples:
- `conversational-blog-acme-v1`
- `campaign-plan-enterprise-v2`

### End-of-Session Capture

```markdown
## Working Agreements

**Preferences captured:**
- Tone: [formal/conversational/technical]
- Length: [concise/standard/comprehensive]
- Format: [specific preferences]
- Values: [organizational philosophy mentioned]

**Configuration name:** `[name]-v1`

**To reuse:**
- "Use [config-name] for [new input]" → Apply saved preferences
- "Create skill like [config-name] but for [new purpose]" → Adapt architecture
```

---

## Pass/Fail Checklist

**Use when:** Q5 = Binary only

**Why:** Don't over-engineer. Binary quality = simple validation.

### Template

```markdown
## Success Criteria

**Pass when ALL true:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

**Fail when ANY true:**
- [ ] [Failure condition 1]
- [ ] [Failure condition 2]

**Status report:**
- PASS: All criteria met, [summary]
- FAIL: [Which criteria failed], [what to fix]
```

---

## Failure Modes

**Include in every skill.**

### Template

```markdown
## Failure Modes

| Scenario | Detection | Fallback |
|----------|-----------|----------|
| [Scenario 1] | [How to detect] | [What to do] |
| [Scenario 2] | [How to detect] | [What to do] |

### When in doubt:
- [Default safe behavior]
- [When to ask user vs proceed]
- [When to recommend professional consultation]
```

### Enhanced (High Stakes)

Add for Q9 = Yes:

```markdown
### Disclaimers

This skill does NOT provide [legal/financial/medical] advice.
For [domain] decisions, always consult a qualified [professional].

### Extra Validation

Before finalizing high-stakes output:
1. [Additional check 1]
2. [Additional check 2]
3. Explicitly confirm with user before proceeding
```

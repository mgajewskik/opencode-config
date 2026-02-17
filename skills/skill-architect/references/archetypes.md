# Skill Archetypes

## Simple/Transformational

**Use when:**
- Q4 = Linear workflow
- Q2 = Existing or rough content
- Q3 = Ready-to-publish or structured draft
- Q5 = Subjective or both

**Why:** User has content needing transformation. Task is X → Y. Quality varies subjectively. Two-pass system gives iteration control.

**Use cases:**
- Content voice transformation
- Format conversion with style adjustment
- Quality refinement (readability, engagement)
- Repurposing for different platforms

**Structure:**
```
skill-name/
├── SKILL.md
└── references/
    ├── rubric.md              # 8-criteria scoring
    ├── transformation-library.md  # Before/after patterns
    └── fact-preservation.md   # What never changes
```

**Process pattern:**
1. Receive input content
2. **Pass A (Diagnostic):** Score against rubric, identify issues
3. Show user: scores + issues found
4. **Pass B (Reconstruction):** Fix issues, re-score
5. Verify fact preservation
6. Output with before/after comparison

---

## Complex/Interview

**Use when:**
- Q4 = Multi-phase workflow
- Q2 = No content or mix
- Q3 = Structured draft or decision
- Q6 = High variation

**Why:** Creating from scratch or scattered ideas. Systematic discovery extracts requirements. Approval gates prevent building on wrong assumptions.

**Use cases:**
- Plans, strategies, campaigns from scratch
- Research and synthesis
- Decision frameworks requiring multiple inputs
- Multi-section document assembly

**Structure:**
```
skill-name/
├── SKILL.md
└── references/
    ├── question-bank.md       # Questions per phase
    └── validation-checklist.md
```

**Process pattern:**
1. **Phase 1:** Ask discovery questions (topic A)
2. Show summary, get approval
3. **Phase 2:** Ask discovery questions (topic B)
4. Show summary, get approval
5. **Phase N:** Continue per phase
6. **Assembly:** Combine approved sections
7. Final validation

**Question bank structure:**
```markdown
## Phase 1: Goals
- What outcome defines success?
- What constraints exist?
- What's the timeline?

## Phase 2: Audience
- Who is the primary audience?
- What do they already know?
- What action should they take?

## Phase 3: [Domain-specific]
...
```

---

## Lightweight

**Use when:**
- Q4 = Linear workflow
- Q5 = Binary quality only
- Q6 = Low variation
- Task is execution/automation focused

**Why:** Binary outcome (worked/didn't). No quality scoring needed. Don't over-engineer.

**Use cases:**
- Command execution and reporting
- Test running and validation
- Simple automation with pass/fail
- Configuration/setup tasks

**Structure:**
```
skill-name/
└── SKILL.md    # Single file, 3-5 steps
```

**Process pattern:**
1. Receive input/trigger
2. Execute operation
3. Check success criteria
4. Report status (pass/fail + details)

**Validation:** Pass/fail checklist only, no rubric.

---

## Decision Trees

### Archetype Selection

```
Start
│
├─ Q4 = Multi-phase?
│  └─ Yes → Complex/Interview
│
├─ Q5 = Binary only?
│  └─ Yes AND Q6 = Low variation → Lightweight
│
└─ Q2 = Existing/Rough AND Q3 = Ready/Draft?
   ├─ Yes → Simple/Transformational
   └─ No → Complex/Interview (default)
```

### Validation Approach

```
Q5 = Subjective? → 8-criteria rubric + scoring
Q5 = Binary? → Pass/fail checklist only
Q5 = Both? → Rubric AND checklist
Q6 = High variation? → Add two-pass system
Q6 = Low variation? → Single-pass execution
```

### Process Structure

```
Q6 = High variation? → Two-pass diagnostic/reconstruction
Q4 = Multi-phase? → Phase-by-phase with approval gates
3+ components? → Add decomposition-first step
Otherwise → Linear process
```

---

## Justification Templates

**For Simple/Transformational:**
> "Recommend **Simple** because: existing content needs transformation, quality is subjective, two-pass system gives iteration control."

**For Complex/Interview:**
> "Recommend **Complex** because: creating from scratch, multi-phase discovery ensures completeness, approval gates prevent wrong assumptions."

**For Lightweight:**
> "Recommend **Lightweight** because: binary task (worked/didn't), consistent process, no rubrics needed."

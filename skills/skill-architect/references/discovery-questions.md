# Discovery Questions

Run these questions to determine skill archetype and structural elements.

## Core Questions (Always Ask)

### Q1: Purpose
"What should this skill do? (1-2 sentences)"

### Q2: Input Form
"What does the user start with?"

| Option | Description | Example |
|--------|-------------|---------|
| Existing polished | Article, document, clean data | Blog post, published newsletter |
| Rough content | Brain dump, messy draft, notes | Voice memo transcript, bullet points |
| No content | Pure creation from scratch | Strategy from zero, plan with no starting material |
| URL/external | Website, API, external source | "Analyze this article URL" |
| Mix | Combination of above | |

### Q3: Output Form
"What should the skill produce?"

| Option | Description | Example |
|--------|-------------|---------|
| Ready-to-publish | Final output, no further work | Polished blog post, formatted email |
| Structured draft | Needs downstream processing | Outline for writer skill, data for formatter |
| System/tool | Built infrastructure | API integration, test runner |
| Research synthesis | Analysis, findings | Competitive analysis, trend report |
| Decision | Actionable guidance | "Use approach A because..." |

### Q4: Workflow Type
"Single workflow or multi-phase interview?"

| Option | Description | Archetype Signal |
|--------|-------------|------------------|
| Linear | Start to finish, one pass | Simple or Lightweight |
| Multi-phase | Interview across topics, approval per phase | Complex |

### Q5: Quality Measurement
"How do you know if output is good?"

| Option | Description | Structural Element |
|--------|-------------|-------------------|
| Subjective | Depends on feel, style, judgment | → 8-criteria rubric |
| Binary | Pass/fail, factual | → Pass/fail checklist |
| Both | Some subjective, some binary | → Rubric AND checklist |

### Q6: Output Variation
"Will some outputs need iteration while others are one-and-done?"

| Option | Description | Structural Element |
|--------|-------------|-------------------|
| High variation | User needs approval gates | → Two-pass system |
| Low variation | Consistent quality | → Single-pass |

### Q7: Reference Materials
"Do you have examples, guides, rubrics this skill should use?"

| Option | Action |
|--------|--------|
| Yes | Create references/ with provided materials |
| No | Skip references/ or create placeholders |
| Will create later | Create placeholder structure |

---

## Adaptive Questions (Ask When Relevant)

### Q8: Repeat Use
**Ask if:** Skill seems reusable across sessions

"Is this skill used repeatedly by same person/team?"

| Answer | Structural Element |
|--------|-------------------|
| Yes | → Memory patterns (config naming, preference capture) |
| No | → Standard structure |

### Q9: High Stakes
**Ask if:** Q5 suggests risk, or domain is sensitive

"Does this involve high-stakes decisions (legal, financial, brand-sensitive)?"

| Answer | Structural Element |
|--------|-------------------|
| Yes | → Enhanced failure modes, disclaimers, extra validation |
| No | → Standard failure modes |

### Q10: Organizational Philosophy
**Ask if:** Skill is for team/company use

"Are there organizational values this should encode?"

| Answer | Structural Element |
|--------|-------------------|
| Yes | → Doctrine-encoded guardrails |
| No | → Generic guardrails |

### Q11: Self-Updating
**Ask if:** Skill improves with use

"Should this skill adapt based on feedback over time?"

| Option | Description | Structural Element |
|--------|-------------|-------------------|
| Learns from corrections | Remember fixes, apply next time | → Correction tracking |
| Builds preference library | Accumulate style preferences | → Config versioning |
| Static | Same every time | → Standard structure |

**Good candidates:** 10+ uses, quality improves from corrections, same user
**Poor candidates:** One-off, binary quality, requirements change frequently

### Q12: Automated Validation
**Ask if:** Q5 = Subjective

"Want Python scripts for automated quality checks?"

| Answer | Structural Element |
|--------|-------------------|
| Yes | → scripts/ directory with validators |
| No | → Manual validation only |

---

## Answer Summary Template

After discovery, confirm:

```
## Discovery Summary

**Purpose:** [1-2 sentences]

**Core answers:**
- Input: [existing/rough/none/URL/mix]
- Output: [ready/draft/system/research/decision]
- Workflow: [linear/multi-phase]
- Quality: [subjective/binary/both]
- Variation: [high/low]
- References: [yes/no/later]

**Adaptive answers (if asked):**
- Repeat use: [yes/no]
- High stakes: [yes/no]
- Org philosophy: [description]
- Self-updating: [yes/no]
- Automated validation: [yes/no]

**Recommended archetype:** [Simple/Complex/Lightweight]
**Structural elements:** [list]

Confirm before generating scaffold?
```

---

## Conflict Detection

If answers contradict, resolve before proceeding:

| Conflict | Resolution Question |
|----------|---------------------|
| Q5=Binary + Q6=High variation | "Does quality vary subjectively, or truly pass/fail?" |
| Q2=Existing + Q4=Multi-phase | "Transform existing content, or create from scratch?" |
| Q3=Ready-to-publish + Q6=High variation | "Consistently ready, or needs iteration?" |
| Q5=Subjective + "just want pass/fail" | "Need rubric for quality measurement, or simple checklist?" |

**Pattern:**
> "I see a potential contradiction:
> - You said [answer A from Question X]
> - But also said [answer B from Question Y]
> 
> Can you clarify which is more accurate?"

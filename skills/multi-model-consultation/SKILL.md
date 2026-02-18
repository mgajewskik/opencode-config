---
name: multi-model-consultation
description: Consult AI models (GPT, Gemini, Grok, Opus) for perspectives on questions. Use when user says "ask gpt", "ask gemini", "ask grok", "ask opus", "ask both", "ask all three", "ask all four", "ask gpt and gemini", "consult opus", or wants model opinions on decisions. Spawns ONLY the models explicitly requested.
---

# Multi-Model Consultation

Query advisory subagents (GPT, Gemini, Grok, Opus) based on user request. Spawn ONLY the models explicitly mentioned.

## Available Models

| Model | Subagent | Strengths |
|-------|----------|-----------|
| GPT | @gpt | Strong reasoning, broad knowledge |
| Gemini | @gemini | Good at synthesis, multimodal |
| Grok | @grok | X/Twitter data, less filtered, contrarian |
| Opus | @opus | Deep reasoning, careful tradeoff analysis |

## Trigger Patterns - MATCH EXACTLY

Parse user request and spawn ONLY requested models:

| User Says | Spawn |
|-----------|-------|
| "ask gpt..." | @gpt only |
| "ask gemini..." | @gemini only |
| "ask grok..." | @grok only |
| "ask opus..." | @opus only |
| "ask gpt and gemini..." | @gpt + @gemini |
| "ask gpt and grok..." | @gpt + @grok |
| "ask gpt and opus..." | @gpt + @opus |
| "ask gemini and grok..." | @gemini + @grok |
| "ask gemini and opus..." | @gemini + @opus |
| "ask grok and opus..." | @grok + @opus |
| "ask both" (after mentioning 2) | the 2 mentioned |
| "ask all three..." | @gpt + @gemini + @grok (legacy) |
| "ask all four..." | @gpt + @gemini + @grok + @opus |
| "ask all models..." | @gpt + @gemini + @grok + @opus |

**Default behavior:** If ambiguous, ask user which model(s) they want. Do NOT default to all models.

## Workflow

### Step 1: Identify Requested Models

Parse user request carefully:
- Single model mentioned → spawn only that one
- Two models mentioned → spawn only those two
- "all three" → spawn @gpt + @gemini + @grok (legacy phrase)
- "all four" / "all models" → spawn all four
- Ambiguous → ask for clarification

### Step 2: Form Your Own Opinion First

Before spawning subagents:
- What's your initial assessment?
- What are the key considerations?
- What's your preliminary recommendation?

### Step 3: Spawn Requested Models in Parallel

Spawn ONLY the models user requested, all at once:

```
# Single model example
Task 1: @gpt - [the question]

# Two models example  
Task 1: @gpt - [the question]
Task 2: @gemini - [the question]

# All three example
Task 1: @gpt - [the question]
Task 2: @gemini - [the question]
Task 3: @grok - [the question]

# All four example
Task 1: @gpt - [the question]
Task 2: @gemini - [the question]
Task 3: @grok - [the question]
Task 4: @opus - [the question]
```

### Step 4: Synthesize Responses

Adapt synthesis to number of models:

**Single model:**
```
## My Analysis
[Your assessment]

## [Model]'s Perspective
[Summary of response]

## Synthesis
[Compare your view with model's, final recommendation]
```

**Two models:**
```
## My Analysis
[Your assessment]

## [Model 1]'s Perspective
[Summary]

## [Model 2]'s Perspective
[Summary]

## Synthesis
### Agreement
[Where perspectives align]

### Divergence
[Where they differ]

### Recommendation
[Final recommendation with rationale]
```

**Three models:**
```
## My Analysis
[Your assessment]

## GPT's Perspective
[Summary]

## Gemini's Perspective
[Summary]

## Grok's Perspective
[Summary]

## Synthesis
### Agreement
[Where all align]

### Divergence
[Where they differ and why]

### Recommendation
[Final recommendation, which arguments most compelling]
```

**Four models:**
```
## My Analysis
[Your assessment]

## GPT's Perspective
[Summary]

## Gemini's Perspective
[Summary]

## Grok's Perspective
[Summary]

## Opus's Perspective
[Summary]

## Synthesis
### Agreement
[Where perspectives align]

### Divergence
[Where they differ and why]

### Recommendation
[Final recommendation, which arguments most compelling]
```

## Decision Framework

### When Models Agree
- High confidence in shared conclusion
- Note if reasoning differs despite same answer

### When Models Disagree
- Identify root cause (assumptions? priorities? training data?)
- Evaluate which reasoning fits THIS context
- Your role: break tie with reasoned judgment

### When You Disagree
- State your position clearly
- Explain why their reasoning doesn't apply
- Be open to being wrong

## NEVER

- **NEVER** spawn models not requested - respect user's choice
- **NEVER** default to all four when user asks for one, two, or three
- **NEVER** spawn sequentially - always parallel
- **NEVER** skip forming your own opinion first
- **NEVER** just average answers - synthesize with judgment
- **NEVER** hide disagreement - surface it explicitly

## Examples

**Single model:**
User: "ask gpt about early bird vs night owl"
→ Spawn @gpt only, synthesize with your view

**Two models:**
User: "ask gpt and gemini about monorepo vs polyrepo"
→ Spawn @gpt + @gemini only, synthesize both with your view

**All three:**
User: "ask all three about best testing strategy"
→ Spawn @gpt + @gemini + @grok, full synthesis

**Opus only:**
User: "ask opus about event sourcing vs CRUD"
→ Spawn @opus only, synthesize with your view

**All four:**
User: "ask all models about monolith vs microservices"
→ Spawn @gpt + @gemini + @grok + @opus, full synthesis

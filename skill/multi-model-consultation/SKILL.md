---
name: multi-model-consultation
description: Consult multiple AI models (GPT, Gemini, Grok) for diverse perspectives on complex questions. Use when user says "ask gpt and gemini", "ask both", "ask all three", "consult gpt and gemini", "get opinions from gpt/gemini", "ask grok", or wants multi-model analysis on technical decisions, architecture choices, or complex problems requiring diverse viewpoints.
---

# Multi-Model Consultation

Query all three advisory subagents (GPT, Gemini, Grok) in parallel, synthesize their responses with your own analysis.

## Available Models

| Model | Strengths | Training Bias |
|-------|-----------|---------------|
| @gpt | Strong reasoning, broad knowledge | OpenAI's perspective |
| @gemini | Good at synthesis, multimodal | Google's perspective |
| @grok | X/Twitter data, less filtered | xAI's perspective, contrarian |

## Trigger Patterns

**Always spawn all 3 models** when user says:
- "ask gpt and gemini..."
- "ask both..."
- "ask all three..."
- "ask all models..."
- "consult gpt and gemini..."
- "get opinions on..."
- "what do the models think about..."

All triggers spawn @gpt + @gemini + @grok for comprehensive coverage.

## Workflow

### Step 1: Form Your Own Opinion First

Before spawning subagents, analyze the question yourself:
- What's your initial assessment?
- What are the key considerations?
- What's your preliminary recommendation?

Document this internally - you'll compare against subagent responses.

### Step 2: Spawn All Three Subagents in Parallel

Use Task tool to spawn all models simultaneously:

```
Task 1: @gpt - [the question]
Task 2: @gemini - [the question]
Task 3: @grok - [the question]
```

**Parallel execution is critical** - spawn all three at once, don't wait.

### Step 3: Collect Structured Responses

All subagents return:
```
## Answer
[Direct response]

## Reasoning
[Key considerations, tradeoffs]

## Confidence
[high/medium/low] - [explanation]

## Sources/References
[Skills loaded, URLs, files]
```

### Step 4: Synthesize and Compare

Create synthesis with this structure:

```
## My Analysis
[Your own assessment from Step 1]

## GPT's Perspective
[Summary of GPT's answer and key reasoning]

## Gemini's Perspective  
[Summary of Gemini's answer and key reasoning]

## Grok's Perspective
[Summary of Grok's answer and key reasoning]

## Synthesis

### Agreement
[Where all four perspectives align]

### Divergence
[Where perspectives differ and why]

### Recommendation
[Your final recommendation, informed by all perspectives]
[Explain which arguments you found most compelling and why]
```

## Decision Framework

### When Models Agree
- High confidence in shared conclusion
- Note if reasoning differs despite same answer
- Your role: validate and add nuance

### When Models Disagree
- Identify root cause (different assumptions? priorities? training data?)
- Evaluate which reasoning is stronger for THIS context
- Your role: break the tie with reasoned judgment
- Grok disagreeing alone may indicate contrarian view worth considering

### When You Disagree With All
- State your position clearly
- Explain why their reasoning doesn't apply here
- Be open to being wrong - they may have considered something you missed

## NEVER

- **NEVER** spawn subagents sequentially - always parallel
- **NEVER** skip forming your own opinion first - you're the synthesizer, not just a relay
- **NEVER** just average the answers - synthesize with judgment
- **NEVER** hide disagreement - surface it explicitly
- **NEVER** defer entirely to subagents - you own the final recommendation
- **NEVER** spawn only 1 or 2 models - always use all three for comprehensive coverage

## Example

User: "ask gpt and gemini whether we should use monorepo or polyrepo"

**Your internal analysis**: Monorepo likely better for small team, shared code, atomic changes. Polyrepo if services truly independent.

**Spawn parallel** (all three, even though user only mentioned two):
- Task @gpt: "Should a 3-service backend use monorepo or polyrepo? Consider team size, deployment, code sharing."
- Task @gemini: "Should a 3-service backend use monorepo or polyrepo? Consider team size, deployment, code sharing."
- Task @grok: "Should a 3-service backend use monorepo or polyrepo? Consider team size, deployment, code sharing."

**Synthesize**: Compare all four perspectives (yours + 3 models), note agreements/divergences, provide final recommendation with rationale.

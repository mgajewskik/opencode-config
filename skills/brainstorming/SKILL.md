---
name: brainstorming
description: "Optional idea-shaping skill for when the user explicitly wants to brainstorm, compare approaches, pressure-test a concept, or turn a rough idea into a lightweight plan. Do not trigger for routine implementation, small edits, or cases where the user clearly wants direct execution."
---

# Brainstorming

Use this skill when the user explicitly wants help exploring options before choosing an implementation direction.

This is an **optional** skill, not a gate before implementation.

## Use It For

- brainstorming features, workflows, or product ideas
- comparing 2-4 possible approaches
- turning a vague idea into a clearer direction
- pressure-testing assumptions before building
- finding scope cuts or a simpler version first

## Do Not Use It For

- routine coding requests where the user wants direct execution
- tiny changes, small bug fixes, or straightforward refactors
- forcing a design ceremony before every implementation task
- mandatory docs, commits, review loops, or follow-on skills

## Default Workflow

1. **Confirm the shape of the brainstorm**
   - Figure out whether the user wants quick ideation, deeper exploration, or a decision.
   - Match the depth to the request. Keep it short unless the user wants more.

2. **Clarify only what matters**
   - Ask focused questions about goal, constraints, and success criteria.
   - Prefer one question at a time when uncertainty is high.
   - Skip unnecessary questioning when the user already gave enough context.

3. **Generate options with trade-offs**
   - Offer 2-4 approaches.
   - Make differences concrete: complexity, risk, speed, flexibility, maintenance.
   - Recommend one option when a clear default exists.

4. **Converge on a direction**
   - Summarize the recommended path in plain language.
   - Call out open questions, assumptions, and what to decide next.

5. **Produce a lightweight artifact if helpful**
   - By default, return the brainstorm in the chat.
   - Only write a document or plan file if the user asks for one.

## Output Shape

When useful, structure the response like this:

### Goal
- what we are trying to achieve

### Constraints
- hard limits, non-goals, dependencies

### Options
- option A
- option B
- option C (only if it adds value)

### Recommendation
- preferred direction and why

### Open Questions / Next Step
- what still needs a decision

## Defaults and Guardrails

- Keep it text-first and lightweight.
- Prefer simpler options before more ambitious ones.
- Push back on obvious scope creep.
- Do not pretend brainstorming is required for good work.
- Do not block implementation unless the user explicitly wants to stay in planning mode.

## Visuals

- Do **not** rely on a browser companion or background server.
- If a visual would genuinely help, provide a diagram source file or snippet the user can render locally.
- Prefer PlantUML or Mermaid when the user wants a diagram.
- If text is enough, stay in text.

## Failure Modes

- **Too much process:** shorten the exchange and move to a recommendation.
- **Too many options:** narrow to the best 2-3 and explain the cut.
- **Vague request:** ask the smallest question that unlocks a useful answer.
- **User wants execution now:** stop brainstorming and hand back to direct implementation.

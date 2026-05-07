---
name: dossier
description: Create senior-level deep research dossiers and roadmap companions. Use when the user asks for a dossier, senior research, deep research, in-depth research, mental models for a topic, senior perspective on a topic, how something actually works, ramp up on a topic, architectural deep dive, tradeoffs, failure modes, or what a senior would notice. Produces current-directory research-* and roadmap-* markdown artifacts, not a tutorial or short summary.
metadata:
  author: local
  version: "0.1"
---

# Dossier

Create source-backed, senior-level research dossiers that preserve mechanisms, tradeoffs, failure modes, disagreements, and a practical ramp-up path. This skill is for direct user-facing dossier work; delegated research can still use the `deep-researcher` agent.

## Use This Skill For

- senior-level research dossiers that should persist as files
- broad or contested topics where expert disagreement matters
- mental models, first principles, internals, scale behavior, and operational failure modes
- research meant to become later learning tasks, labs, or study plans

## Do Not Use This Skill For

- narrow docs/API/version checks that only need a concise answer
- local codebase exploration or implementation
- generic tutorials, shallow best-practices lists, or marketing summaries
- topics too broad to source well in one pass without narrowing

## Operating Contract

Before researching, extract:

- topic or exact research question
- why the research matters or intended use
- in-scope and out-of-scope boundaries
- version, implementation, standard, date range, or explicit "current stable" scope when the topic is version-sensitive
- environment, constraints, current level, and desired depth when available

Ask a focused clarification question only when missing information would materially change the dossier, the topic is too broad, or version scope is necessary. Otherwise state the default and proceed.

Prefer these defaults when safe:

- Intended use: general senior-level ramp-up
- Depth: deep
- Current level: intermediate
- Scope: current stable behavior for software topics, clearly marked as current-date-sensitive
- Environment: infer only from explicit user/project context; label inference when used

## Artifact Contract

Write exactly two markdown files in the active current directory:

1. `./research-YYYY-MM-DD-topic-slug.md` — the full dossier
2. `./roadmap-YYYY-MM-DD-topic-slug.md` — the compact learning path and downstream handoff

Use lowercase topic slugs with ASCII letters, digits, and hyphens only. If either filename exists, append the same suffix to both files: `-2`, `-3`, and so on.

Do not create directories. Do not modify code, config, memory, lockfiles, progress files, or unrelated docs. If either file cannot be written, report the failure and do not claim completion.

## Source Discipline

Start with the highest-authority sources available:

1. official documentation, standards, specs, RFCs, design docs, source code, and maintainer-authored material
2. version-specific docs when available for software, libraries, frameworks, APIs, platforms, tools, or language features
3. incident reports, postmortems, reliability writeups, migration guides, and architecture reviews
4. high-quality practitioner content from recognized experts
5. benchmarks, performance analyses, comparative evaluations, issue trackers, and GitHub discussions
6. academic or research material when the topic has theory, algorithms, methods, or contested evidence

Ignore low-signal SEO content unless it uniquely surfaces a real failure or edge case. If the source base is too weak for the requested depth, block and say what source class or tooling is missing.

For major claims, distinguish:

- primary-source fact
- practitioner inference
- widely accepted convention
- disputed claim
- anecdotal but useful field wisdom
- likely outdated or version-sensitive claim

Do not present anecdotes as universal law. Do not flatten expert disagreement into fake consensus.

## Research Dimensions

Cover these dimensions when applicable:

- definition and boundaries
- purpose and problem solved
- historical reason it emerged
- first principles, invariants, and core mental models
- internal mechanics, interfaces, and dependencies
- operational lifecycle
- debugging and observability
- failure modes and misdiagnosis patterns
- security and reliability implications
- scale behavior
- tradeoffs and alternatives
- anti-patterns and cargo cults
- expert consensus and expert disagreement
- questions that expose shallow understanding
- practical roadmap for gaining competency

## Dossier Structure

Use this exact top-level structure for the research file:

```markdown
# Research Dossier: <topic>

Metadata:
- Topic
- Scope/version/date range
- Current date
- Environment/use case, if supplied or inferred
- Constraints, if supplied
- Source count
- Evidence-quality caveats

1. Executive synthesis
2. Boundaries and adjacent concepts
3. ELI5, ELI12, and precise explanation
4. First principles and mental models
5. Internal mechanics
6. Expert consensus map
7. Expert disagreement map
8. Failure modes and debugging
9. Scale behavior
10. Tradeoffs and alternatives
11. Anti-patterns, traps, and cargo cults
12. Senior-level heuristics and tribal knowledge
13. Questions that expose shallow understanding
14. Scenario analysis
15. Source map
16. Research gaps and uncertainty
17. Ramp-up roadmap
18. Handoff package for a task-based learning agent
19. How to tell if I truly understand this topic
```

Section 13 must use a table with columns: `Question`, `What a memorized/shallow answer looks like`, `What a strong/deep answer includes`, and `What concept this question is really testing`.

Section 14 must include at least one small/simple scenario, one medium real-world scenario, one large-scale/high-complexity scenario, and one failure/incident scenario. For each, explain what matters, what breaks, what to observe, and what a senior would prioritize.

Section 15 must group sources into primary/official, expert practitioner, incident/failure/operations, and research/theory. For each source, include why it matters, what it is best for, trustworthiness, and whether it is stable or time/version-sensitive.

Section 18 must prepare clean handoff material for another agent: recommended concept sequence, smallest practical milestones, likely misconceptions per milestone, failure cases worth simulating, and minimal labs or experiments. Do not expand these into full tasks.

Section 19 must include signs of shallow understanding, operational understanding, transferable understanding, and readiness to build, debug, or teach the topic.

## Roadmap Structure

Use this exact top-level structure for the roadmap file:

```markdown
# Research Roadmap: <topic>

Metadata:
- Topic
- Scope/version/date range
- Current date
- Source dossier path

17. Ramp-up roadmap
18. Handoff package for a task-based learning agent
```

The roadmap must be derived from the dossier. Keep it tight enough for another agent to consume without reading the full dossier.

## Style Rules

- Be direct, concrete, and skeptical.
- Prefer mechanism over slogan.
- Prefer tradeoffs over one-sided recommendations.
- Prefer evidence over confidence.
- Prefer production reality over tutorial simplicity.
- Explicitly distinguish beginner, intermediate, and senior understanding.
- Challenge bad assumptions in the user's framing when necessary.
- Do not hide behind "it depends" without unpacking what it depends on.
- Do not give vague advice with no mechanism behind it.

## Execution Checklist

Before reporting completion, confirm:

1. The `research-*` and `roadmap-*` files both exist in the active current directory.
2. No directories or unrelated files were created or modified.
3. All 19 dossier sections are present and non-empty.
4. The roadmap contains only metadata, section 17, and section 18 material derived from the dossier.
5. The source map is grouped by source class and labels trust/freshness/version sensitivity.
6. Major claims are framed by evidence strength.
7. Version-sensitive claims are scoped or caveated.
8. Expert disagreements are preserved.
9. Section 13 has the required four-column table.
10. Section 14 has the required four scenario types.

## Completion Report

Return a concise report with:

- status: done or blocked
- research file path, absolute and relative
- roadmap file path, absolute and relative
- executive synthesis
- key findings with evidence strength
- major disagreements and failure modes
- source-quality caveats and research gaps
- fastest useful next probe

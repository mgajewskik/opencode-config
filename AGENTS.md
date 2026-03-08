## The Loop (Base Pattern for All Agents and Models)

Use this as the default operating loop for any task that benefits from reasoning or verification.

Outer-loop framing: move from **Current State** to **Ideal State**.

### 0) Trigger and Context Boundary

- Start this loop at a new task or explicit context switch.
- Reuse same-session context first.
- Do not re-query OpenMemory every turn; refresh only when context changed, uncertainty remains, or new durable memory was written.

### 1) Context Recovery (Memory First)

- Retrieve relevant user and project memory from OpenMemory at task start.
- Prefer OpenMemory over file-based task storage for task continuity.
- Keep active task state sparse: store it only for blocked, multi-turn, or likely-resumed work.
- Treat memory as context, not proof; current code, command output, and tests win when memory conflicts.

### 2) Observe and Classify

- Classify scope before acting:
  - **TRIVIAL**: single-line, format, or typo change
  - **SIMPLE/MODERATE**: clear change, limited files
  - **COMPLEX/HIGH-IMPACT**: architectural, risky, or broad
- Extract constraints before planning:
  - `EX-Q`: quantitative limits and thresholds
  - `EX-P`: prohibitions and must-not rules
  - `EX-R`: mandatory requirements
  - `EX-I`: implicit conventions and assumptions
- Ask clarifying questions only when blocked by missing requirements, missing secrets, or irreversible-risk decisions.

### 3) Define Verifiable Ideal State Before Execution

- Turn extracted constraints into state-based, binary-testable criteria.
- Add at least one anti-criterion for non-trivial work.
- Preserve exact thresholds and hard constraints verbatim.
- Map each explicit constraint to at least one criterion or anti-criterion before proceeding.

### 4) Plan and Execute the Smallest Effective Path

- **TRIVIAL**: one-line plan, then execute.
- **SIMPLE/MODERATE**: concise plan with files, intended edits, and validation.
- **COMPLEX/HIGH-IMPACT**: phased plan and explicit approval before editing files.
- Keep scope to the requested objective.
- Avoid opportunistic refactors.
- If repeated rework in the same area does not improve the result, stop and report done, blocked, and the smallest next decision.

### 5) Verify Mechanically with Evidence

- Every PASS claim needs concrete evidence.
- Numeric constraints require actual value versus threshold.
- Anti-criteria require explicit non-occurrence checks.
- Separate proved facts from inferences and unknowns.
- If evidence is partial, say so and name the smallest next probe.

### 6) Learn and Persist

- Write durable memory only when there is net-new reusable information and the learning is verified or user-confirmed.
- Search for nearby memories before adding new ones; merge or reinforce instead of duplicating.
- Prefer concise memories covering:
  - user preferences
  - architecture decisions
  - error -> solution mappings
  - reusable patterns and pitfalls
- For non-trivial work, use this shape:
  - `summary`
  - `decision`
  - `tradeoff`
  - `pitfall`
  - `follow_up`

### 7) Continue the Loop

- Carry forward open or failing criteria until done.
- For the primary or orchestrator agent only, when a task is likely to resume, store a compact OpenMemory task snapshot with:
  - goal
  - constraints
  - open criteria
  - completed criteria
  - last phase
  - evidence summary
  - unknowns
  - next probe

### Memory Hygiene Rules

- Do NOT store secrets, credentials, tokens, or raw sensitive logs.
- Avoid noisy task transcripts and low-signal summaries.
- Use appropriate scope (`user` vs `project`) and memory type.
- Prefer memory as a compact recovery aid, not as a second source of truth.

## Response Explainability and Signal

- In non-trivial responses, include context, reasoning, evidence, and concrete examples.
- For codebase-specific claims, reference concrete files and symbols.
- Prefer compact, high-signal output.
- Keep the loop mostly invisible unless the user asks for process detail.

## Bash Commands

**File reading commands:**
- FORBIDDEN for sensitive files: `cat`, `head`, `tail`, `less`, `more`, `bat`, `echo`, `printf`
- PREFER the Read tool for general file reading
- ALLOWED: Use bash when it is materially better for diagnostics and not exposing secrets

## Temporary Files

When creating temporary files or directories for testing or scratch work, use system temp directories:
- **Linux**: `/tmp`
- **macOS**: `$TMPDIR` (resolves to `/var/folders/.../T/`)

Never create temp files in the project directory or home directory.

## Context Management

- **Use glob before reading** - Search for files without loading content into context.

## Git Operations

Never run mutating git operations without explicit user instruction.

Do NOT auto-stage, commit, or push changes. Read-only git commands are allowed when needed for review or verification:
- ALLOWED: `git status`, `git diff`, `git log`, `git show`
- ALLOWED: `git branch -l`
- FORBIDDEN: `git add`, `git commit`, `git push`, `git pull`
- FORBIDDEN: `git merge`, `git rebase`, `git checkout`, `git branch`

Mutating git commands only when:
1. The user explicitly asks you to commit, push, or similar.
2. The user invokes a git-specific command.
3. The user says "commit these changes" or equivalent.

When work is complete, inform the user that changes are ready and let them decide when to commit.

## External Dependencies and Scripts

**NEVER download or install packages without explicit user approval.**

Before suggesting any installation or download:
1. Ask first.
2. Never use `curl | sh` or `wget | sh` patterns.
3. Do not run package installers automatically.
4. Prefer system package managers such as pacman or mise when appropriate.

Required workflow:
1. Identify the needed dependency.
2. Ask the user how they want to install it.
3. Wait for confirmation before proceeding.

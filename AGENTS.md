## The Loop (Base Pattern for All Agents and Models)

Use this as the default operating loop for every task and longer conversation.

Outer-loop framing for every task: move from **Current State** to **Ideal State**.
The loop phases below are the inner hill-climbing method used to reach that Ideal State.

### 0) Trigger and Context Boundary

- Start this loop at a new task start or explicit context switch.
- Do not re-query OpenMemory every user turn inside the same active task unless new memory was written, context changed, or uncertainty requires refresh (for example: new user goal, new repository, or a task-type shift such as implementation to research).

### 1) Context Recovery (Memory First)

- Retrieve relevant user/project memory from OpenMemory at loop start.
- Extract constraints, preferences, prior decisions, and reusable solutions.

### 2) Observe and Classify

- Classify scope before acting:
  - **TRIVIAL**: single-line/format/typo
  - **SIMPLE/MODERATE**: clear change, limited files
  - **COMPLEX/HIGH-IMPACT**: architectural/risky/broad
- Ask clarifying questions only when blocked by missing requirements, missing secrets, or irreversible-risk decisions.

### 3) Define Verifiable Ideal State Before Execution

- Extract constraints first, then draft criteria:
  - Quantitative limits (numbers, thresholds, ranges)
  - Prohibitions (must not happen)
  - Requirements (must happen)
  - Implicit constraints (assumptions/conventions)
- Define success criteria as state-based and binary-testable.
- Tag each criterion source minimally: `[E]` (explicit) or `[I]` (inferred).
- Add at least one anti-criterion (what must NOT happen).
- Attach a verification method per criterion (tests, commands, static checks, read/grep evidence, or equivalent).
- Preserve specificity: never replace exact thresholds/constraints with vague language.
- Map each extracted constraint to at least one criterion or anti-criterion; unmapped constraints must be resolved before execution.

### 4) Plan the Smallest Effective Path

- **TRIVIAL**: one-line plan, then execute.
- **SIMPLE/MODERATE**: concise plan with files, intended edits, and validation.
- **COMPLEX/HIGH-IMPACT**: phased plan and explicit approval before editing files.

### 5) Execute with Scope Discipline

- Keep scope to one requested feature/fix/refactor unless user expands scope.
- Avoid opportunistic refactors.
- If progress stalls from repeated rework in the same area, stop and report done/blocked/next smallest decision.

### 6) Verify Mechanically with Evidence

- Every PASS claim must include concrete evidence.
- Numeric constraints must include actual value versus threshold.
- Anti-criteria must include the specific check performed.
- "Looks good" without evidence is not verification.

### 7) Learn and Persist

- During work, write durable learnings to OpenMemory only when there is net-new reusable information (goals, decisions, surprises, error->solution mappings, architecture decisions, preferences).
- At completion, store concise outcome summary and follow-ups in OpenMemory.
- For non-trivial work, include a short debrief: why this approach, one key tradeoff, one pitfall to avoid next time.
- Preferred memory template for non-trivial work:
  - `summary`: what changed and why
  - `decision`: key choice made
  - `tradeoff`: what was gained vs sacrificed
  - `pitfall`: what to avoid next time
  - `follow_up`: smallest next useful step

### 8) Continue the Loop

- Carry forward open/failing criteria into the next turn until completion.
- On a new task/context switch, restart from Step 0.

### Memory Hygiene Rules

- These rules apply to OpenMemory entries and retrieval behavior.

- Do NOT store secrets, credentials, tokens, or sensitive raw logs.
- Avoid noisy/transient details that will not help future tasks.
- Prefer concise, high-signal entries.
- Use appropriate scope (`user` vs `project`) and memory type.

## Response Explainability and Signal

- In non-trivial responses, include context, reasoning, evidence, and concrete examples.
- For codebase-specific claims, reference concrete files/symbols.
- For proposed edits, show exactly what would change; avoid description-only responses.
- Prefer compact, high-signal output; expand only where ambiguity remains.

## Bash Commands

**File reading commands:**
- FORBIDDEN for sensitive files: `cat`, `head`, `tail`, `less`, `more`, `bat`, `echo`, `printf` - These output to terminal and will leak secrets (API keys, credentials, tokens, env vars)
- PREFER the Read tool for general file reading - safer and provides structured output with line numbers
- ALLOWED: Use bash commands when they're more useful for specific cases and not when dealing with sensitive files (e.g., `tail -f` for following logs, `grep` with complex flags)

## Temporary Files

When creating temporary files or directories for testing/scratch work, use system temp directories:
- **Linux**: `/tmp`
- **macOS**: `$TMPDIR` (resolves to `/var/folders/.../T/`)

Never create temp files in the project directory or home directory.

## Context Management

- **Use glob before reading** - Search for files without loading content into context

## Git Operations

Never run mutating git operations without explicit user instruction.

Do NOT auto-stage, commit, or push changes. Read-only git commands are allowed when needed for review/verification:
- ALLOWED: `git status`, `git diff`, `git log`, `git show` - Read-only operations
- ALLOWED: `git branch -l` - List branches (read-only)
- FORBIDDEN: `git add`, `git commit`, `git push`, `git pull` - Require explicit user instruction
- FORBIDDEN: `git merge`, `git rebase`, `git checkout`, `git branch` - Require explicit user instruction

**Mutating git commands only when:**
1. User explicitly asks you to commit/push/etc.
2. User invokes a git-specific command (e.g., `/commit`)
3. User says "commit these changes" or similar direct instruction

**Why:** Users need full control over version control. Autonomous git operations can create unwanted commit history, push incomplete work, or interfere with their workflow.

When work is complete, inform the user that changes are ready. Let them decide when to commit.

## External Dependencies and Scripts

**NEVER download or install packages without explicit user approval.**

Before suggesting any installation or download:
1. **ASK FIRST** - Always confirm with user before running install commands
2. **NO curl|sh patterns** - Never suggest piping curl/wget to shell (curl | sh, curl | bash)
3. **NO automatic installs** - Do not run npm install, pip install, apt install, brew install, etc. without user confirmation
4. **Prefer system package managers** - Suggest pacman, mise, or other user-preferred tools over curl scripts

**Forbidden patterns:**
- `curl ... | sh` or `curl ... | bash`
- `wget ... | sh`
- Any remote script execution without user review
- Automatic package installation

**Required workflow:**
1. Identify needed dependency
2. Ask user: "This requires [tool]. Install via pacman/mise, or should I suggest alternatives?"
3. Wait for user confirmation before proceeding

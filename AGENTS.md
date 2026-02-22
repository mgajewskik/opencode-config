## Execution and Response Protocol

Before code changes, understand the task and scale planning by risk:

- **TRIVIAL** (single-line, formatting, typo): one-line plan, then execute
- **SIMPLE/MODERATE** (clear changes): concise plan with files, intended edits, and validation; proceed unless user objects
- **COMPLEX/HIGH-IMPACT** (architectural, risky, broad): phased plan and explicit approval before editing files

Ask clarifying questions only when truly blocked (missing requirements, missing secrets, or irreversible-risk decisions).

### Response Explainability (All Responses)

Primary objective: maximize user understanding of the codebase and concepts, not only task completion.

- In non-trivial responses, include:
  1. context (where this fits)
  2. reasoning (why this recommendation)
  3. evidence (file paths and line refs when useful)
  4. examples (mini-diffs, focused NEW snippets, or concrete scenarios)
- For codebase-specific claims, reference concrete files/symbols.
- For proposed edits, show exactly what would change; avoid description-only responses.
- Prefer clarity and completeness over brevity when tradeoff is required.

### Response Signal Policy

- Default to high-signal outputs; include only information that improves understanding or changes a decision.
- Prefer compact evidence over full history.
- Format by task type:
  - code edits: mini-diffs (changed hunks only)
  - policy/docs edits: change summary + NEW snippet
  - conceptual guidance: claim -> reasoning -> evidence -> example
- Use full OLD/NEW blocks only when wording precision is critical or user explicitly asks.
- If uncertain about level of detail, start compact and expand only where ambiguity remains.

### Learning Objective

- Do not only execute tasks - improve user understanding each session.
- For non-trivial work, include a short debrief:
  1. why this approach was chosen
  2. one key tradeoff
  3. one pitfall to avoid next time
- When user asks "why/how/explain" or appears uncertain, switch to mentor behavior:
  - ask what they already know
  - explain with concrete examples
  - verify understanding with a short teach-back/check question

## Review Policy

For non-trivial reviewable changes (code, tests, scripts, configs, agent instructions):

- Run `@reviewer` first during iterative development
- Run `@reviewer-opus` only at the end of the whole process, after changes are complete and `@reviewer` has returned `Decision: PASS`
- Require `Decision: PASS` from both before completion
- If `@reviewer` fails, fix blockers and re-run `@reviewer` until PASS
- If `@reviewer-opus` fails at final review, fix blockers, re-run `@reviewer`, then re-run `@reviewer-opus`
- Triage `## Non-Blocking Notes` from both reviewers before completion; do not ignore them by default
- Apply non-blocking suggestions when they are high-value, low-risk, and in-scope
- If a non-blocking note is applied, report disposition as `accepted`
- If a non-blocking note is not applied, report disposition as `deferred` or `rejected` with one-line rationale

Skip dual-review only for trivial formatting/typo-only changes with no behavior, interface, policy, or validation impact.

## Scope and Loop Control

- Keep scope to one feature/fix/refactor unless user requests broader scope
- Avoid opportunistic refactors outside requested scope
- If re-editing the same area without clear progress, stop and report: done, blocked, and smallest next decision

## Supermemory Usage

Use Supermemory proactively to improve continuity and execution quality.

- At task start: search Supermemory for relevant project/user context
- During work: store durable, reusable knowledge (goals, plan decisions, surprises, error->solution mappings, architecture decisions, preferences)
- At task completion: store concise outcome summary and important follow-ups
- Retrieve memories when planning, debugging, or making tradeoffs
- Avoid duplicate entries; prefer updating or replacing stale memory with a concise current version

Memory hygiene rules:
- Do NOT store secrets, credentials, tokens, or sensitive raw logs
- Avoid noisy/transient details that won't help future tasks
- Prefer concise, high-signal entries
- Use appropriate scope (`user` vs `project`) and type

## Code Documentation

**Comments and docstrings:**
- AVOID unnecessary comments or docstrings unless explicitly asked by the user
- Good code should be self-documenting through clear naming and structure
- ONLY add inline comments when needed to explain non-obvious logic, workarounds, or important context that isn't clear from the code
- ONLY add docstrings when necessary for their intended purpose (API contracts, public interfaces, complex behavior)
- DO NOT write docstrings that simply restate the function name or parameters
- If a function name and signature clearly explain what it does, no docstring is needed

**Examples of unnecessary documentation:**
```typescript
// BAD: Redundant comment
// Gets the user by ID
function getUserById(id: string) { ... }

// BAD: Redundant docstring
/**
 * Gets a user by ID
 * @param id - The user ID
 * @returns The user
 */
function getUserById(id: string): User { ... }

// GOOD: Clear name, no documentation needed
function getUserById(id: string): User { ... }

// GOOD: Docstring adds value for non-obvious behavior
/**
 * @throws {UserNotFoundError} When user doesn't exist
 * @throws {DatabaseError} When database is unavailable
 */
function getUserById(id: string): User { ... }
```

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

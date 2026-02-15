# Advanced CI/CD Management

## Running Pipelines with Variables

```bash
# Simple variables
glab ci run -b main --variables key1:val1,key2:val2
# Or repeated flags
glab ci run -b main --variables-env key1:val1 --variables-env key2:val2

# File variables (file contents passed as variable)
glab ci run -b main --variables-file MYKEY:file1

# From JSON file
glab ci run -b main -f variables.json
# JSON format: array of objects with at least "key" and "value"
```

## Pipeline Inputs (typed, newer feature)

```bash
glab ci run -b main --input key1:val1 --input key2:val2

# Typed inputs
glab ci run -b main --input "replicas:int(3)"
glab ci run -b main --input "debug:bool(false)"
glab ci run -b main --input "regions:array(us-east,eu-west)"
```

**Types:** string (default), int, float, bool, array

**Array syntax:**
- Trailing comma: `array(foo,bar,)` → `[foo, bar]`
- Empty array: `array()`
- Array with empty string: `array(,)`
- Quote values with parentheses: `--input 'key:array(foo,bar)'`

**NEVER** use `--variables` or `--input` with `--mr` flag — incompatible.

## MR Pipelines vs Branch Pipelines

```bash
glab ci run              # branch pipeline (runs branch HEAD)
glab ci run --mr         # MR pipeline (runs merge result)
```

**Decision tree:**
```
Need to test merge result? → glab ci run --mr
Need to test branch state? → glab ci run
```

## Pipeline Triggering with Trigger Tokens

Use `glab ci run-trig` to run pipelines with a trigger token (for cross-project or external triggers):

```bash
# Run pipeline with trigger token
glab ci run-trig -t $TRIGGER_TOKEN -b main

# With variables
glab ci run-trig -t $TRIGGER_TOKEN -b main --variables key1:val1,key2:val2

# With typed inputs
glab ci run-trig -t $TRIGGER_TOKEN -b main --input "replicas:int(3)"

# Token can be omitted if CI_JOB_TOKEN env var is set
glab ci run-trig -b main
```

**Note:** `glab ci trigger` is for triggering **manual jobs** (jobs with `when: manual`), not for pipeline trigger tokens.

## CI/CD Schedules

```bash
glab schedule list
glab schedule run <schedule-id>
```

## Job Management

```bash
# Retry a failed job (by job ID or name)
glab ci retry                  # interactive selection
glab ci retry 224356863        # by job ID
glab ci retry lint             # by job name
glab ci retry lint -p 12345    # within specific pipeline

# Trigger a manual job (jobs with when: manual)
glab ci trigger                # interactive selection
glab ci trigger deploy         # by job name
glab ci trigger 224356863      # by job ID

# Cancel entire pipeline
glab ci cancel <pipeline-id>

# Cancel specific job: use glab ci view TUI, then Ctrl+D

# Download job artifacts
glab job artifact main build   # download artifacts from 'build' job on 'main' branch
```

## CI Config

```bash
glab ci config                    # view CI config
glab ci config compile            # compile/expand CI config (resolves includes)
```

## Linting with Context

```bash
glab ci lint                      # basic validation
glab ci lint --dry-run            # simulate pipeline creation
glab ci lint --dry-run --ref main # simulate against specific ref
glab ci lint --include-jobs       # show which jobs would run
```

**Pre-push validation pattern:**
```bash
glab ci lint --dry-run --include-jobs
```

## Pipeline Status Monitoring Patterns

| Pattern | Command | Use Case |
|---------|---------|----------|
| Quick check | `glab ci status` | One-shot status |
| Wait until done | `glab ci status --live` | Real-time updates |
| Stream job logs | `glab ci trace <job-name>` | Follow log output |
| Full TUI | `glab ci view` | Interactive navigation, retry/cancel |

## Common CI/CD Workflows

| Task | Command |
|------|---------|
| Check if pipeline passed | `glab ci status` |
| Wait for pipeline | `glab ci status --live` |
| Find why pipeline failed | `glab ci view` then Enter on failed job |
| Retry a failed job | `glab ci retry <job-name>` |
| Trigger a manual job | `glab ci trigger <job-name>` |
| Run new pipeline on branch | `glab ci run -b <branch>` |
| Validate CI config before push | `glab ci lint --dry-run --include-jobs` |
| See expanded CI config | `glab ci config compile` |
| Run pipeline with trigger token | `glab ci run-trig -t TOKEN -b main` |
| Run scheduled pipeline manually | `glab schedule run <id>` |

## Variable vs Input Decision Tree

```
Need typed values (int, bool, array)? → --input
Need file contents as variable? → --variables-file
Simple string key-value pairs? → --variables
Running MR pipeline? → NEITHER (incompatible)
```

## Pipeline Execution Decision Tree

```
What are you testing?
├─ Merge result → glab ci run --mr
├─ Branch state → glab ci run -b <branch>
├─ With custom variables → glab ci run -b <branch> --variables key:val
├─ With typed inputs → glab ci run -b <branch> --input key:type(val)
├─ With trigger token → glab ci run-trig -t TOKEN -b <branch>
└─ Scheduled pipeline → glab schedule run <id>
```

## Monitoring Decision Tree

```
What do you need?
├─ Quick status check → glab ci status
├─ Wait for completion → glab ci status --live
├─ Investigate failure → glab ci view (TUI)
├─ Follow specific job → glab ci trace <job-name>
└─ Download artifacts → glab job artifact <ref> <job-name>
```

## NEVER

- Use `--variables` or `--input` with `--mr` flag — they're incompatible
- Confuse `glab ci trigger` (triggers manual jobs) with `glab ci run-trig` (runs pipeline with trigger token)
- Use `glab ci run` when you need merge result testing (use `--mr`)
- Skip `glab ci lint --dry-run` before pushing complex CI changes
- Confuse `glab ci retry` (retries a single job) with starting a new pipeline (use `glab ci run`)
- Poll `glab ci status` in loop (use `--live` flag)

## Advanced Patterns

**Conditional pipeline execution:**
```bash
# Validate before running
glab ci lint --dry-run --include-jobs && glab ci run -b main
```

**Wait and report:**
```bash
glab ci run -b main && glab ci status --live
```

**Debug CI config:**
```bash
# See what actually runs
glab ci config compile > expanded.yml
# Validate expanded config
glab ci lint --dry-run --include-jobs
```

**Job-specific investigation:**
```bash
# Find pipeline ID
glab ci status
# Interactive job browser (shows all jobs)
glab ci view
# Stream specific job logs
glab ci trace <job-name>
# Download job artifacts
glab job artifact <ref> <job-name>
```

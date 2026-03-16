# Skill Frontmatter Specification

Based on the official Agent Skills specification: https://agentskills.io/specification

Skills are an open standard designed to be portable across tools (OpenCode, Claude Code, etc.).

## Required Fields

### name

**Type:** string (1-64 characters)
**Format:** lowercase letters, numbers, and hyphens only
**Rules:**
- Must match directory name exactly
- Cannot start or end with hyphen
- Cannot contain consecutive hyphens (`--`)

```yaml
name: my-skill-name
```

**Valid:** `pdf-processing`, `data-analysis`, `code-review`
**Invalid:** `PDF-Processing` (uppercase), `-pdf` (starts with hyphen), `pdf--processing` (consecutive hyphens)

### description

**Type:** string (1-1024 characters)
**Purpose:** Describes WHAT the skill does and WHEN to use it
**Rules:**
- Must be non-empty
- Should include specific keywords that help agents identify relevant tasks

```yaml
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
```

**Good:** Includes what it does + when to use + trigger keywords
**Bad:** `Helps with PDFs.` (too vague)

## Optional Fields

### license

**Type:** string
**Purpose:** License for skill distribution
**Recommendation:** Keep short - license name or reference to bundled file

```yaml
license: Apache-2.0
```

```yaml
license: Proprietary. LICENSE.txt has complete terms
```

### compatibility

**Type:** string (1-500 characters)
**Purpose:** Environment requirements - intended product, system packages, network access
**Note:** Most skills don't need this field

```yaml
compatibility: Designed for Claude Code (or similar products)
```

```yaml
compatibility: Requires git, docker, jq, and access to the internet
```

### metadata

**Type:** map (string keys to string values)
**Purpose:** Additional properties not defined by the spec
**Recommendation:** Make key names reasonably unique to avoid conflicts

```yaml
metadata:
  author: example-org
  version: "1.0"
```

### allowed-tools

**Type:** space-delimited list of tools
**Status:** Experimental - support varies between implementations
**Purpose:** Pre-approved tools the skill may use

```yaml
allowed-tools: Bash(git:*) Bash(jq:*) Read
```

## Complete Example

```yaml
---
name: pdf-processing
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.
license: Apache-2.0
compatibility: Requires poppler-utils for PDF processing
metadata:
  author: example-org
  version: "1.0"
---
```

## NOT in Spec (Tool-Specific)

These fields are NOT part of the Agent Skills spec and break portability:

| Field | Issue |
|-------|-------|
| `version` | Use `metadata.version` instead |
| `tools` | Tool permissions are implementation-specific |
| `category` | Use `metadata.category` instead |
| `color` | UI-specific |
| `displayName` | UI-specific |

## Directory Structure

```
skill-name/
├── SKILL.md              # Required
├── scripts/              # Optional: executable code
├── references/           # Optional: additional documentation
└── assets/               # Optional: templates, images, data files
```

## Progressive Disclosure

Structure skills for efficient context use:

1. **Metadata** (~100 tokens) - `name` + `description` loaded at startup for all skills
2. **Instructions** (<5000 tokens) - Full SKILL.md body loaded when skill activated
3. **Resources** (as needed) - scripts/, references/, assets/ loaded only when required

**Keep SKILL.md under 500 lines.** Move detailed reference material to separate files.

## File References

Use relative paths from skill root, one level deep:

```markdown
See [the reference guide](references/REFERENCE.md) for details.
Run: scripts/extract.py
```

Avoid deeply nested reference chains.

## Validation

Use the official reference library:

```bash
skills-ref validate ./my-skill
```

Or the local validation script:

```bash
uv run scripts/quick_validate.py /path/to/skill-directory
```

## Source

Official specification: https://agentskills.io/specification
Reference library: https://github.com/agentskills/agentskills/tree/main/skills-ref

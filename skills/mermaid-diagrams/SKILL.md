---
name: mermaid-diagrams
description: Create and render Mermaid diagrams with correct syntax and the mmdc CLI. Use when the user asks to "create a diagram", "draw a flowchart", "make a sequence diagram", "render mermaid", "generate a chart", "visualize architecture", "create an ER diagram", mentions "mermaid", asks for any visual diagram (flowchart, sequence, class, state, ER, gantt, git graph, pie, mind map, timeline, quadrant, sankey, XY chart, block, packet, kanban, architecture, radar, treemap, C4, user journey, requirement diagram), or wants to render/export diagrams to SVG/PNG/PDF.
---

# Mermaid Diagrams

Create Mermaid diagrams with correct syntax and render them via `mmdc` CLI.

## Rendering Workflow

1. Write diagram to a `.mmd` file
2. Render with `mmdc`
3. Return the output file path to the user

```bash
# Write diagram
cat << 'EOF' > /tmp/diagram.mmd
flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do thing]
    B -->|No| D[Skip]
    C --> E[End]
    D --> E
EOF

# Render
mmdc -i /tmp/diagram.mmd -o /tmp/diagram.svg
mmdc -i /tmp/diagram.mmd -o /tmp/diagram.png -b transparent
mmdc -i /tmp/diagram.mmd -o /tmp/diagram.png -t dark -b '#1a1a2e' -s 2
mmdc -i /tmp/diagram.mmd -o /tmp/diagram.pdf -f
```

### mmdc CLI Reference

| Flag | Description | Default |
|------|-------------|---------|
| `-i, --input <file>` | Input .mmd or .md file. `-` for stdin | Required |
| `-o, --output [file]` | Output file (.svg/.png/.pdf/.md). `-` for stdout | input.svg |
| `-e, --outputFormat [format]` | Force output format: svg, png, pdf | From extension |
| `-t, --theme [theme]` | Theme: default, forest, dark, neutral | default |
| `-w, --width [px]` | Page width | 800 |
| `-H, --height [px]` | Page height | 600 |
| `-s, --scale [n]` | Puppeteer scale factor (for PNG sharpness) | 1 |
| `-b, --backgroundColor [color]` | Background: transparent, #hex, named | white |
| `-c, --configFile [file]` | Mermaid JSON config file | none |
| `-C, --cssFile [file]` | Custom CSS file | none |
| `-f, --pdfFit` | Scale PDF to fit chart | false |
| `-q, --quiet` | Suppress log output | false |
| `-p, --puppeteerConfigFile [file]` | Puppeteer JSON config file | none |
| `-I, --svgId [id]` | The id attribute for SVG element | none |
| `-a, --artefacts [path]` | Output artefacts path (Markdown input only) | output dir |
| `--iconPacks <icons...>` | Iconify icon packs (e.g. @iconify-json/logos) | [] |

### Mermaid Config File (-c)

```json
{
  "theme": "dark",
  "themeVariables": {
    "primaryColor": "#BB2528",
    "primaryTextColor": "#fff",
    "lineColor": "#F8B229"
  },
  "flowchart": { "curve": "basis" }
}
```

### Linux Sandbox Fix

If `mmdc` fails with sandbox errors:

```bash
echo '{"args":["--no-sandbox"]}' > /tmp/puppeteer-config.json
mmdc -i input.mmd -o output.svg -p /tmp/puppeteer-config.json
```

## Diagram Strategy

Before generating, consider:
- **Audience**: Engineers → Class/Sequence/ER. Stakeholders → Flowchart/Mindmap/Gantt.
- **Complexity**: >15 nodes → split into subgraphs or multiple diagrams.
- **Direction**: Process flows → TD. Timelines/sequences → LR. Hierarchies → TD.
- **Rendering**: Default SVG for web. PNG with `-s 2` for docs/slides. PDF with `-f` for print.

## Diagram Type Selection

| Need | Diagram Type | Declaration |
|------|-------------|-------------|
| Process flow, decisions | Flowchart | `flowchart TD` |
| API calls, actor interactions | Sequence | `sequenceDiagram` |
| OOP design, domain models | Class | `classDiagram` |
| State machines, workflows | State | `stateDiagram-v2` |
| Database schema | ER | `erDiagram` |
| Project timeline, scheduling | Gantt | `gantt` |
| Branch strategy | Git Graph | `gitGraph` or `gitGraph TB:` |
| Data distribution | Pie | `pie` or `pie showData` |
| Topic hierarchy, brainstorm | Mind Map | `mindmap` |
| UX flow with satisfaction | User Journey | `journey` |
| Priority matrix, 2-axis plot | Quadrant | `quadrantChart` |
| Requirements traceability | Requirement | `requirementDiagram` |
| Historical events | Timeline | `timeline` |
| Flow quantities between nodes | Sankey | `sankey-beta` |
| Bar/line charts | XY Chart | `xychart-beta` |
| Grid layouts, dashboards | Block | `block-beta` |
| Network protocol headers | Packet | `packet-beta` |
| Task boards | Kanban | `kanban` |
| Infrastructure topology | Architecture | `architecture-beta` |
| Multi-dimensional comparison | Radar | `radar-beta` |
| Hierarchical proportions | Treemap | `treemap-beta` |
| Software architecture (C4) | C4 | `C4Context`, `C4Container`, `C4Component` |
| Alternative sequence syntax | ZenUML | `zenuml` |

## Quick Syntax — Most Used Types

### Flowchart

```
flowchart TD
    A[Rectangle] --> B(Rounded)
    B --> C{Diamond}
    C -->|Yes| D[Result]
    C -->|No| E[Other]
    
    subgraph Group
        D --> F((Circle))
    end
```

**Directions**: `TD`/`TB`, `BT`, `LR`, `RL`

**Node shapes**: `[rect]`, `(rounded)`, `{diamond}`, `((circle))`, `([stadium])`, `[[subroutine]]`, `[(cylinder)]`, `{{hexagon}}`, `[/parallelogram/]`, `[/trapezoid\]`, `(((double circle)))`

**Edges**:
- `-->` solid arrow, `---` solid no arrow
- `-.->` dotted arrow, `==>` thick arrow
- `--x` cross end, `--o` circle end
- `<-->` bidirectional
- `-->|label|` or `-- label -->`
- Extra dashes = longer link: `--->`, `---->` 

**Styling**:
```
style nodeId fill:#f9f,stroke:#333,stroke-width:4px
classDef highlight fill:#f96,stroke:#333
A:::highlight
linkStyle 0 stroke:#ff3,stroke-width:4px
```

### Sequence Diagram

```
sequenceDiagram
    actor User
    participant API
    participant DB

    User ->>+ API: POST /login
    API ->> DB: Query user
    DB -->> API: User record
    
    alt Valid credentials
        API -->>- User: 200 JWT token
    else Invalid
        API -->> User: 401 Unauthorized
    end
```

**Messages**: `->>` solid arrow, `-->>` dotted arrow, `-x` cross, `-)` async open arrow, `<<->>` bidirectional

**Activations**: `->>+` activate, `-->>-` deactivate

**Notes**: `Note right of A: text`, `Note over A,B: text`

**Control flow**: `loop`, `alt/else`, `opt`, `par/and`, `critical/option`, `break`, `rect rgb()` (highlight)

**Boxes**: `box Title` ... `end` to group participants

### Class Diagram

```
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()* void
        +sleep() void
    }
    class Dog {
        +fetch() void
    }
    Animal <|-- Dog
    Animal "1" --> "*" Food : eats
```

**Visibility**: `+` public, `-` private, `#` protected, `~` package

**Classifiers**: `*` abstract, `$` static

**Relationships**: `<|--` inheritance, `*--` composition, `o--` aggregation, `-->` association, `..>` dependency, `..|>` realization

**Cardinality**: `"1"`, `"0..1"`, `"1..*"`, `"*"`

**Annotations**: `<<Interface>>`, `<<Abstract>>`, `<<Enumeration>>`

### State Diagram

```
stateDiagram-v2
    [*] --> Idle
    Idle --> Processing : submit
    Processing --> Success : valid
    Processing --> Error : invalid
    Error --> Idle : retry
    Success --> [*]

    state Processing {
        [*] --> Validating
        Validating --> Saving
        Saving --> [*]
    }
```

**Special states**: `[*]` start/end, `<<choice>>`, `<<fork>>`, `<<join>>`

**Concurrency**: `--` separator inside composite state

### ER Diagram

```
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    PRODUCT }|..|{ ORDER : "ordered in"

    CUSTOMER {
        string name PK
        string email UK
        int age
    }
    ORDER {
        int id PK
        date created
        int customer_id FK
    }
```

**Cardinality**: `||` exactly one, `o|` zero or one, `}|` one or more, `o{` zero or more

**Line type**: `--` identifying (solid), `..` non-identifying (dashed)

**Attribute keys**: `PK`, `FK`, `UK` (combinable: `PK, FK`)

### Gantt Chart

```
gantt
    title Project Plan
    dateFormat YYYY-MM-DD
    excludes weekends

    section Phase 1
    Research       :done, a1, 2024-01-01, 10d
    Design         :active, a2, after a1, 15d

    section Phase 2
    Build          :crit, a3, after a2, 30d
    Test           :a4, after a3, 15d
    Launch         :milestone, after a4, 0d
```

**Task tags**: `done`, `active`, `crit`, `milestone` (combinable)

**Duration**: `10d`, `5h`, `2w`. Dependencies: `after taskId`

### Git Graph

```
gitGraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop tag: "v1.0"
    commit
```

**Commands**: `commit` (optional: `id:`, `type: NORMAL|REVERSE|HIGHLIGHT`, `tag:`), `branch name`, `checkout name`, `merge name`, `cherry-pick id:`

### Mind Map

```
mindmap
    root((Project))
        Frontend
            React
            TypeScript
        Backend
            Go
            PostgreSQL
        Infrastructure
            Kubernetes
            Terraform
```

Indentation-based. Shapes: `[square]`, `(rounded)`, `((circle))`, `))bang((`, `)cloud(`, `{{hexagon}}`

## NEVER

- NEVER use `graph` without a direction — always `flowchart TD` or `graph LR`
- NEVER use bare `stateDiagram` — use `stateDiagram-v2`
- NEVER use the word `end` as a node ID — it breaks the parser. Use `End` or `finish` or wrap in quotes
- NEVER put spaces in node IDs — use underscores or camelCase
- NEVER forget quotes around ER relationship labels with spaces: `"ordered in"`
- NEVER use `0` as a score in user journey — range is 1–5
- NEVER use categorical y-axis in XY charts — y-axis is numeric only
- NEVER use `%%{init:}%%` directives in new code — use frontmatter `---\nconfig:\n---` instead
- NEVER render without testing syntax first — write to .mmd file, then render
- NEVER use `radar-beta` without defining axes first — axes are required
- NEVER use negative values in treemap diagrams — only positive values supported
- NEVER start flowchart node with `o` or `x` without space — `A---oB` creates circle edge, use `A--- oB`
- NEVER use `create` or `destroy` in sequence diagrams without proper message flow

## Full Syntax Reference

For diagram types beyond the quick syntax above (Sankey, XY Chart, Block, Packet, Kanban, Architecture, User Journey, Quadrant, Requirement, Timeline), or for advanced features (v11+ shapes, edge animations, theming variables, icon/image nodes):

**MANDATORY**: Read [references/syntax-reference.md](references/syntax-reference.md) before generating these diagram types.

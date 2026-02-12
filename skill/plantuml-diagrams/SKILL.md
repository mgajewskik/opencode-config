---
name: plantuml-diagrams
description: Create and render PlantUML diagrams with correct syntax and the plantuml CLI. Use when the user asks to "create a puml diagram", "draw a plantuml diagram", "generate puml", "visualize with plantuml", mentions "puml" or "plantuml", or asks for PlantUML-specific diagrams (sequence, class, component, deployment, activity, ER, state, mindmap, gantt, C4, AWS architecture, K8s). Do NOT trigger on generic "diagram" or "mermaid" requests — those use the mermaid-diagrams skill.
---

## Rendering Workflow

1. Write diagram to a `.puml` file in the project directory
2. Make all changes to the diagram before rendering
3. Render with `plantuml` only when diagram is complete
4. Open for preview with `xdg-open` (background process)
5. Return the output file path to the user

```bash
# Render PNG and open preview (only after all changes are done)
plantuml -tpng diagram.puml && xdg-open diagram.png &

# Other formats
plantuml -tsvg diagram.puml
plantuml -tpdf diagram.puml

# Terminal preview (no file generated, prints to stdout)
plantuml -tutxt -pipe < diagram.puml

# Custom output directory
plantuml -tpng -o output_dir diagram.puml

# Check syntax without rendering
plantuml -checkonly diagram.puml
```

### plantuml CLI Reference

| Flag | Description | Default |
|------|-------------|---------|
| `-tpng` | PNG output | Default |
| `-tsvg` | SVG output | |
| `-tpdf` | PDF output | |
| `-ttxt` | ASCII art output | |
| `-tutxt` | Unicode ASCII art | |
| `-pipe` | Read stdin, write stdout | |
| `-o <dir>` | Output directory | Same as input |
| `-theme <name>` | Apply theme | none |
| `-darkmode` | Dark mode rendering | |
| `-checkonly` | Syntax check only | |
| `-v` | Verbose logging | |
| `-nometadata` | Don't embed source in PNG | |

### Smetana Fallback

If Graphviz is not installed, use the built-in Java layout engine:
```
!pragma layout smetana
```
Add at top of `.puml` file. Works for most diagram types except some edge cases.

## Diagram Strategy

Before generating, consider:
- **Audience**: Engineers → Class/Sequence/Component/ER. Stakeholders → Activity/MindMap/Gantt.
- **Complexity**: >15 nodes → split into multiple diagrams or use packages/groups.
- **Direction**: `left to right direction` for wide diagrams. Default is top-down.
- **Cloud/K8s**: Read [references/cloud-architecture.md](references/cloud-architecture.md) for AWS, Azure, GCP, K8s, C4 patterns.

## Diagram Type Selection

| Need | Diagram Type | Start Tag |
|------|-------------|-----------|
| API calls, service interactions | Sequence | `@startuml` |
| OOP design, domain models | Class | `@startuml` |
| Database schema (crow's foot) | IE/ER | `@startuml` |
| Database schema (Chen notation) | ER | `@startchen` |
| Process flow, decisions | Activity | `@startuml` |
| System architecture, packages | Component | `@startuml` |
| Infrastructure, nodes | Deployment | `@startuml` |
| AWS/Azure/GCP architecture | Component + stdlib | `@startuml` |
| K8s cluster layout | Component + stdlib | `@startuml` |
| C4 model (context/container) | C4 + stdlib | `@startuml` |
| State machines | State | `@startuml` |
| Object instances | Object | `@startuml` |
| Topic hierarchy, brainstorm | Mind Map | `@startmindmap` |
| Project breakdown | WBS | `@startwbs` |
| Project timeline | Gantt | `@startgantt` |
| Network topology | nwdiag | `@startuml` |
| Data visualization | JSON/YAML | `@startjson` / `@startyaml` |

For cloud/K8s/C4 diagrams: **MANDATORY** read [references/cloud-architecture.md](references/cloud-architecture.md).
For diagram types beyond the quick syntax below: read [references/extra-diagrams.md](references/extra-diagrams.md).

## Quick Syntax — Core Types

### Sequence Diagram

```
@startuml
actor User
participant API
database DB

User -> API ++: POST /login
API -> DB: Query user
DB --> API: User record

alt Valid credentials
    API --> User --: 200 JWT token
else Invalid
    API --> User: 401 Unauthorized
end

note right of API: Auth service
== Later ==
User -> API: GET /data
@enduml
```

**Participants**: `participant`, `actor`, `boundary`, `control`, `entity`, `database`, `collections`, `queue`

**Arrows**: `->` solid, `-->` dotted, `->x` lost, `<->` bidirectional, `-[#red]->` colored

**Activation**: `-> Target ++:` activate, `--> Source --:` deactivate, or explicit `activate`/`deactivate`

**Grouping**: `alt/else`, `opt`, `loop`, `par/and`, `break`, `critical`, `group` — all close with `end`

**Notes**: `note left of A: text`, `note right of A: text`, `note over A,B: text`

**Other**: `autonumber`, `== Divider ==`, `...delay...`, `|||` extra space, `box "Group" ... end box`

### Class / ER Diagram

```
@startuml
class User {
  -id: int
  -name: String
  +getName(): String
  +setName(name: String): void
}

class Order {
  -orderId: int
  -total: Decimal
  +calculate(): Decimal
}

User "1" --> "*" Order : places

interface Payable <<Interface>> {
  +pay(): void
}

Order ..|> Payable
@enduml
```

**Visibility**: `+` public, `-` private, `#` protected, `~` package

**Modifiers**: `{static}`, `{abstract}`

**Relationships**:
- `<|--` inheritance, `<|..` realization
- `*--` composition, `o--` aggregation
- `-->` association, `..>` dependency

**Cardinality**: `"1" --> "*"`, `"0..1"`, `"1..*"`

**Packages**: `package Name { }`, **Stereotypes**: `<<Interface>>`, `<<Abstract>>`, `<<Enumeration>>`

#### IE/ER (Crow's Foot)

```
@startuml
skinparam linetype ortho

entity Customer {
  * customer_id : int <<PK>>
  --
  * name : varchar
  email : varchar
}

entity Order {
  * order_id : int <<PK>>
  --
  * customer_id : int <<FK>>
  * created_at : timestamp
  total : decimal
}

Customer ||--o{ Order : places
@enduml
```

**Cardinality**: `||` exactly one, `o|` zero or one, `}|` one or more, `o{` zero or more

**Line**: `--` solid (identifying), `..` dashed (non-identifying)

**Attributes**: `*` mandatory, `<<PK>>`, `<<FK>>`

**IMPORTANT**: Always use `skinparam linetype ortho` for clean crow's feet rendering.

### Activity Diagram (Flowchart)

```
@startuml
start
:Read input;
if (Valid?) then (yes)
  :Process data;
  fork
    :Save to DB;
  fork again
    :Send notification;
  end fork
else (no)
  :Show error;
  stop
endif
:Return result;
stop
@enduml
```

**Actions**: `:text;` — MUST end with `;`

**Conditionals**: `if (cond?) then (yes) ... else (no) ... endif`

**Switch**: `switch (test?) case (A) ... case (B) ... endswitch`

**Loops**: `while (cond?) ... endwhile`, `repeat ... repeat while (cond?)`

**Parallel**: `fork ... fork again ... end fork`

**Swimlanes**: `|Lane Name|` before actions

**Colors**: `:action; #LightBlue`

**Kill/Detach**: `kill` (X end), `detach` (arrow end)

### Component / Deployment Diagram

```
@startuml
package "Frontend" {
  [Web App]
  [Mobile App]
}

cloud "Cloud" {
  node "API Server" {
    [REST API]
    [Auth Service]
  }
  database "PostgreSQL" {
    [Users DB]
    [Orders DB]
  }
}

[Web App] --> [REST API] : HTTPS
[Mobile App] --> [REST API] : HTTPS
[REST API] --> [Auth Service]
[REST API] --> [Users DB]
[REST API] --> [Orders DB]
@enduml
```

**Components**: `[Name]` or `component "Name" as alias`

**Interfaces**: `() "Name"` or `interface Name`

**Grouping**: `package`, `node`, `folder`, `frame`, `cloud`, `database`, `rectangle`, `storage`, `queue`

**Connections**: `-->` arrow, `..>` dotted arrow, `--` line, `..` dotted line

**Ports**: `portin p1`, `portout p2` inside component blocks

**Styled connections**: `-[#red,dashed,thickness=2]->`

## Theming

```
@startuml
!theme spacelab
' or: !theme cerulean, vibrant, materia, bluegray, amiga, hacker
```

CLI: `plantuml -theme spacelab diagram.puml`

Key skinparams:
```
skinparam backgroundColor white
skinparam monochrome true
skinparam shadowing false
skinparam defaultFontName "Helvetica"
skinparam class {
  BackgroundColor PaleGreen
  BorderColor DarkGreen
}
```

List all themes: `!theme _` generates error listing available themes.

## NEVER

- NEVER use `<awslib/NetworkingAndContentDelivery/...>` — the correct category is `NetworkingContentDelivery` (without "And")
- NEVER use `<awslib/...>` without `!include <awslib/AWSCommon>` first (or `awslib14`, `awslib20`)
- NEVER forget `;` at end of activity diagram actions — `:text;` not `:text`
- NEVER use `@startuml` for mindmap/WBS/gantt — use `@startmindmap`, `@startwbs`, `@startgantt`
- NEVER use `end` as a node/state name — reserved keyword, use `End` or `Finish`
- NEVER skip `then` keyword in activity `if` statements
- NEVER use deprecated `!define` — use `!$var = value`
- NEVER forget `end` to close grouping blocks (alt, loop, opt, par, etc.)
- NEVER render without writing to `.puml` file first — always write file, then render
- NEVER assume crow's feet render well without `skinparam linetype ortho`
- NEVER use spaces in participant/class names without quotes — use `"Long Name" as alias`
- NEVER use `graph` keyword — PlantUML uses `@startuml` not `graph`

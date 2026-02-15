---
name: plantuml-diagrams
description: Create and render PlantUML diagrams with correct syntax and the plantuml CLI. Use when the user asks to "create a puml diagram", "draw a plantuml diagram", "generate puml", "visualize with plantuml", mentions "puml" or "plantuml", or asks for PlantUML-specific diagrams (sequence, class, component, deployment, activity, ER, state, mindmap, gantt, C4, AWS architecture, K8s, use case, timing, nwdiag, network diagram, wireframe, salt mockup, archimate, EBNF grammar, regex diagram, ditaa). Do NOT trigger on generic "diagram" or "mermaid" requests — those use the mermaid-diagrams skill.
metadata:
  version: "2.0"
---

## Workflow

1. Write diagram to `.puml` file in project directory
2. Render with `plantuml` only when diagram is complete
3. Open preview with `xdg-open` (background process)
4. Return output file path to user

```bash
# Render PNG and open preview
plantuml -tpng diagram.puml && xdg-open diagram.png &

# Other formats
plantuml -tsvg diagram.puml   # SVG (scalable)
plantuml -tpdf diagram.puml   # PDF
plantuml -tutxt -pipe < diagram.puml  # Terminal preview (no file)

# Syntax check only (no render)
plantuml -checkonly diagram.puml

# Custom output directory
plantuml -o output_dir diagram.puml
```

## Diagram Type Decision Tree

```
What are you visualizing?
│
├─ Interactions/flow between actors?
│  ├─ Time-ordered messages → Sequence
│  ├─ User goals/scenarios → Use Case
│  └─ Precise timing constraints → Timing
│
├─ System structure?
│  ├─ Code/domain model → Class
│  ├─ Object instances → Object
│  ├─ Database schema → IE/ER (crow's foot) or Chen ER
│  ├─ System components → Component
│  └─ Infrastructure/nodes → Deployment
│
├─ Behavior/process?
│  ├─ Flowchart/decisions → Activity
│  └─ State transitions → State
│
├─ Cloud/infrastructure?
│  ├─ AWS/Azure/GCP → Component + stdlib (read references/cloud-architecture.md)
│  ├─ Kubernetes → Component + K8s stdlib
│  └─ C4 model → C4 stdlib
│
├─ Planning/organization?
│  ├─ Project timeline → Gantt
│  ├─ Topic hierarchy → Mind Map
│  └─ Work breakdown → WBS
│
├─ Data visualization?
│  ├─ Network topology → nwdiag
│  └─ Config/data → JSON/YAML
│
├─ Documentation/specs?
│  ├─ UI mockup → Salt (@startsalt)
│  ├─ Grammar/syntax → EBNF (@startebnf)
│  ├─ Regex pattern → Regex (@startregex)
│  └─ ASCII art → Ditaa (@startditaa)
│
└─ Enterprise architecture?
   └─ ArchiMate model → Archimate
```

## Quick Reference

| Need | Type | Start Tag |
|------|------|-----------|
| API calls, service interactions | Sequence | `@startuml` |
| User goals, scenarios | Use Case | `@startuml` |
| OOP design, domain models | Class | `@startuml` |
| Database schema (crow's foot) | IE/ER | `@startuml` |
| Database schema (Chen notation) | ER | `@startchen` |
| Process flow, decisions | Activity | `@startuml` |
| System architecture | Component | `@startuml` |
| Infrastructure, nodes | Deployment | `@startuml` |
| State machines | State | `@startuml` |
| Precise timing | Timing | `@startuml` |
| AWS/Azure/GCP | Component + stdlib | `@startuml` |
| K8s cluster | Component + stdlib | `@startuml` |
| C4 model | C4 stdlib | `@startuml` |
| Topic hierarchy | Mind Map | `@startmindmap` |
| Work breakdown | WBS | `@startwbs` |
| Project timeline | Gantt | `@startgantt` |
| Network topology | nwdiag | `@startuml` |
| JSON/YAML data | JSON/YAML | `@startjson` / `@startyaml` |
| UI mockup/wireframe | Salt | `@startsalt` |
| Grammar/syntax | EBNF | `@startebnf` |
| Regex visualization | Regex | `@startregex` |
| ASCII art conversion | Ditaa | `@startditaa` |
| Enterprise architecture | Archimate | `@startuml` + include |

**For cloud/K8s/C4:** Read [references/cloud-architecture.md](references/cloud-architecture.md)
**For extra types:** Read [references/extra-diagrams.md](references/extra-diagrams.md)

## CLI Reference

| Flag | Description |
|------|-------------|
| `-tpng` | PNG output (default) |
| `-tsvg` | SVG output |
| `-tpdf` | PDF output (requires Apache Batik) |
| `-ttxt` | ASCII art (outputs `.atxt`) |
| `-tutxt` | Unicode ASCII (outputs `.utxt`) |
| `-pipe` | Read stdin, write stdout |
| `-o <dir>` | Output directory |
| `-theme <name>` | Apply theme |
| `--dark-mode` | Dark mode rendering |
| `-checkonly` | Syntax check only |
| `--check-graphviz` | Check Graphviz installation |
| `--disable-metadata` | Don't embed source in PNG |
| `-Playout=smetana` | Use Smetana layout engine |
| `-Playout=elk` | Use ELK layout engine |
| `-Pteoz=true` | Use Teoz engine for sequence diagrams |

### Layout Engines

| Engine | Use Case | Pragma |
|--------|----------|--------|
| Graphviz | Default, best for most diagrams | (default) |
| Smetana | Java port, no Graphviz needed | `!pragma layout smetana` |
| ELK | Orthogonal layout only | `!pragma layout elk` |
| Teoz | Sequence diagrams with anchors/duration | `!pragma teoz true` |

## Core Syntax

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

**Participants:** `participant`, `actor`, `boundary`, `control`, `entity`, `database`, `collections`, `queue`

**Arrows:** `->` solid, `-->` dotted, `->x` lost, `<->` bidirectional, `-[#red]->` colored

**Activation:** `-> Target ++:` activate, `--> Source --:` deactivate

**Grouping:** `alt/else`, `opt`, `loop`, `par/else`, `break`, `critical`, `group` — close with `end`

**Notes:** `note left of A:`, `note right of A:`, `note over A,B:`

**Other:** `autonumber`, `== Divider ==`, `...delay...`, `|||` space, `box "Group" ... end box`

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

**Visibility:** `+` public, `-` private, `#` protected, `~` package

**Modifiers:** `{static}`, `{abstract}`

**Relationships:** `<|--` inheritance, `<|..` realization, `*--` composition, `o--` aggregation, `-->` association, `..>` dependency

**Cardinality:** `"1" --> "*"`, `"0..1"`, `"1..*"`

### IE/ER (Crow's Foot)

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

**Cardinality:** `||` exactly one, `o|` zero or one, `}|` one or more, `o{` zero or more

**Line:** `--` solid (identifying), `..` dashed (non-identifying)

**Attributes:** `*` mandatory, `<<PK>>`, `<<FK>>`

### Activity Diagram

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

**Actions:** `:text;` — MUST end with `;`

**Conditionals:** `if (cond?) then (yes) ... else (no) ... endif`

**Switch:** `switch (test?) case (A) ... case (B) ... endswitch`

**Loops:** `while (cond?) ... endwhile`, `repeat ... repeat while (cond?)`

**Parallel:** `fork ... fork again ... end fork`

**Swimlanes:** `|Lane Name|` before actions

**Kill/Detach:** `kill` (X end), `detach` (arrow end)

### Use Case Diagram

```
@startuml
left to right direction

actor Customer
actor Admin

rectangle "E-Commerce" {
  usecase "Browse Products" as UC1
  usecase "Place Order" as UC2
  usecase "Manage Inventory" as UC3
}

Customer --> UC1
Customer --> UC2
Admin --> UC3
UC2 ..> UC1 : <<include>>
@enduml
```

**Actors:** `actor Name`, `:Name:` (stick figure)

**Use cases:** `usecase "Name"`, `(Name)`

**Relationships:** `-->` association, `..>` include/extend, `--|>` generalization

**Stereotypes:** `<<include>>`, `<<extend>>`

### Component / Deployment

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
  }
}

[Web App] --> [REST API] : HTTPS
[REST API] --> [Auth Service]
[REST API] --> [Users DB]
@enduml
```

**Components:** `[Name]`, `component "Name" as alias`

**Interfaces:** `() "Name"`, `interface Name`

**Grouping:** `package`, `node`, `folder`, `frame`, `cloud`, `database`, `rectangle`, `storage`, `queue`

### Timing Diagram

```
@startuml
robust "Web Browser" as WB
concise "Web User" as WU

@0
WU is Idle
WB is Idle

@100
WU is Waiting
WB is Processing

@300
WB is Waiting
@enduml
```

**Participants:** `robust` (multiple states), `concise` (simple states), `clock`

**States:** `@<time>` then `<participant> is <state>`

**Constraints:** `@<time> <-> @<time> : label`

## Theming

```
@startuml
!theme spacelab
' Available: cerulean, vibrant, materia, bluegray, amiga, hacker
```

CLI: `plantuml -theme spacelab diagram.puml`

Key skinparams:
```
skinparam backgroundColor white  ' themes may set transparent - override explicitly
skinparam monochrome true
skinparam shadowing false
skinparam defaultFontName "Helvetica"
skinparam linetype ortho
```

List themes: `plantuml -help` shows available themes, or check https://the-lum.github.io/puml-themes-gallery/

## Failure Modes

| Scenario | Detection | Fallback |
|----------|-----------|----------|
| Graphviz not installed | `plantuml --check-graphviz` fails | Add `!pragma layout smetana` at top |
| Syntax error | `plantuml -checkonly` returns error | Check NEVER list, fix syntax |
| Crow's feet render poorly | Angled lines look wrong | Add `skinparam linetype ortho` |
| Diagram too large | Output truncated or slow | Split into multiple diagrams, use packages |
| AWS icons not found | Include path error | Use `awslib14` not `awslib`, check category names |
| Mind map renders as class | Wrong diagram type | Use `@startmindmap` not `@startuml` |
| Gantt dates wrong | Tasks overlap incorrectly | Check `Project starts` date, verify closed days |
| C4 macros not found | Include error | Verify `!include <C4/C4_Container>` path |
| K8s sprites missing | Sprite not rendered | Check `!include <kubernetes/k8s-sprites-unlabeled-25pct>` |
| Salt wireframe broken | Elements misaligned | Check brace matching, column separators `|` |

**When in doubt:**
- Run `plantuml -checkonly` before rendering
- Check the NEVER list for common mistakes
- Use `skinparam linetype ortho` for ER diagrams

## NEVER

**Syntax errors:**
- NEVER forget `;` at end of activity diagram actions — `:text;` not `:text`
- NEVER use `@startuml` for mindmap/WBS/gantt — use `@startmindmap`, `@startwbs`, `@startgantt`
- NEVER use `end` as a node/state name — reserved keyword, use `End` or `Finish`
- NEVER skip `then` keyword in activity `if` statements
- NEVER forget `end` to close grouping blocks (alt, loop, opt, par, etc.)
- NEVER use spaces in participant/class names without quotes — use `"Long Name" as alias`
- NEVER use `graph` keyword — PlantUML uses `@startuml` not `graph`

**AWS/Cloud errors:**
- NEVER use `<awslib/NetworkingAndContentDelivery/...>` — correct is `NetworkingContentDelivery` (no "And")
- NEVER use `<awslib/...>` without `!include <awslib/AWSCommon>` first
- NEVER use deprecated `!define` — use `!$var = value`

**Rendering errors:**
- NEVER assume crow's feet render well without `skinparam linetype ortho`
- NEVER render without writing to `.puml` file first — always write file, then render

**Sequence diagram errors:**
- NEVER use `par/and` syntax — use `par/else` for parallel threads
- NEVER use `activate`/`deactivate` without matching pairs
- NEVER forget to close `box ... end box` groups

**Class diagram errors:**
- NEVER use `extends` with interface — use `implements` or `<|..`
- NEVER mix `--` and `-` inconsistently for relationship length

**Activity diagram errors:**
- NEVER use `if` without `endif`
- NEVER use `fork` without `end fork`
- NEVER forget parentheses in conditions: `if (condition?) then (yes)`

**Mind Map/WBS errors:**
- NEVER use `@startuml` for mindmap — use `@startmindmap`
- NEVER use `@startuml` for WBS — use `@startwbs`
- NEVER mix `+` and `-` depth markers inconsistently in same branch

**Gantt errors:**
- NEVER forget `Project starts YYYY-MM-DD` — required for date-based tasks
- NEVER use `[Task] starts [Other]'s end` — correct is `starts at [Other]'s end`

**Salt/Wireframe errors:**
- NEVER use `@startuml` for wireframes — use `@startsalt`
- NEVER forget closing braces `}` for salt containers

**Chen ER errors:**
- NEVER use `@startuml` for Chen notation — use `@startchen`

**EBNF/Regex errors:**
- NEVER use `@startuml` for EBNF — use `@startebnf`
- NEVER use `@startuml` for regex — use `@startregex`

## ALWAYS

- ALWAYS write `.puml` file before rendering
- ALWAYS use `skinparam linetype ortho` for ER/IE diagrams
- ALWAYS include `AWSCommon` before other AWS includes
- ALWAYS use quotes for names with spaces: `"My Service" as svc`
- ALWAYS end activity actions with semicolon: `:action;`
- ALWAYS close grouping blocks: `alt/else/end`, `if/endif`, `fork/end fork`

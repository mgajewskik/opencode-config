# Mermaid Syntax Reference

Complete syntax for all Mermaid diagram types. Organized by diagram type.

## Table of Contents

- [Flowchart](#flowchart)
- [Sequence Diagram](#sequence-diagram)
- [Class Diagram](#class-diagram)
- [State Diagram](#state-diagram)
- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Gantt Chart](#gantt-chart)
- [Git Graph](#git-graph)
- [Pie Chart](#pie-chart)
- [Mind Map](#mind-map)
- [User Journey](#user-journey)
- [Quadrant Chart](#quadrant-chart)
- [Requirement Diagram](#requirement-diagram)
- [Timeline](#timeline)
- [Sankey Diagram](#sankey-diagram)
- [XY Chart](#xy-chart)
- [Block Diagram](#block-diagram)
- [Packet Diagram](#packet-diagram)
- [Kanban Board](#kanban-board)
- [Architecture Diagram](#architecture-diagram)
- [Theming and Configuration](#theming-and-configuration)

---

## Flowchart

**Declaration**: `flowchart` or `graph` followed by direction

**Directions**: `TB`/`TD` (top-down), `BT` (bottom-up), `LR` (left-right), `RL` (right-left)

### Node Shapes

```
id              Default (rectangle)
id[text]        Rectangle
id(text)        Rounded edges
id([text])      Stadium/pill
id[[text]]      Subroutine
id[(text)]      Cylinder/database
id((text))      Circle
id>text]        Asymmetric/flag
id{text}        Rhombus/diamond
id{{text}}      Hexagon
id[/text/]      Parallelogram
id[\text\]      Parallelogram alt
id[/text\]      Trapezoid
id[\text/]      Trapezoid alt
id(((text)))    Double circle
```

**v11.3.0+ shapes** via `@{ shape: name }`:
- `rect`, `rounded`, `stadium`, `pill`, `diam`, `diamond`
- `cyl`, `cylinder`, `doc`, `document`
- `sl-rect` (manual input), `curv-trap` (display)
- 40+ more specialized shapes

**Icon nodes** (v11.3.0+):
```
id@{ icon: "fa:server", form: "square", label: "Server", pos: "b", h: 48 }
```

**Image nodes** (v11.3.0+):
```
id@{ img: "https://example.com/img.png", label: "Label", pos: "t", w: 60, h: 60 }
```

### Edges/Arrows

```
A --> B          Solid with arrow
A --- B          Solid without arrow
A -.-> B         Dotted with arrow
A -.- B          Dotted without arrow
A ==> B          Thick with arrow
A === B          Thick without arrow
A --x B          Solid with cross
A --o B          Solid with circle
A <--> B         Bidirectional (v11.0.0+)
A <-.-> B        Bidirectional dotted (v11.0.0+)
A o--o B         Circle both ends
A x--x B         Cross both ends
```

**Labels on edges**:
```
A -->|label text| B
A -- label text --> B
```

**Longer links** (span more ranks): add extra dashes/dots/equals
```
A ---> B         Longer
A -----> B       Even longer
```

**Edge IDs and animation** (v11.3.0+):
```
A e1@--> B
e1@{ animate: true }
e1@{ animation: fast }
e1@{ animation: slow }
```

**Edge-level curve style** (v11.10.0+):
```
A e1@--> B
e1@{ curve: stepBefore }
```

**Animation via classDef**:
```
classDef animate stroke-dasharray: 5\,5, animation: fast
class e1 animate
```

### Subgraphs

```
subgraph title
    direction TB
    A --> B
end
```

- Can link to/from subgraphs: `subgraphId --> nodeId`
- Can nest subgraphs
- Can set direction inside subgraph

### Styling

```
style nodeId fill:#f9f,stroke:#333,stroke-width:4px
classDef className fill:#f9f,stroke:#333
class nodeId1,nodeId2 className
nodeId:::className
linkStyle 3 stroke:#ff3,stroke-width:4px
linkStyle default stroke:#333
classDef default fill:#f9f
```

### Interaction

Requires `securityLevel: 'loose'`

```
click nodeId callback "Tooltip"
click nodeId call callback()
click nodeId "https://url" "Tooltip" _blank
```

### Markdown in Nodes

Use backticks for markdown: `` id["`**bold** and *italic*`"] ``

### Comments

```
%% This is a comment
```

---

## Sequence Diagram

**Declaration**: `sequenceDiagram`

### Participants

```
participant Alice
actor Bob
participant A as Alice
```

**Participant shapes** (JSON syntax):
```
participant name { shape: actor }
participant name { shape: boundary }
participant name { shape: control }
participant name { shape: entity }
participant name { shape: database }
participant name { shape: collections }
participant name { shape: queue }
```

**Actor Creation/Destruction** (v10.3.0+):
```
create participant B
A ->> B: Create message
destroy B
B ->> A: Final message before destruction
```
Note: Only recipient can be created, sender or recipient can be destroyed.

### Messages

```
A -> B       Solid line, no arrow
A --> B      Dotted line, no arrow
A ->> B      Solid line, arrowhead
A -->> B     Dotted line, arrowhead
A <<->> B    Bidirectional solid (v11.0.0+)
A <<-->> B   Bidirectional dotted (v11.0.0+)
A -x B       Solid with cross (lost message)
A --x B      Dotted with cross
A -x B       Solid with cross (lost message)
A --x B      Dotted with cross
A -) B       Solid with open arrow (async)
A --) B      Dotted with open arrow (async)
```

### Activations

```
activate Alice
deactivate Alice
Alice ->>+ Bob: message     %% shorthand activate
Bob -->>- Alice: response   %% shorthand deactivate
```

### Notes

```
Note right of Alice: text
Note left of Alice: text
Note over Alice,Bob: text spanning participants
```

### Control Flow

```
loop Loop description
    A ->> B: message
end

alt Condition A
    A ->> B: message
else Condition B
    A ->> C: message
end

opt Optional action
    A ->> B: message
end

par Action 1
    A ->> B: message
and Action 2
    A ->> C: message
end

critical Critical action
    A ->> B: message
option Failure case
    A ->> C: fallback
end

break Something happened
    A ->> B: notification
end
```

### Background Highlighting

```
rect rgb(0, 255, 0)
    A ->> B: message
end

rect rgba(0, 0, 255, 0.1)
    A ->> B: message
end
```

### Actor Creation/Destruction (v10.3.0+)

```
create participant B
A ->> B: create message
destroy B
B ->> A: final message
```

### Grouping (Box)

```
box Aqua Group Title
    participant A
    participant B
end

box rgb(100,200,100) Title
    participant C
end
```

### Sequence Numbers

```
autonumber
```

### Actor Menus/Links

```
link Alice: Dashboard @ https://dashboard.example.com
links Alice: {"Dashboard": "https://...", "Wiki": "https://..."}
```

---

## Class Diagram

**Declaration**: `classDiagram`

### Defining Classes

```
class Animal
class Animal["Custom Label"]

class Animal {
    +int age
    +String gender
    +isMammal() bool
    +mate()
    -privateMethod()
    #protectedField
    ~packageMethod()
}
```

**Visibility**: `+` public, `-` private, `#` protected, `~` package/internal

**Classifiers**: `*` abstract (after method), `$` static (after method/field)

**Generic types**: `List~int~`

### Relationships

```
A <|-- B       Inheritance
A *-- B        Composition
A o-- B        Aggregation
A --> B        Association
A -- B         Link (solid)
A ..> B        Dependency
A ..|> B       Realization
A .. B         Link (dashed)
A <|--|> B     Two-way inheritance
```

**Lollipop interfaces**:
```
bar ()-- foo
foo --() bar
```

**Labels**: `classA <|-- classB : implements`

**Cardinality**: `"1" classA -- "many" classB`
- Options: `1`, `0..1`, `1..*`, `*`, `n`, `0..n`, `1..n`

### Annotations

```
class Shape {
    <<Interface>>
    draw()
}
class Color {
    <<Enumeration>>
    RED
    GREEN
}
```

### Namespaces

```
namespace BaseShapes {
    class Triangle
    class Rectangle
}
```

### Notes

```
note "General note"
note for Animal "Specific note"
```

### Direction

```
direction RL
```

---

## State Diagram

**Declaration**: `stateDiagram-v2`

### States and Transitions

```
[*] --> Still           Start state
Still --> Moving         Transition
Moving --> Still : trigger   Labeled transition
Still --> [*]           End state

state "Description" as s2
s2 : Alternative description
```

### Composite States

```
state First {
    [*] --> second
    second --> [*]
}
```

### Choice

```
state if_state <<choice>>
[*] --> if_state
if_state --> State1 : condition 1
if_state --> State2 : condition 2
```

### Fork/Join

```
state fork_state <<fork>>
state join_state <<join>>
[*] --> fork_state
fork_state --> State1
fork_state --> State2
State1 --> join_state
State2 --> join_state
join_state --> [*]
```

### Notes

```
note right of State1 : text
note left of State1 : text
```

### Concurrency

```
state Active {
    [*] --> Child1
    --
    [*] --> Child2
}
```

### Direction

```
direction LR
```

### Styling

```
classDef badState fill:#f00,color:white
class State1 badState
State1:::badState
```

---

## Entity Relationship Diagram

**Declaration**: `erDiagram`

### Relationships

```
CUSTOMER ||--o{ ORDER : places
ORDER ||--|{ LINE-ITEM : contains
PRODUCT }|..|{ ORDER : "ordered in"
```

**Cardinality** (left side | right side):
```
|o  /  o|    Zero or one
||  /  ||    Exactly one
}o  /  o{    Zero or more (many)
}|  /  |{    One or more
```

**Identification**:
```
--    Identifying (solid line)
..    Non-identifying (dashed line)
```

### Attributes

```
CUSTOMER {
    string name PK
    string email UK
    int age
    string address FK "delivery address"
}
```

**Keys**: `PK` (primary), `FK` (foreign), `UK` (unique). Can combine: `PK, FK`

### Entity Aliases

```
CUSTOMER["Customer Entity"] {
    string name
}
```

---

## Gantt Chart

**Declaration**: `gantt`

```
gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    axisFormat %Y-%m-%d
    tickInterval 1week
    excludes weekends

    section Planning
    Research           :done, a1, 2024-01-01, 10d
    Design             :active, a2, after a1, 15d
    
    section Development
    Implementation     :crit, a3, after a2, 30d
    Testing            :a4, after a3, 15d
    Launch             :milestone, after a4, 0d
```

**Date formats**: `YYYY-MM-DD`, `DD-MM-YYYY`, `YYYY`, etc.

**Task tags**: `done`, `active`, `crit`, `milestone` (combinable: `crit, done`)

**Duration**: `30d`, `5h`, `2w`

**Dependencies**: `after taskId`

**Vertical markers**: `vert 2024-03-15 : Deadline`

**Compact mode**: Use frontmatter `displayMode: compact`

**Interaction**:
```
click taskId href "https://..."
click taskId call callback()
```

---

## Git Graph

**Declaration**: `gitGraph` (default LR), `gitGraph TB:` (top-bottom), or `gitGraph BT:` (bottom-top)

```
gitGraph
    commit
    commit id: "feat-1" tag: "v1.0"
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit type: HIGHLIGHT
```

**Commands**:
- `commit` — optional: `id:`, `type:`, `tag:`
- `commit type: NORMAL | REVERSE | HIGHLIGHT`
- `branch name` — optional: `order: N`
- `checkout name`
- `merge name` — optional: `id:`, `type:`, `tag:`
- `cherry-pick id: "commit_id"` — optional: `parent:` for merge commits

**Config options**: `showBranches`, `showCommitLabel`, `rotateCommitLabel`, `mainBranchName`, `parallelCommits` (v10.8.0+)

---

## Pie Chart

**Declaration**: `pie` or `pie showData`

```
pie showData
    title Browser Market Share
    "Chrome" : 65.4
    "Firefox" : 10.1
    "Safari" : 18.7
    "Other" : 5.8
```

Values must be positive numbers > 0. Config: `textPosition: 0.75` (0.0–1.0).

---

## Mind Map

**Declaration**: `mindmap`

Indentation-based hierarchy:

```
mindmap
    Root
        Branch A
            Leaf 1
            Leaf 2
        Branch B
            Leaf 3
```

**Shapes**:
```
id[Square]
id(Rounded)
id((Circle))
id))Bang((
id)Cloud(
id{{Hexagon}}
id           Default
```

**Icons**: `::icon(fa fa-book)` after node text

**Classes**: `:::className` after node text

---

## User Journey

**Declaration**: `journey`

```
journey
    title My Working Day
    section Morning
        Make tea: 5: Me
        Go upstairs: 3: Me, Cat
        Do work: 1: Me
    section Afternoon
        Go downstairs: 5: Me
        Sit down: 5: Me
```

- Score: 1–5 (1=worst, 5=best)
- Syntax: `Task name: score: actor1, actor2`
- Sections group related tasks

---

## Quadrant Chart

**Declaration**: `quadrantChart`

```
quadrantChart
    title Priority Matrix
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 Do First
    quadrant-2 Schedule
    quadrant-3 Delegate
    quadrant-4 Eliminate
    Task A: [0.8, 0.9]
    Task B: [0.2, 0.7]
    Task C: [0.6, 0.3]
```

- Quadrant numbering: 1=top-right, 2=top-left, 3=bottom-left, 4=bottom-right
- Point coordinates: 0.0–1.0 range
- Point styling: `Point:::class1: [0.9, 0.5]` with `classDef class1 color: #ff0, radius: 10`

---

## Requirement Diagram

**Declaration**: `requirementDiagram`

```
requirementDiagram
    requirement auth_req {
        id: 1
        text: System shall authenticate users
        risk: high
        verifymethod: test
    }

    element auth_module {
        type: module
        docref: /docs/auth
    }

    auth_module - satisfies -> auth_req
```

**Requirement types**: `requirement`, `functionalRequirement`, `interfaceRequirement`, `performanceRequirement`, `physicalRequirement`, `designConstraint`

**Risk**: `Low`, `Medium`, `High`

**Verify methods**: `Analysis`, `Inspection`, `Test`, `Demonstration`

**Relationships**: `contains`, `copies`, `derives`, `satisfies`, `verifies`, `refines`, `traces`

---

## Timeline

**Declaration**: `timeline`

```
timeline
    title History of Social Media
    2002 : LinkedIn
    2004 : Facebook : Google
    2005 : YouTube
    section 2010s
        2010 : Instagram
        2011 : Snapchat
        2012 : Vine
```

- Multiple events per period: `period : event1 : event2`
- Sections group time periods
- Each period auto-colored (multiColor mode)

---

## Sankey Diagram

**Declaration**: `sankey-beta`

CSV format — 3 columns: source, target, value

```
sankey-beta

Agricultural waste,Bio-conversion,124.729
Bio-conversion,Liquid,0.597
Bio-conversion,Losses,26.862
```

- Commas in text: wrap in double quotes `"text, here"`
- Double quotes in text: escape with `""` → `"text ""quoted"""`
- Config: `linkColor` ('source', 'target', 'gradient', hex), `nodeAlignment` ('justify', 'center', 'left', 'right')

---

## XY Chart

**Declaration**: `xychart-beta` or `xychart-beta horizontal`

```
xychart-beta
    title "Monthly Sales"
    x-axis [Jan, Feb, Mar, Apr, May]
    y-axis "Revenue ($)" 4000 --> 11000
    bar [5000, 6000, 7500, 8200, 9500]
    line [5000, 6000, 7500, 8200, 9500]
```

- X-axis: categorical `[a, b, c]` or numeric `min --> max`
- Y-axis: numeric only, auto-range if no bounds
- Can combine `bar` and `line` in same chart

---

## Block Diagram

**Declaration**: `block-beta`

```
block-beta
    columns 3
    a["Block A"] b["Block B"]:2
    c["Block C"] d["Block D"]
    
    block:group1:2
        columns 2
        e["E"] f["F"]
    end
    
    a --> d
```

- `columns N` sets grid layout
- `:N` after block = span N columns
- `space` or `space:N` for empty cells
- Composite blocks: `block:id:width ... end`
- Block arrows: `<["left"]`, `["right"]>`, `^["up"]^`, `v["down"]v`
- Same edge syntax as flowchart

---

## Packet Diagram

**Declaration**: `packet-beta`

```
packet-beta
    0-15: "Source Port"
    16-31: "Destination Port"
    32-63: "Sequence Number"
    64-95: "Acknowledgment Number"
```

**Auto-increment** (v11.7.0+):
```
packet-beta
    +16: "Source Port"
    +16: "Destination Port"
    +32: "Sequence Number"
```

- Bit ranges are inclusive
- Single bit: `0: "Flag"`
- Can mix manual ranges and auto-increment

---

## Kanban Board

**Declaration**: `kanban`

```
kanban
    Todo
        docs[Create Documentation]
    In Progress
        impl[Implement Feature]
            @{ assigned: 'John', ticket: 'PROJ-123', priority: 'High' }
    Done
        tests[Write Tests]
```

**Metadata keys**: `assigned`, `ticket`, `priority` ('Very High', 'High', 'Low', 'Very Low')

**Config**: `ticketBaseUrl: 'https://jira.example.com/browse/#TICKET#'`

---

## Architecture Diagram

**Declaration**: `architecture-beta`

```
architecture-beta
    group api(cloud)[API]

    service db(database)[Database] in api
    service server(server)[Server] in api
    service client(internet)[Client]

    client:R --> L:server
    server:R --> L:db
```

**Elements**:
- `group id(icon)[title]` — optional: `in parent`
- `service id(icon)[title]` — optional: `in parent`
- `junction id` — optional: `in parent`

**Edge directions**: `:T` (top), `:B` (bottom), `:L` (left), `:R` (right)

**Edge types**: `<--`, `-->`, `<-->`, `---`

**Group edges**: `service{group}:R --> L:other{group}`

**Default icons**: cloud, database, disk, internet, server

---

## Radar Diagram

**Declaration**: `radar-beta` (v11.6.0+)

```
radar-beta
    title Skills Assessment
    axis Design, Frontend, Backend, DevOps, Testing
    curve Developer A { 4, 5, 3, 2, 4 }
    curve Developer B { 3, 3, 5, 4, 3 }
    max 5
    showLegend true
```

**Axis definition**:
```
axis id1["Label1"], id2["Label2"], id3
```

**Curve definition**:
```
curve id["Label"] { 1, 2, 3, 4, 5 }
curve id { axis3: 30, axis1: 20, axis2: 10 }  %% key-value pairs
```

**Options**:
- `showLegend true|false` — show/hide legend (default: true)
- `max N` — maximum value for scaling
- `min N` — minimum value (default: 0)
- `graticule circle|polygon` — grid type (default: circle)
- `ticks N` — number of concentric rings (default: 5)

---

## Treemap Diagram

**Declaration**: `treemap-beta` (v11.x+)

```
treemap-beta
    "Category A"
        "Item 1": 100
        "Item 2": 50
    "Category B"
        "Subcategory"
            "Item 3": 75
        "Item 4": 25
```

**Syntax**:
- Section/parent: `"Name"` (quoted text)
- Leaf with value: `"Name": value` (positive numbers only)
- Hierarchy: indentation-based
- Styling: `"Name":::className`

**Config options**:
- `showValues true|false` — display values (default: true)
- `valueFormat ","` — number format (D3 format specifiers)
- `padding N` — internal padding (default: 10)

---

## C4 Diagram

**Declaration**: `C4Context`, `C4Container`, `C4Component`, `C4Dynamic`, `C4Deployment`

```
C4Context
    title System Context Diagram
    
    Person(user, "User", "A user of the system")
    System(system, "System", "The main system")
    System_Ext(external, "External System", "An external dependency")
    
    Rel(user, system, "Uses")
    Rel(system, external, "Calls")
```

**Elements**:
- `Person(alias, label, description)`
- `Person_Ext(alias, label, description)` — external person
- `System(alias, label, description)`
- `System_Ext(alias, label, description)` — external system
- `Container(alias, label, tech, description)`
- `Component(alias, label, tech, description)`

**Relationships**:
- `Rel(from, to, label)`
- `Rel(from, to, label, tech)`
- `BiRel(a, b, label)` — bidirectional

**Boundaries**:
```
Enterprise_Boundary(b1, "Enterprise") {
    System(s1, "System 1")
}
System_Boundary(b2, "System") {
    Container(c1, "Container 1")
}
```

---

## ZenUML

**Declaration**: `zenuml`

Alternative sequence diagram syntax with programming-like notation:

```
zenuml
    @Actor User
    @Database DB
    
    User->API.login(credentials) {
        API->DB.query(user)
        if (valid) {
            return token
        } else {
            return error
        }
    }
```

**Syntax**:
- Method calls: `A->B.method(args)`
- Return: `return value`
- Conditionals: `if (cond) { } else { }`
- Loops: `while (cond) { }`, `for (item in list) { }`
- Parallel: `par { }`

---

## Theming and Configuration

### Themes

Available: `default`, `neutral`, `dark`, `forest`, `base` (only `base` is customizable)

### Frontmatter Config (preferred over directives)

```
---
config:
    theme: forest
    flowchart:
        curve: basis
---
flowchart TD
    A --> B
```

### Inline Directive (deprecated v10.5.0+, still works)

```
%%{init: {'theme': 'dark', 'themeVariables': {'primaryColor': '#ff0000'}}}%%
```

### Theme Variables

Core: `primaryColor`, `secondaryColor`, `tertiaryColor`, `background`, `fontFamily`, `fontSize`, `lineColor`, `textColor`

Diagram-specific: `nodeBorder`, `clusterBkg`, `actorBkg`, `signalColor`, `pie1`–`pie12`, `git0`–`git7`

### Comments (all diagrams)

```
%% This is a comment
```

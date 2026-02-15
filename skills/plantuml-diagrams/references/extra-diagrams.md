# Extra Diagram Types

## Use Case Diagram

```
@startuml
left to right direction
skinparam packageStyle rectangle

actor Customer
actor Admin
actor "Payment System" as PS <<system>>

rectangle "E-Commerce Platform" {
  usecase "Browse Products" as UC1
  usecase "Search Products" as UC2
  usecase "Add to Cart" as UC3
  usecase "Checkout" as UC4
  usecase "Process Payment" as UC5
  usecase "Manage Inventory" as UC6
  usecase "View Reports" as UC7
}

Customer --> UC1
Customer --> UC2
Customer --> UC3
Customer --> UC4
UC4 ..> UC5 : <<include>>
UC5 --> PS

Admin --> UC6
Admin --> UC7
UC1 <.. UC2 : <<extend>>
@enduml
```

**Actors**: `actor Name`, `:Name:` (stick figure), `actor Name <<system>>` (non-human)

**Use cases**: `usecase "Name"`, `(Name)`, `usecase "Name" as alias`

**Relationships**:
- `-->` association (actor to use case)
- `..>` include/extend (use case to use case)
- `--|>` generalization (actor inheritance)

**Stereotypes**: `<<include>>`, `<<extend>>`, `<<system>>`

**Grouping**: `rectangle "System Name" { ... }`

**Direction**: `left to right direction` for horizontal layout

**Notes**: `note right of UC1: Description`

## Timing Diagram

```
@startuml
robust "Web Browser" as WB
concise "Web User" as WU
clock "Clock" as C

@0
WU is Idle
WB is Idle

@100
WU -> WB : URL
WU is Waiting
WB is Processing

@300
WB is Waiting

@400
WB -> WU : Page
WU is ok
WB is Idle

@500
WU is Idle

highlight 100 to 300 #Gold : Critical
@enduml
```

**Participant types**:
- `robust "Name"` — multiple named states, thick bar
- `concise "Name"` — simple states, thin line
- `clock "Name"` — clock signal
- `binary "Name"` — binary (high/low) signal

**State changes**: `@<time>` then `<participant> is <state>`

**Messages**: `A -> B : message` at specific time

**Constraints**: `@<time> <-> @<time> : label` (duration)

**Highlighting**: `highlight <start> to <end> #color : label`

**Relative time**: `@+100` (100 units after previous)

**Hidden state**: `<participant> is {hidden}` to hide lifeline

### Binary/Clock Example

```
@startuml
clock "Clock" as C with period 50
binary "Enable" as EN
concise "Output" as OUT

@0
EN is low
OUT is Idle

@100
EN is high

@150
OUT is Active

@300
EN is low
OUT is Idle
@enduml
```

## State Diagram

```
@startuml
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
@enduml
```

**States**: `state Name`, `state "Long Name" as alias`

**Transitions**: `State1 --> State2 : event`

**Start/End**: `[*] --> State`, `State --> [*]`

**Composite**: `state Name { ... }` with nested states

**Concurrent regions**: `--` horizontal separator, `||` vertical

**Stereotypes**: `<<choice>>`, `<<fork>>`, `<<join>>`, `<<history>>`, `<<entryPoint>>`, `<<exitPoint>>`

**History**: `[H]` shallow, `[H*]` deep

**Colors**: `state Name #LightBlue`

## Object Diagram

```
@startuml
object user {
  name = "John"
  id = 123
}

object order {
  total = 99.99
  status = "pending"
}

user --> order : placed
@enduml
```

**Objects**: `object Name { field = value }`

**Map tables**: `map Name { key => value }`

**Link map entries**: `map Name { key *-> object }`

**Relationships**: Same as class diagrams

## Mind Map

```
@startmindmap
* Project Architecture
** Frontend
*** React
*** TypeScript
*** Tailwind
** Backend
*** Go
*** PostgreSQL
*** Redis
-- DevOps
--- Kubernetes
--- Terraform
--- ArgoCD
@endmindmap
```

**Depth**: `*`, `**`, `***` etc. (OrgMode style)

**Direction**: `+` right side (default), `-` left side

**Multiline**: `**:line1\nline2;`

**Remove box**: `*_ text` (underscore = no box)

**Colors**: `*[#LightBlue] text`

**Markdown style**: `# root`, `## child`, `### grandchild`

## WBS (Work Breakdown Structure)

```
@startwbs
* Project
** Phase 1 - Planning
*** Requirements
*** Design
** Phase 2 - Build
*** Backend
*** Frontend
*** Testing
** Phase 3 - Deploy
*** Staging
*** Production
@endwbs
```

Same syntax as Mind Map. Uses `@startwbs` / `@endwbs`.

**Colors**: `*[#LightGreen] text`

**Remove box**: `*_ text`

## Gantt Chart

```
@startgantt
Project starts 2024-01-01
saturday are closed
sunday are closed

[Design] requires 10 days
[Design] is colored in LightBlue

[Backend] requires 15 days
[Backend] starts at [Design]'s end
[Backend] is colored in LightGreen

[Frontend] requires 12 days
[Frontend] starts at [Design]'s end

[Testing] requires 8 days
[Testing] starts at [Backend]'s end

[Deploy] happens at [Testing]'s end
[Deploy] is colored in Red

-- Milestones --
[MVP] happens 2024-02-15
@endgantt
```

**Tasks**: `[Task] requires N days`

**Start**: `[Task] starts YYYY-MM-DD` or `starts at [Other]'s end`

**Milestones**: `[Name] happens at [Task]'s end` or `happens YYYY-MM-DD`

**Completion**: `[Task] is 50% complete`

**Resources**: `[Task] on {Alice}`

**Closed days**: `saturday are closed`, `2024-12-25 is closed`

**Scale**: `printscale daily|weekly|monthly|quarterly|yearly`

**Separators**: `-- Section Name --`

**Colors**: `[Task] is colored in LightBlue`

## Network Diagram (nwdiag)

```
@startuml
nwdiag {
  network dmz {
    address = "10.0.1.0/24"
    web01 [address = "10.0.1.1"];
    web02 [address = "10.0.1.2"];
  }
  network internal {
    address = "10.0.2.0/24"
    web01 [address = "10.0.2.1"];
    app01 [address = "10.0.2.10"];
    db01 [address = "10.0.2.20", shape = database];
  }
}
@enduml
```

**Networks**: `network name { address = "..."; node [address = "..."]; }`

**Shapes**: `shape = database`, `shape = cloud`

**Groups**: `group name { color = "#FFAAAA"; node1; node2; }`

**Peer connections**: `inet [shape = cloud]; inet -- router;`

**Descriptions**: `node [description = "Web Server"];`

**Icons**: `node [description = "<&globe*4>\nWeb"];` (OpenIconic)

## JSON Visualization

```
@startjson
{
  "apiVersion": "apps/v1",
  "kind": "Deployment",
  "metadata": {
    "name": "web-app",
    "namespace": "production"
  },
  "spec": {
    "replicas": 3,
    "selector": {
      "matchLabels": {
        "app": "web"
      }
    }
  }
}
@endjson
```

**Highlight**: `#highlight "metadata" / "name"` (before JSON)

**Styling**: `<style> jsonDiagram { node { BackgroundColor LightYellow } } </style>`

## YAML Visualization

```
@startyaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
@endyaml
```

**Highlight**: `#highlight "metadata" / "name"` (before YAML)

Same styling as JSON.

## ER Diagram (Chen Notation)

```
@startchen
entity CUSTOMER {
  customer_id <<key>>
  name
  email
}

entity ORDER {
  order_id <<key>>
  total
  created_at
}

relationship PLACES {
  date
}

CUSTOMER -1- PLACES
PLACES -N- ORDER
@endchen
```

**Entities**: `entity NAME { attributes }`

**Weak entities**: `entity NAME <<weak>>`

**Relationships**: `relationship NAME { attributes }`

**Identifying**: `relationship NAME <<identifying>>`

**Cardinality**: `-1-`, `-N-`, `=1=` (total participation), `-(1,N)-` (range)

**Key attributes**: `<<key>>`, derived: `<<derived>>`, multi-valued: `<<multi>>`

## Creole Text Formatting

Use in notes, labels, and descriptions:

| Syntax | Result |
|--------|--------|
| `**bold**` | **bold** |
| `//italic//` | *italic* |
| `""monospace""` | `monospace` |
| `--strikethrough--` | ~~strikethrough~~ |
| `__underline__` | underline |
| `~~wave~~` | wave underline |
| `<color:red>text</color>` | colored text |
| `<back:yellow>text</back>` | highlighted |
| `<size:20>text</size>` | sized text |
| `* item` | bullet list |
| `# item` | numbered list |
| `\|= H1 \| H2 \|` | table header |
| `\| c1 \| c2 \|` | table cell |
| `[[url label]]` | hyperlink |
| `<&icon>` | OpenIconic icon |
| `<U+2603>` | Unicode char |

Escape special chars with `~`.

## Preprocessing

### Variables

```
!$env = "production"
!$version = "2.0"
```

### Conditionals

```
!if ($env == "production")
  skinparam backgroundColor White
!else
  skinparam backgroundColor LightYellow
!endif
```

### Loops

```
!$i = 0
!while $i < 3
  class "Service_$i"
  !$i = $i + 1
!endwhile
```

### Functions

```
!function $service($name, $tech)
  rectangle "$name\n<size:10>$tech</size>" as $name
!endfunction

$service("API", "Go")
$service("DB", "PostgreSQL")
```

### Includes

```
!include common.puml
!include <C4/C4_Container>
!include https://raw.githubusercontent.com/.../file.puml
```

### Builtin Functions

`%date()`, `%now()`, `%strlen()`, `%substr()`, `%upper()`, `%lower()`, `%get_all_theme()`, `%load_json()`

## Archimate Diagram

```
@startuml
!include <archimate/Archimate>

Business_Actor(customer, "Customer")
Business_Process(order, "Order Process")
Business_Service(payment, "Payment Service")

Application_Component(webapp, "Web Application")
Application_Service(api, "REST API")

Technology_Node(server, "Application Server")
Technology_Artifact(db, "Database")

Rel_Serving(api, order, "supports")
Rel_Realization(webapp, api, "realizes")
Rel_Assignment(server, webapp, "runs")
@enduml
```

**Layers**: Business, Application, Technology, Motivation, Strategy, Implementation

**Elements**: `<Layer>_<Type>(alias, "Label")`
- Business: `Business_Actor`, `Business_Process`, `Business_Service`, `Business_Object`
- Application: `Application_Component`, `Application_Service`, `Application_Interface`
- Technology: `Technology_Node`, `Technology_Artifact`, `Technology_Service`

**Relationships**: `Rel_<Type>(from, to, "label")`
- `Rel_Serving`, `Rel_Realization`, `Rel_Assignment`, `Rel_Composition`
- `Rel_Aggregation`, `Rel_Access`, `Rel_Influence`, `Rel_Triggering`

## EBNF Diagram

```
@startebnf
title JSON Grammar

json = object | array;
object = "{", [ pair, { ",", pair } ], "}";
pair = string, ":", value;
array = "[", [ value, { ",", value } ], "]";
value = string | number | object | array | "true" | "false" | "null";
string = '"', { character }, '"';
number = [ "-" ], digit, { digit }, [ ".", { digit } ];
@endebnf
```

**Syntax**:
- `=` definition
- `;` end of rule
- `|` alternation (or)
- `,` concatenation (sequence)
- `{ }` repetition (zero or more)
- `[ ]` optional (zero or one)
- `( )` grouping
- `" "` terminal (literal)

## Regex Diagram

```
@startregex
title Email Pattern
[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}
@endregex
```

Visualizes regular expressions as railroad diagrams.

## Salt (Wireframe/UI Mockup)

```
@startsalt
{
  Login Form
  ==
  Username: | "user@example.com"
  Password: | "****"
  [X] Remember me
  --
  [  Cancel  ] | [  Login  ]
}
@endsalt
```

**Elements**:
- `|` column separator
- `--` horizontal line
- `==` double line
- `[ ]` button
- `[X]` checkbox (checked)
- `( )` radio button
- `"text"` text field
- `^dropdown^` dropdown
- `{T` table start, `}` table end

## Ditaa Diagram

```
@startditaa
+--------+   +-------+    +-------+
|        | --+ ditaa +--> |       |
|  Text  |   +-------+    |diagram|
|Document|   |!magic!|    |       |
|     {d}|   |       |    |       |
+---+----+   +-------+    +-------+
    :                         ^
    |       Lots of work      |
    +-------------------------+
@endditaa
```

ASCII art to diagram conversion. Uses `{d}` for document shape, `{s}` for storage, `{io}` for I/O.

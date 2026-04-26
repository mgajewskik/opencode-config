# Plugins and Extensibility

Use this reference when the task involves custom modules, action plugins, callback plugins, filter plugins, lookup plugins, or collection-packaged reusable automation logic.

## Senior Doctrine

- package extensibility in a collection when it is shared or long-lived
- prefer a plugin or module when copy-pasted task logic is becoming a hidden platform
- keep plugin boundaries explicit: controller-side behavior, target-side behavior, and packaging concerns are different
- treat custom extensibility as product code: version it, test it, and keep its interface stable

## When to Write a Plugin or Module

Reach for custom extensibility when:

- the same non-trivial logic is duplicated across many roles
- shell-driven parsing is hiding a real reusable primitive
- controller-side enrichment or audit behavior belongs outside playbooks
- the code needs a reusable, testable interface instead of task-file duplication

Do not write a plugin just to avoid a few lines of YAML.

## Packaging Default

For reusable custom code, prefer collection packaging so roles, modules, plugins, docs, and tests live together.

Typical collection-local surfaces:

- `plugins/modules/`
- `plugins/filter/`
- `plugins/lookup/`
- `plugins/callback/`
- `roles/`
- `docs/`
- `tests/`

## Callback Plugins

Callback plugins are especially valuable for:

- privileged-operation audit trails
- performance/timing instrumentation
- structured run artifacts for external log systems

Use them when stdout verbosity is not enough and the organization needs durable observability.

## Filter and Lookup Plugins

Prefer a filter or lookup when the alternative is repeated inline Jinja logic or repeated controller-side retrieval code.

Default rule:

- if the problem is “make templating sane,” think filter plugin
- if the problem is “retrieve data from somewhere,” think lookup plugin
- if the problem is “manage target state,” think module first

## Action Plugins

Think action plugin when the value is in **controller-side orchestration around module execution**, not just target-side state changes.

Typical reasons:

- preprocess arguments before module execution
- enforce shared controller-side behavior around a module call
- wrap repeated orchestration logic that should not live in many task files

If the real problem is target state, prefer a module. If the real problem is output shaping in templates, prefer a filter.

## Custom Modules

Use a custom module when target-state management is too complex or too domain-specific for existing modules.

Why custom modules beat shell wrappers:

- clearer inputs and outputs
- better idempotency modeling
- more meaningful error handling
- less brittle parsing

## Testing Expectations

For shared extensibility, expect more than lint:

- packaging sanity in the collection layout
- execution in the intended runtime or EE
- role/playbook integration coverage where the plugin is consumed
- targeted validation of output shape and failure behavior

### Plugin-specific validation ladder

1. packaging and import sanity in the collection layout
2. execution in the real controller runtime or EE
3. focused functional probe for the plugin surface itself
4. integration coverage from the consuming role or playbook
5. negative-path check for bad input or missing dependencies

## Runtime Boundaries

Ask where the code runs:

- controller side
- target side
- inside an execution environment

That answer changes packaging, dependencies, and debugging.

## Anti-Patterns

- copy-pasting the same parsing shell snippet across many roles
- hiding platform-critical behavior in undocumented callbacks
- writing a plugin without a stable packaging boundary
- letting plugin dependencies float outside the EE or project runtime
- claiming plugin support in the skill without loading plugin-specific guidance

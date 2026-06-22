# Use Markdown Architectural Decision Records

## Context and Problem Statement

We want to record durable technical decisions made in this repository so future maintainers can understand the context, options, rationale, and consequences.

Which format and structure should these records follow?

## Considered Options

* MADR-style Markdown Architecture Decision Records
* A custom repository-specific decision template
* Long-form design documents only
* No explicit decision records

## Decision Outcome

Chosen option: "MADR-style Markdown Architecture Decision Records", because the format is lightweight, reviewable in normal pull requests, readable without special tooling, and structured enough to preserve rationale.

Future ADRs will be stored in `docs/decisions` using filenames in the form `NNNN-title-with-dashes.md`, unless this repository documents a more specific convention.

### Consequences

* Good, because important decisions become visible in version control.
* Good, because contributors have a small repeatable structure for recording rationale.
* Bad, because ADRs require maintenance when decisions are superseded or deprecated.
* Bad, because writing an ADR adds a small amount of process to significant changes.

### Confirmation

New significant architecture or platform decisions should add or update an ADR during normal review. Superseded decisions should remain in history and be linked from the replacing ADR.

## More Information

* MADR: https://adr.github.io/madr/
* MADR repository: https://github.com/adr/madr

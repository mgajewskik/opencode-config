# ADR Source Map

This skill uses MADR as a source of ADR structure and conventions, plus broader ADR practice research for triage, lifecycle, review, and scale guidance. It does not require MADR tooling.

## Source Policy

- Prefer the latest released MADR 4.x template for structure.
- Prefer local repository convention over MADR defaults when editing an existing repo.
- Use tooling only if explicitly requested or already present.
- Keep source/provenance notes in this reference, not in every generated ADR unless the user wants it.
- Treat tooling guidance as time-sensitive and re-check before recommending adoption.
- Treat ADR ROI claims as practitioner consensus unless backed by specific evidence; do not promise universal savings.

## MADR Sources

| Source | Importance | Stability | Notes |
|---|---:|---:|---|
| https://github.com/adr/madr | High | Mutable default branch | Official MADR repository. |
| https://raw.githubusercontent.com/adr/madr/develop/README.md | High | Mutable | Quick start, template variants, branch conventions, license. |
| https://raw.githubusercontent.com/adr/madr/release/v4/template/adr-template.md | High | Medium | Full MADR 4.x template with explanations. |
| https://raw.githubusercontent.com/adr/madr/release/v4/template/adr-template-minimal.md | High | Medium | Minimal MADR 4.x template with explanations. |
| https://raw.githubusercontent.com/adr/madr/release/v4/template/adr-template-bare.md | High | Medium | Bare full template used by this skill's asset. |
| https://raw.githubusercontent.com/adr/madr/release/v4/template/adr-template-bare-minimal.md | High | Medium | Bare minimal template used by this skill's asset. |
| https://raw.githubusercontent.com/adr/madr/gh-pages/docs/index.md | High | Medium | Rendered-doc source: applying MADR, naming, directory, category guidance, tooling caveat. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0005-use-dashes-in-filenames.md | High | Mutable | Rationale for `NNNN-title-with-dashes.md`. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0008-add-status-field.md | High | Mutable | Status field rationale. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0013-use-yaml-front-matter-for-meta-data.md | High | Mutable | YAML front matter metadata rationale. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0009-support-links-between-adrs-inside-an-adrs.md | Medium | Mutable | Links to other ADRs belong in `More Information`. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0010-support-categories.md | Medium | Mutable | Category/subfolder tradeoffs. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0016-outcome-before-detailed-pros-cons.md | Medium | Mutable | Keep outcome before detailed pros/cons. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/decisions/0018-use-confirmation-as-heading.md | Medium | Mutable | Use `Confirmation`, not validation/verification, for implementation/compliance check. |
| https://raw.githubusercontent.com/adr/madr/develop/docs/tooling.md | Medium | Mutable | Tooling list; mostly older MADR versions. The rendered docs/index source carries the tooling-support caveat. |
| https://raw.githubusercontent.com/adr/madr/develop/LICENSE | High | Mutable | SPDX expression: `MIT OR CC0-1.0`. |

## Broader ADR Practice Sources

These sources informed `references/senior-practice.md` and review/triage guidance.

| Source | Importance | Stability | Notes |
|---|---:|---:|---|
| https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions | High | Concept stable; URL can move | Michael Nygard's original lightweight ADR framing: small records, status, context, decision, consequences, preserve superseded decisions. |
| https://adr.github.io/ | High | Time-sensitive resource hub | ADR organization vocabulary and resource map. |
| https://adr.github.io/adr-templates/ | Medium | Time-sensitive | Template landscape: Nygard, MADR, Y-statements, variants. |
| https://adr.github.io/adr-tooling/ | Medium | Highly time-sensitive | Tooling catalog; use only after diagnosing real friction. |
| https://docs.arc42.org/section-9/ | High | Concept stable | Architecture-decision significance and rationale in architecture documentation. |
| https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records | Medium | Older practitioner signal | Lightweight ADRs in source control and evolutionary architecture context. |
| https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/welcome.html | Medium | Vendor/time-sensitive | ADR failure modes and business rationale from AWS Prescriptive Guidance. |
| https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html | Medium | Vendor/time-sensitive | Lifecycle, review, ownership, and peer-review use. |
| https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record | Medium | Vendor/time-sensitive | Append-only log, confidence, incident/audit framing. |
| https://ozimmer.ch/practices/2020/04/27/ArchitectureDecisionMaking.html | High | Updated practitioner synthesis | Decision rationale quality, Y-statements, template tradeoffs. |
| https://ozimmer.ch/practices/2020/05/22/ADDefinitionOfDone.html | High | Concept stable | Decision readiness: evidence, criteria, agreement, documentation, realization/review plan. |
| https://ozimmer.ch/practices/2020/09/24/ASRTestECSADecisions.html | High | Concept stable | Architectural significance criteria for ADR triage. |

## License / Reuse Notes

MADR is dual-licensed as `MIT OR CC0-1.0`. The README states you can choose one license when using the work.

For this skill's bundled templates, prefer the CC0-1.0 path for low-friction internal reuse. Keep this source map for provenance. If redistributing the skill publicly, confirm whether your package-level license needs additional MADR notices.

Not legal advice.

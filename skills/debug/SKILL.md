---
name: debug
description: "Explicit-only, production-safe debugging guidance that diagnoses problems one bounded probe at a time without automatic remediation. Use only when the user explicitly requests the debug skill by name or invokes /debug; do not activate for ordinary debugging language."
---

# Debug Safely, One Probe at a Time

Diagnose with narrow evidence, preserve user control, and stop before remediation. Treat every target as production, customer-facing, or unknown until the user explicitly identifies it otherwise.

This is behavioral guidance, not an enforcement switch. OpenCode 1.17.18 has no standard-skill frontmatter field that hard-disables implicit invocation, so the explicit-only trigger is best-effort and depends on following the description above.

## Establish Safe Context

Before suggesting any command:

1. Inspect context already available through narrow local file reads, searches, and relevant documentation lookups.
2. Determine whether the following safety-critical facts are known:
   - environment: local, dev, staging, production, customer-facing, or unknown;
   - exact target and scope: process, repository, host, service, namespace, cluster, account, data path, or other boundary;
   - precise symptom, timing, and known reproduction conditions;
   - relevant restrictions, forbidden operations, sensitive-data boundaries, and allowed tools.
3. Ask only for missing facts that materially affect the next safe probe. If urgency changes the amount of intake, ask for the smallest sufficient subset.
4. Emit zero commands until the environment, target, symptom, and restrictions are sufficient to classify the next probe safely.

Do not infer that a target is local, non-production, or safe from the working directory, tool availability, or the user's urgency.

## Run the Diagnostic Loop

For each debugging turn:

1. State the current goal.
2. State the strongest hypothesis and the most credible competing alternatives.
3. Summarize the evidence already available, separating observation from inference.
4. Select the smallest, safest probe that can strengthen or falsify a hypothesis.
5. Explain that probe before it is run.
6. Handle the probe according to the selected mode.
7. Interpret its output before choosing another probe.
8. Update the hypothesis ranking.

Never batch independent probes. Never hide exploratory actions inside a compound command.

## Default to Guided Mode

Unless the user explicitly authorizes autonomous execution for the current diagnosis and target:

- Read narrow local files, perform focused local searches, and consult relevant documentation autonomously when allowed.
- Do not execute shell or CLI probes.
- Suggest exactly one bounded shell or CLI probe.
- Explain what it does, why it is the next probe, the expected signal, its impact class, and the minimum redacted output to return.
- Wait for the user's output before proposing another command.

Treat a new user message that does not contain the requested output as new context, not permission to advance through multiple probes.

## Use Autonomous Mode Only When Explicitly Authorized

Require clear authorization that names or unambiguously identifies both the current diagnosis and its exact target. General requests such as "debug this," prior-session approval, or blanket approval do not authorize autonomous mode.

In autonomous mode:

1. Explain one probe before execution.
2. Execute only that one probe.
3. Interpret its output.
4. Decide whether another probe is still safe and necessary.

Do not issue parallel probes or chain independent actions. End autonomous mode immediately when:

- the target or scope changes;
- root cause is established;
- new evidence merely repeats existing evidence;
- a probe fails unexpectedly;
- the next action is broad, sensitive, costly, ambiguous, or requires mutation;
- a target becomes staging, production, customer-facing, or unknown for a command the agent is not allowed to run;
- the user revokes or narrows authorization.

After autonomy ends, return to guided mode or ask for the exact permission required by the next action.

## Classify Effects Conservatively

Classify every proposed or executed command by effect:

- `read-only`: observes state and should not mutate the target or external systems.
- `low-risk reversible`: changes local or session state with a clear, reliable rollback.
- `state-changing`: changes a service, process, host, data store, network, configuration, permission, cloud resource, cluster, or other persistent state.
- `irreversible/high-impact`: destructive, difficult to roll back, security-sensitive, high-blast-radius, or likely to affect production or customers.

If classification is ambiguous, use the higher-risk class. A command's familiar name or read-oriented intent does not make its effects read-only.

## Bound Commands and Output

Apply these rules to every proposed or executed command:

- Use the narrowest target, time window, count or byte limit, filters, and field selection that can answer the question.
- Request only the minimum output needed for the next decision.
- Never request raw secrets, credentials, tokens, full environment dumps, unrestricted logs, customer records, or secret-bearing manifests.
- Identify fields the user must redact before returning output, including tokens, credentials, cookies, private keys, personal data, customer identifiers, internal endpoints, and secret values.
- Do not repeat sensitive evidence in summaries; describe only the diagnostic signal.
- Pause when a safe filter or target boundary cannot be established.

Allow a pipeline only when every later stage solely filters, selects, redacts, counts, or limits the output of one observational probe. Explain every pipeline stage. Do not combine independent probes with `&&`, `;`, `||`, command substitution, subshells, or equivalent chaining.

## Explain Each Probe Adaptively

For a simple, narrow local read, keep the explanation concise but include:

- the single command;
- what it reads and why it is the next probe;
- expected useful signal;
- impact classification;
- minimal output to return and required redactions.

For every compound, remote, modifying, sensitive, or otherwise non-trivial command, use the repository's full format exactly. Do not abbreviate, rename, merge, or omit its headings or fields, even when the command itself is simple:

````markdown
Command:
```bash
<command>
```

What it does:
- `<part>`: ...
- `<flag-or-argument>`: ...
- `<pipe/redirect/env var>`: ...

Impact:
- Classification: read-only / low-risk reversible / state-changing / irreversible/high-impact.
- Environment assumption: production unless explicitly stated otherwise.
- Execution: Codex may run / ask-then-run / user-run only.
- Why: ...

Risk:
- What could go wrong:
- External state changed: yes/no/uncertain.
- Sensitive output risk: none/low/medium/high.

Rollback and verification:
- Rollback path:
- Read-only verification probe:

Expected useful output:
- Signal wanted:
- Normal vs suspicious:

What to paste back:
- Minimal lines/fields needed:
```
````

Do not present a command without its explanation.

## Enforce Permission Boundaries

Require a fresh permission checkpoint before every modifying command. Bind permission to the exact command text, arguments, target, and current turn.

The following do not count as permission for a modifying command:

- the initial debugging request;
- autonomous-mode authorization;
- blanket or standing approval;
- approval from a prior turn;
- approval for a similar but changed command;
- approval for a retry, even when the text appears unchanged.

After exact-command approval:

- Run a `low-risk reversible` or `state-changing` command only when the target is explicitly identified as local, dev, or sandbox and higher-level policy allows execution.
- Keep staging, production, customer-facing, and unknown-target modifying commands user-run.
- Keep destructive, irreversible, security-sensitive, and high-blast-radius commands user-run in every environment, including local.
- Re-check target and effects immediately before execution.

During this diagnostic workflow, never install packages, restart or reload services, edit code or configuration, clean generated artifacts, or delegate diagnosis. A separate remediation request exits this skill's workflow; handle it independently under higher-level policy rather than relaxing these debugging guardrails.

### Disposable Local Test and Build Exception

Autonomous mode may run one test or build command that writes only ignored, disposable local artifacts when current repository evidence proves all of the following:

- the target is local;
- every generated path is ignored and disposable;
- no service, dependency, lockfile, source file, configuration, credential store, remote cache, or external system is changed;
- the command is bounded and affordable.

Disclose the expected writes before execution. If any condition is uncertain, stop and request exact-command permission. Never clean the artifacts automatically.

## Stop at Diagnosis

Conclude when the evidence supports a root cause or when further diagnosis cannot safely distinguish the remaining hypotheses. Provide:

- the evidence-backed diagnosis and confidence;
- unresolved uncertainty;
- bounded remediation options with tradeoffs, risk, and verification ideas.

Do not apply a fix, edit code or configuration, restart anything, install anything, begin cleanup, or delegate diagnosis. Remediation requires a separate user request, exits this skill's workflow, and remains subject to higher-level safety policy.

## End Every Debugging Response with Status

Use a compact, redacted footer, including on intake-only turns and after diagnosis:

```markdown
Status:
- Hypothesis: ...
- Evidence so far: ...
- Next safest probe: ...
- Risk level: read-only / low-risk reversible / state-changing / irreversible/high-impact
```

Use `none; diagnosis complete` as the next probe when no further diagnostic command is justified. Never include secrets, sensitive raw output, or customer identifiers in the footer.

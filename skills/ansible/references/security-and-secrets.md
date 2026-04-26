# Security and Secrets

Use this reference when the request involves Vault, external secret stores, `no_log`, auditability, privilege escalation, or supply-chain hygiene.

## Security Doctrine

- plaintext secrets are a bug, not a convenience
- encrypted-in-git protects at rest, not after Ansible decrypts the value
- debug output is a common secret leak path
- diff output, controller events, Runner artifacts, and target files are also leak paths
- unsafe shell interpolation and process arguments can expose decrypted values
- runtime reproducibility and dependency pinning are also security controls

## Vault vs External Secret Stores

### Use Ansible Vault when:

- the secret surface is small
- rotation frequency is low
- repo-encrypted-at-rest is sufficient
- operational simplicity matters more than dynamic retrieval

### Prefer external secret retrieval when:

- secrets rotate frequently
- apps and automation share the same secret source
- auditability and access control must be stronger
- distributing one shared Vault password is operationally weak

Practical mature patterns:

- SOPS with KMS-backed decryption for git-managed encrypted files
- runtime lookup from HashiCorp Vault or cloud secret managers
- controller credential stores when using AWX/AAP

## `no_log`

Use `no_log: true` on secret-bearing tasks, but do not oversell it.

Remember:

- explicit debug output can still leak values
- surrounding logic may still reveal sensitive data indirectly
- CI logs and task failures can still expose context if the workflow is careless

Pair `no_log` with `diff: false` on secret-bearing templates/files and review artifact retention in CI, Runner, AWX, and AAP.

Vault-specific reminders:

- Vault IDs are labels/hints unless vault-id matching is enforced
- encrypted `src` content for modules such as `copy`, `template`, `unarchive`, `script`, or `assemble` is decrypted on the target by design
- editing vaulted files can leak through editor swap, backup, clipboard, or history files

## Privilege Escalation Auditability

For privileged workflows, consider callback-based logging or structured event capture.

Reason:

- target machine sudo logs often show only opaque temporary script execution
- security teams may need the actual task/module context

Also inspect unprivileged-to-unprivileged `become` paths. Temporary module files may need ACLs, `ansible_common_remote_group`, pipelining, or other mitigations; do not enable `world_readable_temp` casually because module arguments can become readable.

## Supply Chain Hygiene

Security is not only about secret values.

Also require:

- pinned collection and role versions
- version review before upgrades
- signature verification or content verification where available
- reproducible execution environments

## Secret Handling Checklist

- Is any secret stored plaintext in vars or inventory?
- Is `no_log` used where sensitive values flow?
- Is `diff: false` used on secret-bearing rendered files?
- Does debug or failure output expose values?
- Is Vault being used where an external secret system would be safer?
- Are runtime credentials injected at the narrowest possible scope?
- Are Runner/AWX/controller artifacts retained with sensitive event data?
- Has a canary secret been checked absent from logs, diffs, and artifacts?

## Recommendation Defaults

- prefer runtime lookup over repo persistence when feasible
- prefer encrypted fallback over plaintext fallback
- prefer least-privilege credential scope
- prefer short-lived credentials over static long-lived ones

## Anti-Patterns

- hardcoded secrets in playbooks or templates
- sharing one broad decryption secret across every engineer and pipeline forever
- enabling verbose debug around secret-bearing tasks casually
- treating unpinned collections and mutable EEs as harmless
- assuming Vault prevents runtime leaks
- using `world_readable_temp` as a routine become workaround

# Quick Reference

Use this reference when the user wants a fast path, checklist, or small command set.

## First Diagnostic Commands

```bash
ansible-config dump --only-changed
ansible-inventory --graph
ansible-inventory --host <hostname>
ansible-playbook playbooks/site.yml --syntax-check
ansible-playbook playbooks/site.yml --list-hosts -l <scope>
ansible-playbook playbooks/site.yml --list-tasks -l <scope>
ansible-playbook playbooks/site.yml --check --diff -l <canary>
ansible --version
ansible-galaxy collection list
```

## Fast Review Checklist

- repo-local `ansible.cfg`
- pinned `requirements.yml`
- env-scoped inventories
- no unnecessary `shell` / `command`
- explicit validation path
- secret-bearing tasks protected
- dangerous runs preview host set and task list

## Fast Performance Checklist

- disable unnecessary facts
- enable useful caching
- verify SSH reuse and pipelining
- measure before raising `forks`
- serialize shared control-plane writes

## Fast Security Checklist

- no plaintext secrets in repo
- `no_log` on secret-bearing tasks
- `diff: false` on secret-bearing templates/files
- avoid verbose debug around secrets
- check CI/Runner/AWX artifacts for leaked values
- prefer runtime lookup for frequently rotated secrets
- pin dependencies and runtimes

## Fast Role Checklist

- defaults document inputs
- high-precedence vars used sparingly
- handlers only on real change
- includes/imports chosen intentionally
- role does not depend on hidden side effects

## Module-over-Shell Rule

Before suggesting `shell` or `command`, ask:

1. Is there a native module?
2. Can change be detected explicitly?
3. Will check mode still mean anything?
4. Will the second run stay clean?

If any answer is weak, prefer a different design.

## Production Safety Questions

1. What exact hosts will this touch, and how was that proven?
2. What changes on first run, second run, check mode, and failure path?
3. What restarts, and what happens if a later task fails?
4. Where can decrypted secrets appear: logs, diffs, artifacts, target files?
5. What runtime and collection versions are pinned?

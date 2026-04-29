---
name: rhel
description: "Senior-level RHEL-family Linux operations. Use when running, debugging, hardening, patching, installing, upgrading, or operating Red Hat Enterprise Linux, Rocky Linux, AlmaLinux, CentOS Stream, Fedora-as-upstream, or related enterprise Linux hosts: systemd, RPM/DNF, SELinux, NetworkManager, firewalld, storage, kernel/kdump, FIPS/STIG, Satellite, IdM, Podman, bootc, air-gapped fleets."
metadata:
  author: local
  version: "0.1"
---

# RHEL Family Linux

Production-first guidance for Red Hat Enterprise Linux and compatible Enterprise Linux distributions. Optimize for evidence, least-change repair, durable state, auditability, SELinux correctness, and version-aware operations. Skip beginner Linux tutorials unless the user explicitly asks.

This skill distills RHEL-family operational guidance into progressive references. Load only the nearest reference for the user's task.

## Start Here

Classify the request first, then load the smallest useful reference.

- Family choice, RHEL vs Rocky/Alma/CentOS Stream/Fedora, release model, support boundaries, RHEL 8/9/10 deltas -> read [references/family-and-version-model.md](references/family-and-version-model.md)
- Unknown host, incident first pass, symptom-to-layer triage, evidence bundles -> read [references/triage-and-debugging.md](references/triage-and-debugging.md)
- RPM, DNF/DNF5, repos, AppStream modules, EPEL/CRB, errata, EUS, leapp, kernel packages -> read [references/packages-repos-lifecycle.md](references/packages-repos-lifecycle.md)
- systemd, journald, boot, GRUB/dracut, tuned, chrony, kdump, vmcore, perf/eBPF -> read [references/systemd-logs-boot-kernel.md](references/systemd-logs-boot-kernel.md)
- NetworkManager/nmcli/nmstate, firewalld/nftables, LVM/XFS/Stratis/VDO/storage -> read [references/network-firewall-storage.md](references/network-firewall-storage.md)
- SELinux model, AVC reading, booleans, fcontext, port labels, custom modules, containers, drift -> read [references/selinux-operations.md](references/selinux-operations.md)
- FIPS, crypto-policies, STIG/CIS/OpenSCAP, auditd, IdM/FreeIPA, SSSD, authselect, sudo/PAM -> read [references/security-compliance-identity.md](references/security-compliance-identity.md)
- Podman, Buildah, Skopeo, UBI, Quadlet, cgroups v2, image mode/bootc -> read [references/containers-image-mode.md](references/containers-image-mode.md)
- Satellite/Foreman/Katello, content views, capsules, local mirrors, disconnected operations, fleet drift -> read [references/airgapped-fleet-operations.md](references/airgapped-fleet-operations.md)
- Fast command lookup -> read [references/quick-reference.md](references/quick-reference.md)
- Learning plan, drills, proof-of-fluency milestones -> read [references/learning-roadmap.md](references/learning-roadmap.md)
- Evidence base, trust levels, and date/version caveats -> read [references/source-map.md](references/source-map.md)

## Use This Skill For

- debugging RHEL/Rocky/Alma/CentOS Stream/Fedora-family host incidents
- operating services with systemd, journald, auditd, kdump, tuned, chrony, and cgroups
- package/repository maintenance with RPM, DNF/DNF5, modules, EPEL, CRB, errata, EUS, and leapp
- SELinux denial diagnosis, policy fixes, container labels, and drift control
- NetworkManager, firewalld, nftables, LVM/XFS, boot, kernel, and crash workflows
- production hardening: FIPS, crypto-policies, STIG/CIS/OpenSCAP, audit rules, IdM/SSSD
- air-gapped and regulated RHEL-family operations with Satellite, mirrors, capsules, and content promotion
- explaining RHEL-family mechanisms deeply enough to choose the right fix instead of cargo-culting commands

## Do Not Use This Skill For

- generic Linux basics when no RHEL-family behavior matters
- Debian/Ubuntu/Arch procedures except as contrast for migration
- Ansible project design or playbook authoring depth; use the `ansible` skill and keep this skill for OS semantics
- Proxmox host/cluster operations; use the `proxmox` skill unless the question is specifically guest RHEL behavior
- live external fact-checking unless the user explicitly asks or the local version/docs are insufficient for a high-impact decision

## Default Operating Stance

- Inspect the local version first: `/etc/os-release`, `/etc/redhat-release`, `uname -r`, `rpm -q`, `dnf --version`, `getenforce`, relevant service versions.
- Treat RHEL, Rocky, Alma, CentOS Stream, Fedora, and Oracle Linux as related but not interchangeable.
- Diagnose by layer: service manager, logs, package/repo history, SELinux/audit, network/firewall, storage, kernel, external dependency.
- Distinguish active state, persistent config, policy state, and vendor/support state.
- Prefer durable changes: systemd drop-ins, `nmcli`/nmstate profiles, firewalld permanent config, `semanage fcontext` + `restorecon`, content-view promotion.
- Avoid broad repair hammers: permanent `setenforce 0`, `chmod 777`, raw `audit2allow | semodule -i`, ad hoc `dnf update -y`, direct vendor unit edits, runtime-only firewall/network changes.
- For production changes, include rollback/evidence/maintenance-window notes.

## Core Mental Models

1. **The RHEL family is a pipeline:** Fedora -> CentOS Stream -> RHEL -> rebuilds such as Rocky/Alma/Oracle. The closer to RHEL, the more stable and supportable; the closer to Fedora, the newer and more fluid.
2. **Stability is a product feature:** frozen ABI/API surfaces and backported fixes are intentional. Do not judge security from upstream version numbers alone.
3. **Every subsystem has active vs persistent state:** firewalld runtime/permanent, NetworkManager profile/kernel state, systemd enabled/active, sysctl runtime/file, SELinux xattr/policy, DNF installed/repo/module state.
4. **SELinux is part of the platform, not an add-on:** default RHEL services, containers, audit trails, STIG profiles, and support assumptions expect enforcing targeted policy.
5. **DNF transactions are operational evidence:** package state changes are logged and often reversible, but application data migrations are not.
6. **NetworkManager is authoritative on modern RHEL servers:** `ip` shows kernel state; `nmcli`/nmstate define durable profile state.
7. **firewalld is a policy abstraction over nftables:** inspect `nft list ruleset` when needed, but preserve firewalld as the source of truth unless deliberately replacing it.
8. **XFS on LVM is the default storage rhythm:** grow online, do not plan to shrink XFS, and validate `/etc/fstab` through systemd.
9. **Air-gapped RHEL is content supply-chain work:** mirror/sign/promote content deliberately; package, SELinux policy, and repo drift are fleet problems.

## Interview Triggers

Ask focused questions before recommending action when any are true:

- the request changes production package state, kernel state, boot config, networking, firewall, SELinux mode, FIPS/crypto policy, identity, or storage
- the distro/version/support path is unclear and affects correctness
- the host is remote and a network/firewall/storage change could cut off access
- the change involves regulated, air-gapped, Satellite-managed, or RHEL subscription-gated environments
- the user asks for broad hardening, patching, major upgrades, or fleet remediation

High-value questions:

1. Which distribution and major/minor release? (`cat /etc/os-release`, `cat /etc/redhat-release`)
2. Is this RHEL with subscription/Satellite, or Rocky/Alma/community repos?
3. Is the system production, air-gapped, FIPS/STIG-bound, or vendor-certified?
4. What is the symptom and the first evidence: `systemctl`, `journalctl`, `dnf history`, `ausearch`, `nmcli`, `firewall-cmd`, `df`, `kdumpctl`?
5. Is there console/out-of-band access before network/boot/storage changes?
6. What validation and rollback are acceptable?

## Mode Router

Choose one primary mode and at most one secondary mode.

| Mode | Use when | Load |
|---|---|---|
| `family` | distro choice, support boundaries, Fedora/Stream/RHEL/Rocky/Alma comparison, RHEL 8/9/10 deltas | `references/family-and-version-model.md` |
| `triage` | unknown host, outage, vague failure, evidence bundle, symptom-to-layer diagnosis | `references/triage-and-debugging.md` |
| `packages` | RPM/DNF, repos, EPEL/CRB, modules, errata, security updates, package rollback | `references/packages-repos-lifecycle.md` |
| `lifecycle` | EUS, release pinning, leapp, major upgrades, kernel packages, Satellite patch cadence | `references/packages-repos-lifecycle.md` + `references/airgapped-fleet-operations.md` if fleet/air-gapped |
| `services` | systemd units, drop-ins, timers, journald, service failures, boot ordering | `references/systemd-logs-boot-kernel.md` |
| `kernel-debug` | boot failures, grubby/dracut, kdump, vmcore, crash, perf/eBPF | `references/systemd-logs-boot-kernel.md` |
| `network` | nmcli/nmstate, bonds, VLANs, bridges, DNS, routes, remote-safe changes | `references/network-firewall-storage.md` |
| `firewall` | firewalld zones/services/rich rules, runtime/permanent split, nftables inspection | `references/network-firewall-storage.md` |
| `storage` | LVM, XFS, fstab, Stratis, VDO, disk/full/inode incidents | `references/network-firewall-storage.md` |
| `selinux` | AVCs, labels, booleans, port labels, permissive domains, custom modules, MCS | `references/selinux-operations.md` |
| `security` | FIPS, crypto-policies, STIG/CIS/OpenSCAP, auditd, AIDE, fapolicyd | `references/security-compliance-identity.md` |
| `identity` | IdM/FreeIPA, SSSD, authselect, PAM, sudoers, HBAC, Kerberos/certs | `references/security-compliance-identity.md` |
| `containers` | Podman/rootless, Quadlet, UBI, SELinux volumes, cgroups, bootc/image mode | `references/containers-image-mode.md` |
| `fleet` | Satellite, content views, capsules, local mirrors, disconnected operations, drift | `references/airgapped-fleet-operations.md` |
| `learn` | ramp-up plan, labs, proof-of-fluency, mentoring | `references/learning-roadmap.md` |

Common combinations:

- `triage` + `selinux`
- `services` + `packages`
- `network` + `firewall`
- `lifecycle` + `fleet`
- `security` + `identity`
- `containers` + `selinux`

## Core Workflow

1. Identify distribution, major/minor release, kernel, package manager generation, and support boundary.
2. Choose the failure layer and load the nearest reference.
3. Gather evidence before repair; preserve logs, package history, audit denials, and current config.
4. Prefer read-only probes first. Avoid changing SELinux mode, network profiles, repos, boot args, or storage until the hypothesis is credible.
5. Apply the smallest durable fix at the authoritative layer.
6. Validate active behavior and persistent state separately.
7. Report what was inspected, executed, tested, inferred, and what remains unknown.

## Output Contract

Default response shape:

1. `Verdict` - one-line assessment or recommended direction
2. `Why` - mechanism and RHEL-family-specific reason
3. `Smallest safe path` - concrete commands or config direction
4. `Risks / edge cases` - support, SELinux, reboot, network, data, audit, version concerns
5. `Validation` - commands or observations that prove the fix
6. `Rollback / next step` - how to undo or proceed safely

Mode-specific additions:

- `triage`: include `Likely layer`, `Evidence to collect first`, `Do not change yet`
- `review`: use `Verdict`, `Blockers`, `Risks`, `Evidence`, `Suggested fixes`, `Smallest next step`
- `lifecycle` or `fleet`: include `Blast radius`, `Canary`, `Content source`, `Rollback`
- `selinux`: include `AVC fields`, `Remediation class` (`boolean`, `fcontext`, `port`, `permissive-domain`, `module`)
- `network`: include `Console/OOB assumption` and `Active vs persistent check`
- `security`: include `Compliance assumption` and `Audit artifact`

## Guardrails

- Do not recommend disabling SELinux as a fix. Use temporary, scoped permissive diagnosis when justified and return to enforcing.
- Do not suggest `chmod 777`, `chcon` as a persistent fix, or blind `audit2allow | semodule -i`.
- Do not edit vendor systemd units under `/usr/lib/systemd/system`; use drop-ins.
- Do not make runtime-only firewalld/network/sysctl changes when persistence is intended.
- Do not mix RHEL, CentOS Stream, EPEL, testing, or rebuild repos casually.
- Do not judge RHEL CVE status from upstream version numbers; check RPM changelog/advisories.
- Do not run broad `dnf update -y`, `leapp upgrade`, FIPS enablement, bootloader changes, storage mutations, or remote network changes without rollback and approval.
- Do not assume Satellite, Insights, AAP, IdM, or RHEL subscriptions exist unless stated.
- Do not assume Rocky/Alma support or certification boundaries match RHEL.
- Do not use Fedora behavior as proof of RHEL behavior without version checks.

## Success Criteria

Pass when all are true:

- advice is RHEL-family-specific and version-aware
- commands distinguish observation from mutation
- recommendations preserve durable state and minimize blast radius
- SELinux guidance keeps enforcing as the production default
- validation is explicit and checks both active behavior and persistence
- support/subscription/rebuild boundaries are stated when relevant

Fail when any are true:

- the answer is generic Linux advice that ignores RHEL-family mechanisms
- SELinux, firewalld, NetworkManager, or DNF state is treated as a nuisance instead of an authoritative state machine
- production patching/upgrades/network/storage changes lack rollback or evidence plan
- RHEL, Fedora, CentOS Stream, Rocky, and Alma are treated as interchangeable

## Failure Modes

| Scenario | Detection | Fallback |
|---|---|---|
| Version unclear | User did not provide distro/release/kernel | Ask for `/etc/os-release`, `/etc/redhat-release`, `uname -r`, relevant RPM versions |
| Vague incident | Only symptom provided | Start with read-only 5-minute triage bundle from `triage` reference |
| SELinux blamed without AVC | No audit evidence or mode unknown | Check `getenforce`, `ausearch`, `ls -Z`/`ps -eZ`; prove or falsify before changing mode |
| Remote network/firewall change | No console/OOB access stated | Ask for rollback/OOB; suggest `nmcli` checkpoint and staged firewall changes |
| Fleet patching requested | No content source or promotion path stated | Ask whether Satellite/content views/local mirror/direct CDN; propose canary before broad update |
| High-stakes compliance | FIPS/STIG/audit mentioned | Require version-specific docs/local state; do not improvise policy exceptions |

### When in doubt

- Gather evidence first.
- Prefer a scoped, reversible probe over a broad mutation.
- Prefer local man pages, installed RPM metadata, and vendor docs for the exact major/minor release.
- Prefer controlled rollouts and canaries over speed.
- Prefer explaining the state machine over pasting commands.

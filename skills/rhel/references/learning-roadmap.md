# Learning Roadmap

Use this when the user wants to ramp up on RHEL-family operations or build drills/labs. Pace by proof-of-fluency, not calendar time.

## Phase 1 — Foundation

Goal: remove “this feels different” surprise.

Milestones:

1. **Two lab VMs**: Rocky/RHEL 9 and Rocky/RHEL 10 minimal installs. Snapshot before destructive experiments.
   - Proof: both boot, SSH works, network up, snapshot taken, install method documented.
2. **Filesystem walk**: identify `/etc/yum.repos.d`, `/etc/sysconfig`, `/etc/selinux`, `/etc/audit`, `/etc/firewalld`, `/etc/NetworkManager`.
   - Proof: explain what each directory controls.
3. **DNF/RPM fluency**: install/remove/search/history/undo/provides/verify.
   - Proof: find package owner of a file, verify package integrity, undo a package transaction in a VM.
4. **systemd basics**: status/start/enable/drop-ins/timers/journal.
   - Proof: create a custom service + timer with logs visible through `journalctl`.

## Phase 2 — Daily operations

1. **journalctl mastery**: boot index, unit filters, priority filters, time filters, structured fields.
   - Proof: find sshd errors from the previous boot in under 30 seconds.
2. **NetworkManager + nmstate**: static IP, DNS, bond/bridge/VLAN, keyfile profile, checkpoint.
   - Proof: apply network config and survive reboot; explain active vs persistent state.
3. **firewalld**: zones, services, ports, rich rules, runtime/permanent split.
   - Proof: restrict a service to a CIDR, test runtime, persist, verify after reload.
4. **LVM/XFS storage**: add disk, PV/VG/LV, mount, fstab, grow with `lvextend -r`.
   - Proof: hot-add storage and grow filesystem online.
5. **Users/access**: sudoers drop-ins, SSH hardening, pam_faillock basics.
   - Proof: deliver a hardened non-root admin path with `visudo` validation.

## Phase 3 — SELinux and security

1. **SELinux orientation**: modes, contexts, targeted policy, labels.
   - Proof: explain why SELinux is enforcing by default and what it confines.
2. **Reading denials**: trigger a deliberate AVC and read `scontext`, `tcontext`, `tclass`, permission.
   - Proof: identify SELinux as cause within 60 seconds.
3. **Fixing denials correctly**: boolean, fcontext, port, custom module.
   - Proof: fix all four contrived cases without disabling SELinux.
4. **Containers + SELinux**: Podman bind mounts with and without `:Z`/`:z`.
   - Proof: explain MCS categories and diagnose a bind-mount denial.
5. **FIPS/crypto-policies**: enable in lab, inspect breakages.
   - Proof: answer whether a workload is FIPS-clean and what evidence is needed.

## Phase 4 — Lifecycle and patching

1. **RHEL subscription/SCA**: register a RHEL dev/eval VM, inspect content certs/repos.
   - Proof: explain SCA vs legacy entitlement attach.
2. **Air-gapped mirror**: build a local repo with `reposync`, serve it, configure client GPG.
   - Proof: patch a client from local mirror with GPG checks enabled.
3. **Fleet patching**: use Ansible or shell on lab hosts, include reboot gating via `needs-restarting -r`.
   - Proof: patch and selectively reboot a multi-host lab.
4. **leapp**: run preupgrade, resolve inhibitors, upgrade in lab.
   - Proof: written runbook for 8->9 or 9->10 path.
5. **Kickstart**: write and validate a hardened minimal install.
   - Proof: reproducible fresh install from kickstart.

## Phase 5 — Debugging and crash analysis

1. **Triage drills**: service fail, disk full, network down, high load/OOM.
   - Proof: first three commands for each are automatic.
2. **kdump/crash**: enable kdump, trigger lab crash, inspect vmcore.
   - Proof: collect vmcore, open in `crash`, get backtrace/log/ps.
3. **eBPF/perf**: run `biolatency`, `opensnoop`, `execsnoop`, `perf top` if available.
   - Proof: identify which process generates disk I/O.
4. **sosreport**: generate with `--clean` and inspect content.
   - Proof: produce support-ready archive with redaction awareness.
5. **audit subsystem**: add a watch rule and query events.
   - Proof: explain auditd vs SELinux AVCs.

## Phase 6 — Identity and centralization

Skip if the target environment is AD-only or another identity stack.

1. **IdM lab**: server, replica, clients, users/groups/hosts.
   - Proof: clients authenticate the same IdM user with Kerberos/SSH.
2. **Sudo/HBAC**: central sudo and host-based access rules.
   - Proof: answer who can SSH to which host from `ipa hbacrule-find`.
3. **Certmonger/CA**: issue and renew host certs.
   - Proof: automatic renewal visible in logs.

## Phase 7 — Satellite/fleet management

1. **Satellite/Foreman lab**: sync repo, publish content view, promote through environments.
   - Proof: client receives content scoped to activation key/LCE.
2. **Capsules**: sync content to remote capsule.
   - Proof: clients use capsule, not central server/CDN.
3. **hammer CLI**: script routine publish/promote/list flows.
   - Proof: routine operations do not require UI clicks.

## Phase 8 — Image mode / bootc

Forward-looking for RHEL 10+.

1. Build a bootc image.
2. Switch a lab host to it.
3. Make drift, rollback, observe what persists.
4. Explain mutable package-mode vs image-mode operational tradeoffs.

## Capstone

Build an air-gapped mini-estate:

1. local mirror or Satellite/Katello
2. hardened kickstart
3. three hosts
4. SELinux enforcing
5. firewalld + NetworkManager config
6. Podman/Quadlet app
7. OpenSCAP scan
8. patch cycle through content promotion
9. documented rollback and evidence

Proof: a competent peer can repeat from your runbook.

## Signs of shallow understanding

- disables SELinux/firewalld without proof
- knows commands but cannot explain active vs persistent state
- treats RHEL, Fedora, CentOS Stream, Rocky, and Alma as interchangeable
- cannot map a failure to service/package/policy/network/kernel layer
- copies `audit2allow` output without reading it

## Signs of operational understanding

- gathers a useful evidence bundle in under five minutes
- fixes common SELinux issues with labels/booleans/ports
- uses DNF history before blaming application code
- persists firewall/network/sysctl changes deliberately
- knows when to check exact-version docs and installed RPM metadata

## Daily habits

- Read local man pages for tools you used that day.
- Save one note per investigation: symptom, evidence, fix, validation, recurrence prevention.
- Check `ausearch -m AVC -ts today` during SELinux rollout work.
- Track Red Hat/Rocky/Alma errata for operated versions.
- When tempted by `--force`, `--no-verify`, or `setenforce 0`, ask which state machine you do not understand yet.

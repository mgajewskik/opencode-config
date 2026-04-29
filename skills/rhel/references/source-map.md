# Evidence Base and Caveats

Use this reference to understand the public evidence expectations behind the skill. It intentionally avoids references to non-public materials.

## Primary official/upstream sources to prefer

Use these for version-sensitive confirmation:

- Red Hat Enterprise Linux documentation for the exact target major/minor release.
- Red Hat RHEL lifecycle, errata, release dates, Simple Content Access, kABI, security data, and leapp support matrices.
- RHEL documentation areas: Using SELinux, Managing software with DNF, Security hardening, Configuring and managing networking, Configuring firewalls and packet filters, Managing file systems, Building/running/managing containers, and kernel/kdump guides.
- CentOS Stream project documentation for Stream positioning and lifecycle.
- Rocky Linux and AlmaLinux documentation/release notes for rebuild-specific operations.
- Fedora and EPEL documentation for upstream signal, with the caveat that Fedora behavior is not proof of RHEL behavior.
- RPM Reference Manual.
- DNF and DNF5 documentation.
- NetworkManager `nmcli` manual.
- firewalld documentation.
- Podman, Buildah, Skopeo, containers-common, and container-selinux documentation.
- systemd man pages and upstream docs.
- SELinux Project docs, SELinux Notebook, NSA SELinux/LSM papers, and versioned RHEL SELinux docs.
- OpenSCAP and scap-security-guide documentation.

## Practitioner / incident source categories

Use these as supporting evidence, not as a substitute for local host state or vendor docs:

- Red Hat engineering/practitioner writing on SELinux, systemd, DNF, NetworkManager, firewalld, containers, and image mode.
- LWN kernel/security subsystem coverage for design context.
- Red Hat Bugzilla, upstream issue trackers, and Red Hat Knowledgebase articles for real incident patterns.
- ReaR restore issues, Podman volume-label issues, and systemd/initramfs labeling issues as examples of failure classes to test for.

## Evidence caveats

- Date-sensitive claims age quickly. Re-check release versions, Satellite support windows, RHEL 10 deltas, PQC/FIPS details, and leapp support matrices before production decisions.
- Fedora lifecycle and behavior should be confirmed against current Fedora documentation before using it for policy decisions.
- Rocky/Alma/RHEL compatibility claims are workload-dependent. Certified vendor software, kernel modules, FIPS, and support contracts require explicit validation.
- Commands may require packages not installed on minimal systems: `policycoreutils-python-utils`, `setroubleshoot-server`, `setools-console`, `dnf-utils`, `crash`, debuginfo repos, `bcc-tools`, `bpftrace`, `sos`, `openscap-scanner`.
- RHEL backports mean upstream version checks are often misleading. Prefer RPM changelog/advisory evidence.
- SELinux type names and policy behavior can change across minor releases. Verify with `rpm -q selinux-policy`, `sestatus -v`, `sesearch`, and installed man pages.

## Skill coverage map

| Topic | Skill reference |
|---|---|
| Distro pipeline, RHEL/Rocky/Alma/Fedora/Stream | `family-and-version-model.md` |
| Strange-box health check and symptom triage | `triage-and-debugging.md` |
| RPM/DNF/repos/modules/EUS/leapp | `packages-repos-lifecycle.md` |
| systemd/journal/boot/kernel/kdump | `systemd-logs-boot-kernel.md` |
| NetworkManager/firewalld/LVM/XFS | `network-firewall-storage.md` |
| SELinux operations and policy workflow | `selinux-operations.md` |
| FIPS/STIG/audit/IdM/auth | `security-compliance-identity.md` |
| Podman/UBI/Quadlet/bootc | `containers-image-mode.md` |
| Satellite/mirrors/air gap/fleet drift | `airgapped-fleet-operations.md` |
| Cheat sheet | `quick-reference.md` |
| Ramp-up plan | `learning-roadmap.md` |

## Public-use rule

When improving or redistributing this skill, cite public official/upstream sources or public incident reports. Do not reference non-public materials, local filesystem paths, organization names, or unpublished research artifacts.

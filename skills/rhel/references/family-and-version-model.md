# Family and Version Model

Use this when the question depends on which RHEL-family distribution, major version, minor stream, support model, or lifecycle state is in play.

## First probes

```bash
cat /etc/os-release
cat /etc/redhat-release 2>/dev/null || true
uname -r
rpm -q redhat-release rocky-release almalinux-release centos-stream-release fedora-release 2>/dev/null
dnf --version
rpm -q systemd selinux-policy NetworkManager firewalld kernel 2>/dev/null
```

For RHEL subscription behavior:

```bash
subscription-manager status
subscription-manager identity
subscription-manager release
subscription-manager repos --list-enabled
```

## Pipeline mental model

```text
Fedora -> CentOS Stream -> RHEL -> Rocky / AlmaLinux / Oracle Linux
```

- **Fedora**: fast upstream integration, short support, future signal. Good for learning where RHEL may go, not proof of RHEL behavior.
- **CentOS Stream**: public rolling stream ahead of the next RHEL minor. It is upstream of RHEL, not old downstream CentOS Linux.
- **RHEL**: paid product with lifecycle, certifications, errata, support, kABI, FIPS/STIG story, Satellite/Insights/AAP ecosystem.
- **Rocky Linux**: community enterprise rebuild aiming for close RHEL compatibility and classic CentOS feel. Operationally similar, support/certification boundaries differ.
- **AlmaLinux**: community enterprise distribution targeting ABI compatibility with RHEL, not strict bug-for-bug parity after the 2023 Red Hat source-policy shift.
- **Oracle Linux**: RHEL rebuild plus Oracle support model and optional UEK kernel. Operationally close, commercially different.

Senior rule: commands transfer across the family; support, certification, errata timing, repo keys, vendor strings, kernel module signing chains, and entitled content do not.

## Release and support framing

- RHEL major releases target roughly a decade of support: Full Support then Maintenance, with paid ELS beyond that.
- Minor releases arrive roughly twice per year and may have EUS/AUS/E4S variants.
- EUS pins selected minor releases for stability while receiving security fixes. Regulated systems often choose EUS rather than tracking latest minor.
- RHEL 8 is terminal at 8.10; RHEL 9 is the current conservative workhorse; RHEL 10 introduces dnf5, image mode/bootc maturity, SCA-only registration, and newer crypto changes.
- RHEL 7 is ELS-only; treat new RHEL 7 work as technical debt unless a vendor constraint forces it.

## Version deltas that change advice

| Area | RHEL 8 | RHEL 9 | RHEL 10 |
|---|---|---|---|
| Package manager | dnf4, modules central | dnf4 default, dnf5 available, modules reduced | dnf5 direction, modules mostly removed/deprecated |
| Network config | ifcfg still common | keyfiles default, `network-scripts` gone | keyfiles/nmstate path |
| SELinux disable | config disable still seen but deprecated | `SELINUX=disabled` deprecated/half-disabled pattern | same direction; avoid disabling |
| Containers | Podman mature | Podman + Quadlet mature | image mode/bootc first-class |
| Kernel base | 4.18 | 5.14 | 6.12 |
| Major upgrade | leapp 7->8 / 8->9 | leapp 9->10 with constraints | target side |

Always verify actual RPM versions on the target before relying on version-sensitive behavior.

## RHEL vs Rocky/Alma decision heuristics

Prefer **RHEL** when:

- a vendor certification matrix says RHEL
- FIPS certification, STIG evidence, paid support, Red Hat case escalation, or kpatch entitlement matters
- Satellite/Insights/AAP support integration is part of the operating model
- kernel modules, signed drivers, SAP/Oracle/regulated software, or auditor language requires vendor accountability

Prefer **Rocky/Alma** when:

- workloads are self-supported and RHEL-compatible behavior is sufficient
- cost/licensing simplicity matters more than vendor support
- community mirrors and rebuild governance are acceptable risks

Prefer **CentOS Stream** when:

- CI/dev/pre-production wants to preview future RHEL content
- you need a contribution point ahead of RHEL
- you accept a rolling stream and no RHEL support contract

Prefer **Fedora** when:

- workstation/lab/upstream learning matters more than long-term server stability
- you are validating future tech direction, not production RHEL behavior

## Common misconceptions

- “CentOS Stream is free RHEL.” No: it is upstream of RHEL content and has different lifecycle semantics.
- “Rocky/Alma are identical to RHEL.” Operationally close, but not identical for certification, support, subscriptions, keys, and errata flow.
- “Version number says whether a CVE is fixed.” On RHEL, fixes are backported. Check `rpm -q --changelog <pkg>`, `dnf updateinfo`, Red Hat CVE data, or vendor advisories.
- “Fedora docs prove RHEL behavior.” Fedora is a signal, not proof. Check RHEL docs and installed versions.

## Source quality rules

Use, in order:

1. Local host evidence: installed RPMs, config, man pages, `/usr/share/doc`, command help.
2. Versioned Red Hat/Rocky/Alma/CentOS/Fedora official docs for the exact major version.
3. Upstream man pages/source for systemd, DNF, RPM, NetworkManager, firewalld, Podman, SELinux.
4. Practitioner sources and forums only after the above, and mark them as lower trust.

For high-impact changes, local evidence beats memory and generic docs.

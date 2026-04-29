# Packages, Repositories, and Lifecycle

Use this for RPM/DNF, repositories, AppStream modules, EPEL/CRB, errata, EUS pinning, leapp upgrades, and package-related incidents.

## Mental model

- **RPM** is the package format and local database.
- **DNF/DNF5** is the dependency solver, repo client, advisory client, module/group manager, and transaction logger.
- **Repositories** are trust boundaries. Mixing unsupported repos is often the root cause.
- **RHEL security fixes are backported.** Upstream version numbers alone are weak evidence.
- **Transactions are state transitions.** Inspect and plan them like deployments.

## First probes

```bash
cat /etc/os-release
dnf --version
dnf repolist --all
dnf repolist --enabled
dnf history list | head -30
rpm -qa --last | head -50
rpm -q dnf rpm redhat-release rocky-release almalinux-release centos-stream-release 2>/dev/null
```

RHEL entitlement/release:

```bash
subscription-manager status
subscription-manager release
subscription-manager repos --list-enabled
```

## RPM fluency

```bash
rpm -qa | sort                         # installed packages
rpm -qi <pkg>                          # metadata
rpm -ql <pkg>                          # files in installed package
rpm -qf /path/to/file                  # package owning path
rpm -V <pkg>                           # verify installed files vs RPM DB
rpm -K ./pkg.rpm                       # verify signature/digest
rpm -q --scripts -p ./pkg.rpm          # inspect scriptlets before install
rpm2cpio ./pkg.rpm | cpio -idmv        # extract without installing
rpm -q --changelog <pkg> | head -80    # backported CVE evidence
```

`rpm -V` output is high-signal but not self-explanatory. Config files often differ intentionally; binaries/libraries differing unexpectedly are suspicious.

## DNF daily operations

```bash
dnf search <term>
dnf info <pkg>
dnf provides '*/sealert'
dnf repoquery --whatrequires 'libssl.so.3()(64bit)'
dnf check-update
dnf updateinfo list security
dnf updateinfo list cves
dnf updateinfo info RHSA-2026:1234
dnf history info <ID>
dnf history undo <ID>
dnf distro-sync --assumeno
```

Security-only and advisory-specific:

```bash
dnf update --security --assumeno
# Mutating forms belong in an approved maintenance window with reboot/rollback plan.
dnf -y update --security
dnf -y update --advisory=RHSA-2026:1234
```

Reboot/service restart detection:

```bash
dnf install -y dnf-utils  # if needs-restarting is absent
needs-restarting -r       # whole-system reboot needed?
needs-restarting -s       # services needing restart
```

## Repos and trust

Important paths:

- `/etc/dnf/dnf.conf` - global DNF knobs
- `/etc/yum.repos.d/*.repo` - repo definitions
- `/etc/dnf/vars/` - repo variables
- `/etc/pki/rpm-gpg/` - GPG keys
- `/etc/dnf/protected.d/*.conf` - protected packages

Common repo classes:

- **BaseOS**: kernel, glibc, systemd, core OS. Stable platform contract.
- **AppStream**: application runtimes; modules in RHEL 8/9; side-by-side packages in RHEL 10 direction.
- **CRB / CodeReady Builder / PowerTools**: development headers and build deps; required by many EPEL packages; not enabled by default on RHEL.
- **EPEL**: Fedora-maintained third-party packages. Useful, common, not Red Hat-supported.

Enable CRB/PowerTools carefully:

```bash
dnf config-manager --set-enabled crb          # RHEL/Rocky/Alma 9/10 naming often
dnf config-manager --set-enabled powertools   # RHEL/Rocky/Alma 8 naming often
```

Guardrails:

- Keep `gpgcheck=1` and repo GPG keys controlled.
- Do not mix RHEL and CentOS Stream repos.
- Do not leave testing/devel repos enabled on production.
- Use Satellite/content views/local mirrors for production fleets.
- EPEL packages must be risk-owned; Red Hat support will not fix EPEL.

## AppStream modules

RHEL 8/9 modules let multiple streams of some runtimes coexist. They are also a common upgrade trap and are deprecated/removed for many RHEL 10 use cases.

```bash
dnf module list
dnf module list nodejs
dnf module info nodejs:20
dnf module enable nodejs:20
dnf module reset nodejs
dnf distro-sync
dnf module list --enabled
```

Senior heuristics:

- Treat enabled module streams as version pins.
- Before minor/major upgrades, list enabled modules and reset/replace streams without target equivalents.
- Prefer plain RPM side-version packages or containers when RHEL 10 compatibility matters.

## Production patching pattern

Small host:

```bash
dnf check-update
dnf updateinfo list security
dnf update --security --assumeno
# Execute only after approval/change window and with reboot/rollback plan.
dnf -y update --security
needs-restarting -r
```

Fleet pattern:

1. Sync repos / publish content view.
2. Promote to Dev.
3. Patch canary hosts.
4. Run smoke tests, SELinux AVC checks, service health, reboot checks.
5. Promote same content view version to QA/Prod.
6. Patch in waves; preserve `dnf history` and maintenance logs.

Do not patch production directly from Red Hat CDN if the operating model requires change control.

## Minor release pinning and EUS

RHEL can pin a release stream through subscription-manager:

```bash
subscription-manager release
subscription-manager release --set=9.4
subscription-manager release --unset
```

Use EUS/minor pinning when:

- app/vendor certification targets a minor
- FIPS certification is tied to a minor
- regulated change control requires frozen baselines
- fleet drift would be costlier than slower feature adoption

## Major upgrades with leapp

Preflight mindset: `leapp` is a migration engine with inhibitors. Treat every inhibitor as a design review, not an annoyance.

RHEL 8 -> 9 example:

Do not run the upgrade step until every inhibitor is resolved, backups/snapshots are verified, app/vendor approval exists, console/OOB access is available, and the rollback/rebuild plan is accepted.

```bash
dnf -y install leapp-upgrade leapp-upgrade-el8toel9
leapp preupgrade --target 9.4
less /var/log/leapp/leapp-report.txt
less /var/log/leapp/leapp-report.json
leapp answer --section <id>.confirm=True   # only when you understand the finding
leapp upgrade --target 9.4 --reboot
```

Common inhibitors:

- deprecated/removed packages and Python 2-era dependencies
- third-party kernel modules / DKMS / signed drivers
- active AppStream modules with no target equivalent
- legacy network-scripts / ifcfg profiles needing NetworkManager keyfile migration
- custom SELinux policies that may not compile on the target
- unsupported storage/boot topologies

RHEL 9 -> 10 caveats to verify against current vendor docs:

- source host must be on 9.6+ for supported 9 -> 10 paths
- no skipping major versions; use 8 -> 9 -> 10
- FIPS 9.6+ -> 10 can preserve FIPS if prerequisites hold
- Stratis and some boot-from-SAN/network boot niches are not supported
- hosts with AAP installed are not supported by leapp 9 -> 10; rebuild or uninstall AAP first
- RHEL 10 registration is SCA-only; confirm Satellite/account readiness

Post-upgrade:

```bash
cat /etc/redhat-release
uname -r
sestatus
dnf check-update
dnf module list --enabled
systemctl --failed
journalctl -p err -b --no-pager | tail -100
```

## Kernel package management

Kernel default/argument changes affect boot. For production or remote hosts, require console/OOB, a known-good fallback kernel, and a rollback command before mutating default kernel or args.

```bash
rpm -q kernel
rpm -qa 'kernel*' | sort
grubby --default-kernel
grubby --info=ALL
grubby --set-default=/boot/vmlinuz-<version>
grubby --update-kernel=ALL --args="audit=1"
grubby --update-kernel=ALL --remove-args="quiet"
dnf remove --oldinstallonly --setopt=installonly_limit=2 kernel
```

RHEL kernel version numbers are not capability boundaries. Red Hat backports. Test capability directly (`modinfo`, `/sys`, `bpftool`, package changelog, vendor docs).

## Anti-patterns

- `dnf update -y` in production with no advisory review, content pin, reboot plan, or rollback.
- Leaving EPEL/testing repos globally enabled without ownership.
- Solving DNF conflicts with `--allowerasing` before understanding why the solver needs it.
- Enabling module streams and forgetting they exist.
- Judging CVE exposure by upstream version strings instead of RPM errata/changelog.
- Treating `dnf history undo` as full rollback for app data migrations.

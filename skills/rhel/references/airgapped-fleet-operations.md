# Air-Gapped and Fleet Operations

Use this for Satellite, Foreman/Katello, disconnected content, local mirrors, content views, capsules, activation keys, patch cadence, and fleet drift.

## Core mental model

At fleet scale, RHEL operations become content supply-chain management:

```text
upstream/vendor repos -> mirror/Satellite -> content view/version -> lifecycle environment -> activation key/client repos -> host state
```

For regulated/air-gapped operations, “which exact RPMs can this host see?” matters as much as the command used to install them.

## Content strategy options

### 1. Simple local DNF mirror

Lowest moving parts. Good for labs/small fleets; weaker lifecycle/audit controls.

```bash
dnf install -y dnf-utils createrepo_c
mkdir -p /export/repos/rhel-9-baseos
reposync -p /export/repos --download-metadata --gpgcheck \
  --repoid=rhel-9-for-x86_64-baseos-rpms
cp /etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release /export/keys/
```

Client `.repo` shape:

```ini
[local-baseos]
name=Local BaseOS
baseurl=https://mirror.local/repos/rhel-9-baseos/
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-redhat-release
```

Guardrails: mirror metadata, copy GPG keys, preserve module metadata, sync security channels on a known cadence, and log mirror versions.

### 2. Satellite / disconnected Satellite

Enterprise pattern for RHEL fleets, especially air-gapped/regulatory.

Satellite components/concepts:

- Foreman: host lifecycle/provisioning layer
- Katello/Pulp: content sync and repository management
- Candlepin: subscription/content access
- Content View (CV): versioned repo snapshot
- Lifecycle Environment (LCE): Library -> Dev -> QA -> Prod pipeline
- Capsule: content/proxy near remote sites
- Activation Key: registration bundle linking subscription/content view/LCE/host collection

### 3. Foreman/Katello for rebuilds

For Rocky/Alma/self-supported fleets, Foreman + Katello approximates Satellite content lifecycle without Red Hat entitlement integrations.

## Satellite daily model

Use `hammer` for repeatable operations:

```bash
hammer organization list
hammer product list --organization "ORG"
hammer repository list --organization "ORG"
hammer content-view list --organization "ORG"
hammer content-view publish --name "RHEL9-Base" --organization "ORG"
hammer content-view version list --content-view "RHEL9-Base" --organization "ORG"
hammer content-view version promote --content-view "RHEL9-Base" \
  --version "12.0" --to-lifecycle-environment "Prod" --organization "ORG"
hammer activation-key list --organization "ORG"
hammer host list --search "lifecycle_environment = Prod"
hammer capsule list
hammer capsule content synchronize --id <capsule-id>
```

Tribal knowledge:

- Promote by **Content View Version**, not by individual package.
- Rolling back prod usually means promoting the previous CV version back to Prod.
- Do not let Library drift silently; publish/promote on schedule.
- Activation keys define what newly registered hosts see; review before mass registration.
- Satellite 6 version support matters. Check local Satellite version/EOL before building process around it.

## Client registration

RHEL with Satellite:

```bash
subscription-manager register --org="<org>" --activationkey="<activation-key>"
subscription-manager identity
subscription-manager repos --list-enabled
dnf repolist --enabled
```

SCA note: modern RHEL registration is Simple Content Access oriented; legacy `attach` workflows are gone/going away. Confirm Satellite/account mode before scripting.

## Patch cadence

Safe fleet patching:

1. Sync content into Satellite/mirror.
2. Publish CV version.
3. Promote to Dev.
4. Patch canaries and run smoke tests.
5. Check SELinux denials, service failures, reboot requirements, app probes.
6. Promote exact same CV version to QA/Prod.
7. Patch in waves with reboot policy.
8. Export evidence: host list, CV version, dnf history, errata applied, failures.

Host-level evidence:

```bash
dnf history list | head
dnf updateinfo list security
needs-restarting -r
systemctl --failed --no-pager
journalctl -p err -b --no-pager | tail -50
getenforce
ausearch -m AVC -ts recent | head
```

## Air-gapped pitfalls

- GPG keys must move with RPM content.
- Repo metadata must include module metadata for RHEL 8/9 AppStream streams.
- Time sync must be local and reliable; signatures, Kerberos, certs, and audit trails depend on it.
- Insights SaaS is usually unavailable; use Satellite/OpenSCAP/local reporting.
- AAP air-gapped installs need bundle installers and private automation hub/execution environments.
- Debuginfo repos must be mirrored if kdump/crash analysis is required.
- `selinux-policy`, `container-selinux`, and custom policy modules need pinned, tested rollout; policy upgrades can break workloads.

## Fleet drift dimensions

Package/repo drift:

```bash
rpm -qa --qf '%{NAME} %{VERSION}-%{RELEASE}.%{ARCH}\n' | sort
dnf repolist --enabled
dnf module list --enabled
```

SELinux drift:

```bash
getenforce
semanage fcontext -l -C
semanage port -l -C
semanage boolean -l | awk '$2 != $3'
semanage permissive -l
semodule -lfull | sort
```

Firewall/network drift:

```bash
firewall-cmd --list-all --permanent
nmcli connection show
nmcli device status
```

Boot/service drift:

```bash
systemctl --failed --no-legend
systemctl list-unit-files --state=enabled
grubby --info=ALL | grep -E '^kernel=|^args='
```

## Custom SELinux policy in air gap

Pattern:

1. Build VM matches production RHEL minor and `selinux-policy` version.
2. Source `.te/.fc/.if` or CIL in git.
3. CI builds `.pp` or RPM using `selinux-policy-devel`.
4. Artifact is signed and moved through approved channel.
5. Production installs via package manager or controlled CM.
6. Rollback is `semodule -r` or package downgrade/removal.
7. Drift audit watches `semodule -lfull` and local `semanage -l -C` outputs.

Do not rely on copying random `.pp` files host by host for regulated fleets.

## Regulated air-gapped defaults

When the environment is air-gapped and change-controlled:

- SELinux enforcing is non-negotiable; `setenforce 0` is an incident, not a fix.
- FIPS/STIG may be enabled; verify exact crypto policy and certified minor.
- Patch through Satellite CV promotion, not ad hoc host updates.
- kdump and sosreport workflows must exist before incidents.
- IdM/AD owns identity; avoid local users.
- Chrony hierarchy must be internal and monitored.
- Audit log retention/forwarding is part of the platform.
- Every emergency change must be documented and replayable.

## Anti-patterns

- Direct production `dnf update` bypassing content views.
- “Latest mirror wins” with no CV/promotion/audit record.
- Uncontrolled EPEL/testing repo exposure across fleet.
- Ignoring SELinux/container-selinux policy package drift.
- Treating a local mirror as secure without GPG key handling and metadata integrity.
- Relying on Insights in a fully air-gapped design.

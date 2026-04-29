# Security, Compliance, and Identity

Use this for FIPS, crypto-policies, STIG/CIS/OpenSCAP, auditd, AIDE/fapolicyd, SSH, sudo/PAM/authselect, SSSD, IdM/FreeIPA, Kerberos, and compliance-minded hardening.

## Security posture probes

```bash
getenforce
sestatus
update-crypto-policies --show
fips-mode-setup --check 2>/dev/null || true
systemctl status auditd --no-pager
auditctl -s
ausearch -m AVC,USER_AVC,USER_LOGIN,USER_AUTH -ts today | head -100
authselect current 2>/dev/null || true
sssd --version 2>/dev/null || true
realm list 2>/dev/null || true
ipa-client-troubleshoot 2>/dev/null || true
```

## FIPS and crypto-policies

RHEL uses system-wide crypto policies affecting OpenSSL, GnuTLS, NSS, OpenSSH, libssh, BIND, libreswan, and related consumers.

```bash
update-crypto-policies --show
update-crypto-policies --set DEFAULT
update-crypto-policies --set FIPS
update-crypto-policies --set FIPS:STIG
```

FIPS enablement:

```bash
fips-mode-setup --enable
reboot
fips-mode-setup --check
```

Guardrails:

- Enabling FIPS after install is disruptive; keys/certs and third-party software may need regeneration/revalidation.
- “FIPS mode enabled” is not the same as “system is FIPS certified.” Certification can depend on exact RHEL minor and validated module versions.
- STIG profiles often use `FIPS:STIG`, stricter than plain FIPS.
- FIPS + SELinux are orthogonal but compose operationally; schedule dracut/reboot/relabel work carefully.

## OpenSCAP / STIG / CIS

Packages commonly involved:

```bash
dnf install scap-security-guide openscap-scanner
```

Scan example:

```bash
oscap xccdf eval \
  --profile xccdf_org.ssgproject.content_profile_stig \
  --results stig-results.xml \
  --report stig-report.html \
  /usr/share/xml/scap/ssg/content/ssg-rhel9-ds.xml
```

Remote scans:

```bash
oscap-ssh user@host 22 xccdf eval --profile <profile> <datastream>
```

Senior rules:

- Tailor profiles before remediating; default STIG/CIS can break apps.
- Treat generated Ansible remediation as code needing review.
- Keep scan results/reports as audit artifacts.
- Re-run after package, crypto-policy, auth, SSH, and SELinux changes.

## auditd

```bash
systemctl status auditd --no-pager
auditctl -s
ausearch -m USER_LOGIN,USER_AUTH -ts today
ausearch -ui $(id -u user) -ts today
aureport --summary
auditctl -w /etc/sudoers -p wa -k sudoers_changes
```

Persistent rules live under `/etc/audit/rules.d/` and are compiled by `augenrules`:

```bash
augenrules --check
augenrules --load
```

Do not disable noisy audit rules in regulated environments without change approval. Tune through policy.

## SSH and local access

RHEL sudo admin group is usually `wheel`:

```bash
usermod -aG wheel <user>
```

sudo drop-in rules:

```bash
visudo -cf /etc/sudoers
visudo -cf /etc/sudoers.d/10-admins
chmod 0440 /etc/sudoers.d/10-admins
chown root:root /etc/sudoers.d/10-admins
```

Footgun: sudo ignores files in `/etc/sudoers.d/` with dots or tildes in the filename.

SSH hardening usually includes:

- no root login
- key-only auth where policy allows
- strong crypto policy alignment
- `restorecon -RFv ~user/.ssh` after key deployment on SELinux systems
- audit trail for privileged access

## authselect and PAM

RHEL 8+ uses `authselect` instead of legacy `authconfig`:

```bash
authselect list
authselect current
authselect test sssd with-mkhomedir with-sudo
# Before selecting: snapshot current profile/config, check for hand-edited PAM, and prefer a custom profile when local changes exist.
authselect select sssd with-mkhomedir with-sudo
authselect apply-changes
```

Guardrail: do not hand-edit managed PAM files unless you are using a custom authselect profile and understand what will be overwritten.

Password policy is typically through PAM modules such as `pam_pwquality`, `pam_pwhistory`, `pam_faillock`, configured under `/etc/security/` and authselect-managed PAM stacks.

## SSSD, realmd, AD, and IdM

Enterprise Linux identity is commonly SSSD with either Active Directory or IdM/FreeIPA.

Inspection:

```bash
realm list
sssctl domain-list
sssctl domain-status <domain>
sssctl user-checks <user>
getent passwd <user>
id <user>
kinit <user>
klist
journalctl -u sssd -b --no-pager
```

AD join shape:

Joining a domain and switching auth profiles mutates login behavior. Snapshot `authselect current`, SSSD/PAM config, and ensure a local break-glass path before applying.

```bash
realm discover ad.example.com
realm join ad.example.com -U <admin_user>
authselect select sssd with-mkhomedir with-sudo
```

IdM client:

Client enrollment changes identity, PAM/NSS, certificates, and host keys. Confirm DNS/time sync and break-glass access first.

```bash
ipa-client-install --domain=example.com --principal=<admin_user>
id <admin_user>@example.com
sudo -l -U admin
```

## IdM / FreeIPA operations

Core concepts: integrated LDAP, Kerberos, CA/Dogtag, DNS, HBAC, sudo rules, host enrollment, certmonger, AD trusts.

Common commands:

```bash
ipa user-add <user> --first=<first_name> --last=<last_name> --email=<user>@example.com
ipa hbacrule-add devs-on-app
ipa hbacrule-add-user devs-on-app --groups=devs
ipa hbacrule-add-host devs-on-app --hostgroups=app-servers
ipa hbacrule-add-service devs-on-app --hbacsvcs=sshd
ipa sudorule-add ops-all
ipa sudorule-add-user ops-all --groups=ops
ipa sudorule-add-host ops-all --hostgroups=all-servers
ipa sudorule-add-runasuser ops-all --users=root
ipa sudorule-add-allow-command ops-all --sudocmds='ALL'
ipa-getcert list
```

Kerberos depends on time. If authentication is weird, check `chronyc tracking` and clock skew early.

## AIDE, fapolicyd, USBGuard

These often appear in hardened RHEL builds.

- **AIDE**: file integrity database. Expect baseline/update workflows and noisy first runs.
- **fapolicyd**: file access policy daemon; can block execution of untrusted binaries. Debug with its logs before blaming SELinux.
- **USBGuard**: device allow/deny rules; relevant on terminal/endpoint-like systems.

Always identify which control denied access. SELinux AVC, audit rule, fapolicyd deny, sudo/PAM failure, and crypto-policy TLS failure require different fixes.

## Compliance baseline pattern

For regulated/on-prem hosts:

1. Minimal install, SELinux enforcing, firewalld active.
2. FIPS/crypto policy decided at install time if required.
3. Separate `/var`, `/var/log`, `/var/log/audit`, `/tmp` where policy requires.
4. auditd enabled; logs forwarded/retained.
5. IdM/AD for users; avoid unmanaged local users.
6. OpenSCAP baseline and tailored remediation under version control.
7. kdump enabled and sosreport runbook documented.
8. Patch via Satellite/content views/local mirror, not ad hoc.

## Anti-patterns

- Treating FIPS toggle as a harmless runtime setting.
- Running OpenSCAP remediation blindly against production.
- Hand-editing authselect-managed PAM files.
- Creating unmanaged local privileged users in IdM/AD environments.
- Disabling audit/SELinux/fapolicyd to “make install work” without evidence and change control.
- Ignoring time sync in Kerberos/cert/signature failures.

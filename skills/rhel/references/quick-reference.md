# RHEL Quick Reference

Use this for fast command lookup. Prefer the deeper references when making production changes.

Mutating commands below are reminders, not approval to execute. For production, remote, boot, network, storage, identity, SELinux, FIPS, or lifecycle changes, load the detailed reference first and confirm version evidence, rollback, maintenance window, and console/OOB access where relevant.

## Health

```bash
hostnamectl
cat /etc/redhat-release 2>/dev/null; cat /etc/os-release
uname -r
uptime
systemctl --failed --no-pager
journalctl -p err -b --no-pager | tail -50
df -hT; df -ih; free -h
ss -tunlp | head
getenforce; sestatus
```

## Packages

```bash
dnf repolist --enabled
dnf check-update
dnf updateinfo list security
dnf update --security --assumeno
dnf history
dnf history info last
dnf history undo <ID>
dnf provides '*/filename'
dnf module list --enabled
needs-restarting -r
rpm -qa | sort
rpm -qf /path
rpm -V <pkg>
rpm -q --changelog <pkg> | head -80
```

## Services and logs

```bash
systemctl status svc.service --no-pager
systemctl restart svc.service
systemctl enable --now svc.service
systemctl edit svc.service
systemctl daemon-reload
systemctl cat svc.service
journalctl -u svc.service -b --no-pager
journalctl -u svc.service -p err --since '2 hours ago'
systemd-analyze blame
systemd-analyze critical-chain
systemd-analyze security svc.service
```

## Network

```bash
nmcli general status
nmcli device status
nmcli connection show
nmcli connection show --active
ip -br addr
ip route
# For remote mutations: require console/OOB or checkpoint rollback; see network-firewall-storage.md.
# nmcli device checkpoint --timeout 60 -- nmcli con mod NAME ipv4.dns X.X.X.X
```

## Firewall

```bash
firewall-cmd --state
firewall-cmd --get-active-zones
firewall-cmd --list-all
firewall-cmd --list-all --permanent
# Before mutating remote firewall: confirm SSH/OOB and rollback; see network-firewall-storage.md.
# firewall-cmd --permanent --add-service=https && firewall-cmd --reload
nft list ruleset
```

## Storage

```bash
lsblk -f
findmnt -R /
df -hT; df -ih
pvs; vgs; lvs -a -o +devices
findmnt --verify
systemctl daemon-reload
mount -a
# Destructive examples intentionally omitted; load network-firewall-storage.md before pvcreate/mkfs/lvextend/fstab changes.
```

## SELinux

```bash
getenforce
sestatus -v
ls -Z /path
ps -eZ | grep svc
ausearch -m AVC,USER_AVC,SELINUX_ERR -ts recent -i
ausearch -m AVC -ts recent | audit2why
sealert -a /var/log/audit/audit.log
getsebool -a | grep svc
setsebool -P BOOL on
semanage port -l | grep TYPE
semanage port -a -t TYPE_t -p tcp PORT
semanage fcontext -a -t TYPE_t '/path(/.*)?'
restorecon -RFv /path
matchpathcon -V /path
semodule -DB; semodule -B
semodule -lfull | sort
```

## Kernel / boot / crash

```bash
grubby --info=ALL
cat /proc/cmdline
kdumpctl status
ls /var/crash/
coredumpctl list
perf top
# Mutating boot/initramfs commands require console/OOB, known-good kernel, and rollback; see systemd-logs-boot-kernel.md.
```

## RHEL-specific lifecycle

```bash
subscription-manager status
subscription-manager release
subscription-manager repos --list-enabled
leapp preupgrade --target 9.4
less /var/log/leapp/leapp-report.txt
sos report --batch --case-id=CASE --clean
# Do not run leapp upgrade from quick reference; resolve inhibitors and follow packages-repos-lifecycle.md.
```

## IdM / auth

```bash
authselect current
realm list
sssctl domain-list
sssctl user-checks user
kinit user; klist
ipa user-add
ipa hbacrule-add
ipa sudorule-add
ipa-getcert list
visudo -cf /etc/sudoers.d/file
# authselect, ipa user/rule changes, and ipa-client-install mutate auth; snapshot current state and load security-compliance-identity.md first.
```

## Containers

```bash
podman info
podman ps -a
podman logs -l
podman inspect -l | less
podman run --rm -p 8080:80 -v /srv/www:/usr/share/nginx/html:Z docker.io/library/httpd
systemctl daemon-reload
systemctl status myapp.service
skopeo inspect docker://registry.access.redhat.com/ubi9/ubi
```

## Air-gapped / Satellite

```bash
reposync -p /export/repos --download-metadata --gpgcheck --repoid=<repoid>
hammer content-view publish --name 'RHEL9-Base' --organization 'ORG'
hammer content-view version promote --content-view 'RHEL9-Base' --version '12.0' --to-lifecycle-environment 'Prod' --organization 'ORG'
hammer activation-key list --organization 'ORG'
subscription-manager register --org='<org>' --activationkey='<activation-key>'
```

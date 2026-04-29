# Triage and Debugging

Use this for unknown hosts, incidents, vague failures, or when you need the smallest evidence bundle before changing anything.

## Core rule

Debug from symptom to layer, then from layer to authoritative state:

```text
symptom -> systemd/logs -> package/repo history -> SELinux/audit -> network/firewall -> storage/resources -> kernel/boot -> external dependency
```

Do not start with mutations. Start with timestamped evidence.

## Five-minute strange-box health check

```bash
# Identity / lifecycle
hostnamectl
cat /etc/redhat-release 2>/dev/null; cat /etc/os-release
uname -r
uptime; w
last -x reboot | head

# Services / boot
systemctl is-system-running
systemctl --failed --no-pager
systemctl list-jobs
journalctl -p err..alert -b --no-pager | tail -50
journalctl -k -b --no-pager | tail -50

# Packages / repos
dnf history list | head -20
dnf repolist --enabled
rpm -qa --last | head -30

# Security / SELinux
getenforce
sestatus
ausearch -m AVC,USER_AVC,SELINUX_ERR -ts recent 2>/dev/null | head -50

# Network / firewall
nmcli general status
nmcli device status
ip -br addr
ip route
firewall-cmd --state 2>/dev/null && firewall-cmd --get-active-zones && firewall-cmd --list-all
ss -tunlp | head -50

# Resources / storage
df -hT
df -ih
free -h
top -b -n1 | head -30
lsblk -f
```

For RHEL subscription-managed hosts add:

```bash
subscription-manager status
subscription-manager release
subscription-manager repos --list-enabled
```

## Symptom routers

### Service will not start

```bash
systemctl status mysvc.service --no-pager
journalctl -u mysvc.service -b --no-pager
systemctl cat mysvc.service
systemctl show mysvc.service -p User -p Group -p WorkingDirectory -p Environment -p ExecStart -p FragmentPath -p DropInPaths
systemctl list-jobs
ausearch -m AVC,USER_AVC,SELINUX_ERR -ts recent | audit2why 2>/dev/null
ss -ltnp | grep -E ':(PORT)\b'
```

Look for:

- bad unit syntax or stale systemd state (`daemon-reload` needed)
- wrong user/group/working directory/environment
- missing file/package/library
- config syntax failure (`nginx -t`, `httpd -t`, app-specific validator)
- port conflict
- SELinux denial
- dependency ordering or missing mount/network

Never edit `/usr/lib/systemd/system/*.service` directly. Use `systemctl edit` drop-ins and `systemctl daemon-reload`.

### Permission denied, but Unix permissions look correct

```bash
namei -l /path/to/object
ls -lZ /path/to/object
ps -eZ | grep -E 'svc|daemon|app'
getenforce
ausearch -m AVC,USER_AVC -ts recent | audit2why
```

Likely SELinux. Classify as wrong file label, wrong port label, boolean, or custom policy gap. Load `selinux-operations.md`.

### Port open locally but unreachable remotely

```bash
ss -ltnp | grep ':8443'
curl -v http://127.0.0.1:8443/
curl -v http://$(hostname -I | awk '{print $1}'):8443/
firewall-cmd --get-active-zones
firewall-cmd --zone=public --list-all
nft list ruleset | grep -n '8443' -C 3
ausearch -m AVC -ts recent | grep 8443 -C 2
ip route get <client-ip>
```

Check: app listen address, local firewall, SELinux port binding, route, upstream firewall/security group.

### Network disappeared after reboot

```bash
nmcli connection show
nmcli connection show --active
nmcli device status
nmcli device show <iface>
ip addr show dev <iface>
ip route
journalctl -u NetworkManager -b --no-pager
```

Common causes: manual `ip` changes not persisted, multiple profiles matching one NIC, interface rename, unmanaged device, DNS plugin behavior, route metrics, ifcfg-to-keyfile migration failure.

Remote changes require console/OOB or `nmcli device checkpoint`.

### DNF update broke an app

```bash
dnf history list
dnf history info <ID>
rpm -qa --last | head -100
find /etc -name '*.rpmnew' -o -name '*.rpmsave'
journalctl -u myapp -b --since 'patch window start'
dnf repolist --all
dnf module list --enabled
dnf distro-sync --assumeno
```

Decide rollback vs forward fix. `dnf history undo <ID>` can revert RPM state; it cannot undo database migrations, changed data formats, or external effects.

### Boot slow or emergency mode

```bash
systemd-analyze time
systemd-analyze blame | head -30
systemd-analyze critical-chain
journalctl -b -p warning..alert --no-pager
findmnt --verify
cat /etc/fstab
grubby --info=ALL | head -80
lsinitrd | head
```

Common causes: bad `/etc/fstab`, missing LUKS/LVM device, network mount timeout, failed generator, bad initramfs, SELinux relabel after mode changes.

After changing `/etc/fstab`, run `systemctl daemon-reload` and `mount -a` before declaring it done.

### Disk full or inodes exhausted

```bash
df -hT
df -ih
journalctl --disk-usage
du -xh --max-depth=1 /var | sort -h | tail -20
dnf clean all
find /var/log -type f -size +100M -exec ls -lah {} \;
ls -la /var/cache/leapp /var/lib/leapp 2>/dev/null
```

Prefer targeted cleanup. For journals, use retention (`journalctl --vacuum-size=...`) and set `SystemMaxUse=` rather than deleting random files.

### OOM or high load

```bash
journalctl -k -b | grep -iE 'killed process|out of memory|oom'
dmesg -T | grep -iE 'out of memory|killed process'
vmstat 1 5
iostat -xz 1 5
sar -u -P ALL 2>/dev/null
sar -r 2>/dev/null
pidstat -d -p <PID> 1 5 2>/dev/null
systemd-cgtop
```

If sysstat is absent, say so; do not invent history.

### Kernel panic or hard crash

```bash
kdumpctl status
systemctl status kdump.service --no-pager
ls -lh /var/crash
journalctl -k -b -1 --no-pager
last -x | head -20
```

If vmcore exists, preserve it before cleanup. Load `systemd-logs-boot-kernel.md` for `crash` workflow.

### “What changed?”

```bash
dnf history list
dnf history info last
rpm -qa --last | head -100
journalctl --since '6 hours ago' | grep -iE 'started|stopped|failed|reloaded'
last -x reboot
who -b
ls -lt /etc/ | head
rpm -qf /etc/some.conf
rpm -V <pkg>
```

Treat temporal correlation as a lead, not proof.

## Escalation evidence

For Red Hat/vendor support or peer review:

```bash
sos report --batch --case-id="CASE-12345" --clean
ls -la /var/tmp/sosreport-*
```

For kernel issues: include sosreport, vmcore if available, exact kernel RPM NEVRA, hardware/driver state, reproduction steps, and timestamped logs.

## Anti-criteria

Stop and reframe if your plan starts with:

- disabling SELinux or firewalld without evidence
- `chmod -R 777`
- broad `dnf update -y` to “see if it fixes it”
- rebooting before collecting logs/vmcore/package history
- changing remote network/firewall without OOB or auto-rollback
- editing generated/vendor files instead of source-of-truth config

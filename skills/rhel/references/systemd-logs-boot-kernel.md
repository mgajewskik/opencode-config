# systemd, Logs, Boot, and Kernel Debugging

Use this for services, unit files, journald, boot failures, GRUB/dracut, tuned/chrony, kdump, crash, perf, and eBPF.

## systemd service model

Important distinction:

- `enable` controls boot-time dependency symlinks.
- `start` activates now.
- `reload` asks the service to reload app config.
- `daemon-reload` makes systemd reread unit files/drop-ins.

```bash
systemctl status svc.service --no-pager
systemctl is-failed svc.service
systemctl list-units --state=failed
systemctl list-jobs
systemctl cat svc.service
systemctl show svc.service -p FragmentPath -p DropInPaths -p ExecStart -p MainPID -p User -p Group
journalctl -u svc.service -b --no-pager
systemctl reset-failed svc.service
```

Use drop-ins:

```bash
systemctl edit svc.service
systemctl daemon-reload
systemctl restart svc.service
systemctl cat svc.service
```

Never edit vendor units in `/usr/lib/systemd/system/` directly. Local units/drop-ins live under `/etc/systemd/system/`.

## Unit hardening

```bash
systemd-analyze security svc.service
systemctl edit svc.service
```

Common hardening directives to evaluate, not blindly add:

- `NoNewPrivileges=yes`
- `ProtectSystem=strict|full`
- `ProtectHome=yes|read-only`
- `PrivateTmp=yes`
- `ReadWritePaths=` / `ReadOnlyPaths=`
- `CapabilityBoundingSet=`
- `SystemCallFilter=`
- `DynamicUser=yes`

Validate with service-specific tests and SELinux audit checks. systemd sandboxing and SELinux compose; either can deny access.

## journald and logs

```bash
journalctl -b --no-pager
journalctl --list-boots
journalctl -b -1 -p err..alert --no-pager
journalctl -u sshd.service --since '2 hours ago'
journalctl _SYSTEMD_UNIT=sshd.service PRIORITY=3
journalctl -k -b
journalctl -o json-pretty -u svc.service -n 5
journalctl --disk-usage
journalctl --vacuum-size=500M
```

Persistence depends on configuration and the presence of `/var/log/journal` when `Storage=auto`:

```bash
grep -E '^Storage|^SystemMaxUse' /etc/systemd/journald.conf
ls -ld /var/log/journal /run/log/journal 2>/dev/null
```

If persistence is required, create `/var/log/journal` and set retention intentionally. Do not let journals silently fill `/var`.

RHEL often still runs rsyslog for text logs (`/var/log/messages`, `/var/log/secure`) and forwarding. Check both journald and rsyslog when compliance/log shipping matters.

## Boot stack

```text
firmware -> GRUB2 -> kernel + initramfs (dracut) -> systemd -> targets/units
```

Useful read-only commands:

```bash
systemctl get-default
systemd-analyze time
systemd-analyze blame | head -30
systemd-analyze critical-chain
grubby --info=ALL
cat /proc/cmdline
lsinitrd | head -100
```

Kernel parameters should be managed with `grubby` on RHEL-family systems:

Before changing kernel args, confirm console/OOB access, a known-good fallback kernel, maintenance approval, and the command needed to remove the argument.

```bash
grubby --update-kernel=ALL --args="audit=1 crashkernel=auto"
grubby --update-kernel=ALL --remove-args="quiet"
```

Rescue options:

- add `rd.break` for early boot shell
- add `enforcing=0` for permissive SELinux rescue
- use `init=/bin/bash` only as last resort
- after changing root FS in rescue, expect SELinux relabel/`restorecon` work

## dracut / initramfs clues

Regenerate initramfs when:

- storage/network driver needed at boot changed
- LUKS/LVM/root device boot config changed
- FIPS enablement changed crypto/initramfs requirements
- a kernel module must be available in early boot

Before running `dracut`, confirm the target kernel version, current initramfs backup/rollback path, console/OOB access, and that the boot-critical drivers/config are known.

```bash
lsinitrd /boot/initramfs-$(uname -r).img | less
dracut -fv /boot/initramfs-$(uname -r).img $(uname -r)
```

Do not run broad dracut rebuilds on production without rollback/console access.

## tuned, chrony, cron/timers

TuneD can override performance settings:

```bash
tuned-adm active
tuned-adm list
tuned-adm recommend
tuned-adm profile throughput-performance
```

If benchmarks or sysctls look strange, check TuneD before overriding manually.

Time sync is usually chrony:

```bash
chronyc sources
chronyc tracking
chronyc makestep
timedatectl
```

Kerberos, certificates, package signatures, logs, and audit timelines all depend on time. In air-gapped sites, local chrony hierarchy is a platform requirement.

Prefer systemd timers for new automation:

```bash
systemctl list-timers --all
systemctl status myjob.timer
journalctl -u myjob.service
```

## kdump and crash workflow

Prepare before the crash:

```bash
kdumpctl status
systemctl status kdump.service --no-pager
grep -w crashkernel /proc/cmdline
ls -ld /var/crash
```

If there is a vmcore:

```bash
ls -la /var/crash/
rpm -q kernel
dnf debuginfo-install kernel-$(uname -r)   # repo access required
crash /usr/lib/debug/lib/modules/$(uname -r)/vmlinux /var/crash/<host-date>/vmcore
```

Inside `crash`:

```text
bt        # backtrace current/panicking task
log       # kernel log buffer
ps        # task table
sys       # system info
foreach bt
```

For support, collect `sos report --clean` and preserve vmcore before cleanup. Exact matching debuginfo for the crashed kernel is mandatory.

## Application crashes and coredumps

```bash
coredumpctl list
coredumpctl info <PID-or-exe>
coredumpctl gdb <PID-or-exe>
ls /var/lib/systemd/coredump/ 2>/dev/null
```

Check service limits and coredump policy if no dump exists.

## Performance and tracing

First pass:

```bash
top
vmstat 1 5
iostat -xz 1 5
pidstat -d -p <PID> 1 5
ss -s
systemd-cgtop
```

CPU profiling:

```bash
perf top
perf record -g -p $(pidof svc) sleep 30
perf report
```

eBPF/BCC examples if packages are available:

```bash
biolatency 5 1
opensnoop
execsnoop
runqlat
bpftrace -e 'kprobe:vfs_read { @[comm] = count(); }'
```

If tools are not installed, do not install them without approval; use available logs and `/proc` first.

## Anti-patterns

- `systemctl reload` when unit files changed; use `daemon-reload`.
- Editing vendor units rather than drop-ins.
- Rebooting before collecting previous-boot logs/vmcore.
- Assuming `systemctl status` contains historical context; use `journalctl` with boot/time filters.
- Rebuilding initramfs/bootloader on a remote host without console/rollback.

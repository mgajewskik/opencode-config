# Network, Firewall, and Storage

Use this for NetworkManager/nmcli/nmstate, firewalld/nftables, DNS/routes, LVM/XFS, fstab, Stratis, VDO, disk incidents, and remote-safe changes.

## NetworkManager mental model

- `ip addr` / `ip route` shows kernel runtime state.
- `nmcli connection show` shows NetworkManager desired profiles.
- `nmcli device show/status` connects profiles to devices.
- Modern RHEL servers use NetworkManager even when headless.
- RHEL 9+ uses keyfiles under `/etc/NetworkManager/system-connections/*.nmconnection`; legacy ifcfg is no longer the default.

## Network inspection

```bash
nmcli general status
nmcli networking connectivity check
nmcli device status
nmcli device show <iface>
nmcli connection show
nmcli connection show --active
ip -br link
ip -br addr
ip route
ip route get <dest>
resolvectl status 2>/dev/null || cat /etc/resolv.conf
journalctl -u NetworkManager -b --no-pager
```

## Remote-safe network changes

Before modifying a remote host, confirm console/OOB or use checkpoint rollback:

```bash
nmcli device checkpoint --timeout 60 -- \
  nmcli connection modify 'Wired connection 1' ipv4.dns '192.0.2.53'
```

If the change cuts connectivity, NetworkManager rolls it back after timeout.

## Common nmcli operations

```bash
# Static IPv4 on existing connection
nmcli con mod eth0 ipv4.method manual \
  ipv4.addresses 10.0.0.5/24 \
  ipv4.gateway 10.0.0.1 \
  ipv4.dns '10.0.0.10 10.0.0.11'
nmcli con up eth0

# VLAN
nmcli con add type vlan con-name vlan100 dev eth0 id 100 ip4 10.100.0.5/24

# Bond (teaming is deprecated; use bonding)
nmcli con add type bond con-name bond0 ifname bond0 mode active-backup
nmcli con add type ethernet con-name bond0-eth0 ifname eth0 master bond0
nmcli con add type ethernet con-name bond0-eth1 ifname eth1 master bond0

# Bridge
nmcli con add type bridge con-name br0 ifname br0
nmcli con add type ethernet con-name br0-eth0 ifname eth0 master br0

# Migrate legacy ifcfg profiles when supported
nmcli connection migrate
```

After hand-editing keyfiles:

```bash
chmod 600 /etc/NetworkManager/system-connections/*.nmconnection
nmcli connection reload
nmcli connection up <name>
```

## Network pitfalls

- Manual `ip addr add` or `ip route add` does not persist.
- Editing `/etc/resolv.conf` often gets clobbered by NetworkManager; set DNS on the connection.
- Multiple autoconnect profiles on one NIC can cause reboot-only surprises.
- Teaming (`teamd`) is deprecated in RHEL 9 and removed/planned out in RHEL 10 paths; migrate to bonding.
- Scripts parsing `nmcli` should force `LC_ALL=C` and prefer terse/field output.

## firewalld mental model

- firewalld is a dynamic abstraction over nftables.
- Zones contain services/ports/rich rules.
- Runtime config and permanent config are separate.
- `--permanent` writes but does not immediately activate until `--reload`.

## firewalld inspection

```bash
systemctl status firewalld --no-pager
firewall-cmd --state
firewall-cmd --get-default-zone
firewall-cmd --get-active-zones
firewall-cmd --list-all
firewall-cmd --list-all --permanent
nft list ruleset | less
```

## firewalld changes

For remote hosts, confirm SSH stays allowed, keep console/OOB or a rollback path, and prefer runtime testing before making rules permanent.

```bash
# Open HTTPS permanently and apply now
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

# Open app port in a zone
firewall-cmd --zone=public --permanent --add-port=8443/tcp
firewall-cmd --reload

# Runtime experiment, then persist if correct
firewall-cmd --add-service=https
firewall-cmd --runtime-to-permanent

# Restrict SSH to a CIDR with a rich rule
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.0.0.0/8" service name="ssh" accept'
firewall-cmd --reload
```

Remember SELinux can also deny a confined service binding/connecting to a port. Opening firewalld is not sufficient for SELinux-confined daemons.

## firewall pitfalls

- Forgetting `--permanent` means the rule disappears on reload/reboot.
- Applying only `--permanent` without reload means the rule is not active yet.
- Removing SSH permanently and reloading can lock you out.
- Direct/raw nftables changes may be overwritten or obscured by firewalld; choose one source of truth.
- Legacy `--direct` is deprecated in RHEL 9 direction; prefer rich rules/policies unless raw nftables is explicitly owned.

## Storage mental model

- RHEL default: XFS on LVM.
- XFS can grow online but cannot shrink.
- LVM gives PV/VG/LV flexibility; `lvextend -r` grows LV and filesystem together.
- `/etc/fstab` is consumed by systemd generators; after edits, run `systemctl daemon-reload`.

## Storage inspection

```bash
lsblk -f
findmnt -R /
df -hT
df -ih
pvs
vgs
lvs -a -o +devices
blkid
journalctl -k -b | grep -Ei 'xfs|nvme|scsi|blk|i/o error|multipath'
```

## LVM/XFS operations

Storage commands can destroy data or strand a host in emergency mode. Before `pvcreate`, `mkfs`, `lvextend`, or `/etc/fstab` edits:

- verify the target device by stable identity (`lsblk -f`, serial/by-id, multipath state), not just `/dev/sdX`
- confirm there are no needed signatures/data (`blkid`, `wipefs -n`, storage inventory)
- take a backup/snapshot or have an explicit rollback plan
- use a maintenance window for production and console/OOB for boot-critical mounts
- test fstab changes with `findmnt --verify`, `systemctl daemon-reload`, and `mount -a` before reboot

```bash
# New disk into existing VG
pvcreate /dev/sdc
vgextend vg_data /dev/sdc

# New LV with XFS
lvcreate -L 50G -n lv_logs vg_data
mkfs.xfs /dev/vg_data/lv_logs
mkdir -p /mnt/logs
printf '%s\n' '/dev/vg_data/lv_logs /mnt/logs xfs defaults 0 0' >> /etc/fstab
systemctl daemon-reload
mount -a

# Grow LV and filesystem together
lvextend -r -L +20G /dev/vg_data/lv_app
```

For XFS repair, unmount or use rescue paths for real repair. Read-only check:

```bash
xfs_repair -n /dev/mapper/vg_data-lv_app
```

## fstab and emergency mode

Before reboot:

```bash
findmnt --verify
systemctl daemon-reload
mount -a
systemctl --failed
```

Use `nofail`, sensible timeouts, and systemd dependencies for optional/network mounts. Wrong fstab entries are a common emergency-mode cause.

## Stratis and VDO

- **Stratis** layers LVM/device-mapper/XFS into pools and filesystems. Adoption is modest; verify leapp/support constraints before relying on it.
- **VDO** standalone tools from RHEL 8 are deprecated/removed in RHEL 9 direction. Use LVM-VDO (`lvcreate --type vdo`) where supported.

Example LVM-VDO shape:

```bash
lvcreate --type vdo -n myvdo -L 100G -V 500G myvg
```

## Multipath

```bash
multipath -ll
mpathconf --enable
systemctl enable --now multipathd
```

Boot-from-SAN and multipath boot have special upgrade constraints. Check leapp docs/inhibitors before major upgrades.

## Anti-patterns

- Editing NetworkManager keyfiles without reloading or fixing permissions.
- Treating `ip` commands as persistent config.
- Remote network/firewall changes without checkpoint/OOB.
- Runtime-only firewalld changes in runbooks.
- Planning to shrink XFS.
- Editing `/etc/fstab` then rebooting without `findmnt --verify`, `systemctl daemon-reload`, and `mount -a`.

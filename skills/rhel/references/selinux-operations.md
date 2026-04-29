# SELinux Operations

Use this for RHEL-family SELinux reasoning, AVC denials, file contexts, booleans, port labels, permissive domains, custom policy modules, container labels, and fleet drift.

## Core mental model

SELinux is kernel-enforced Mandatory Access Control. DAC checks first; SELinux MAC checks after. Both must allow.

Every process and object has a security context:

```text
user:role:type:level
system_u:system_r:httpd_t:s0
system_u:object_r:httpd_sys_content_t:s0
system_u:system_r:container_t:s0:c123,c456
```

For day-to-day targeted policy, **type** is where 95% of decisions happen:

- process type/domain: `httpd_t`, `sshd_t`, `container_t`
- file type: `httpd_sys_content_t`, `var_log_t`, `container_file_t`
- port type: `http_port_t`, custom service port types

Policy answers: “Can source domain S do permission P on object class C with target type T?” Default answer is no.

## Modes

```bash
getenforce
sestatus
setenforce 0   # enforcing -> permissive, runtime only
setenforce 1   # permissive -> enforcing, runtime only
```

- **Enforcing**: production default; denials are blocked and logged.
- **Permissive**: denials are logged but not blocked; useful for diagnosis and rollout observation.
- **Disabled**: no policy loaded; labels go stale; re-enabling requires relabel. Avoid.

RHEL 9+ deprecates the old `SELINUX=disabled` config path. If you need rescue, prefer booting with `enforcing=0` and fixing labels/policy.

## Read-only inspection

```bash
getenforce
sestatus -v
ls -Z /path
ps -eZ | grep <svc>
id -Z
ss -Ztlnp
getsebool -a | grep <service>
semanage boolean -l | grep <service>
semanage fcontext -l | grep <path-or-type>
semanage port -l | grep <port-or-type>
semanage permissive -l
semodule -lfull | sort
matchpathcon -V /path
restorecon -Rvn /path     # dry run relabel
sesearch -A -s <src_t> -t <tgt_t> -c <class>
```

Packages frequently needed on minimal systems:

```bash
dnf install policycoreutils policycoreutils-python-utils setroubleshoot-server setools-console
```

Ask before installing on controlled systems.

## AVC anatomy

Example:

```text
avc: denied { read } for pid=29199 comm="httpd" name="index.html"
  scontext=system_u:system_r:httpd_t:s0
  tcontext=system_u:object_r:default_t:s0
  tclass=file permissive=0
```

Five fields determine the fix:

1. permission: `{ read }`
2. source type/domain: `httpd_t`
3. target type: `default_t`
4. object class: `file`
5. enforced/permissive: `permissive=0|1`

## Denial workflow

```bash
ausearch -m AVC,USER_AVC,SELINUX_ERR,USER_SELINUX_ERR -ts recent -i
ausearch -m AVC -ts recent | audit2why
sealert -a /var/log/audit/audit.log     # if setroubleshoot installed
journalctl -t setroubleshoot --since '1 hour ago'
```

Decision order:

1. Prove SELinux is involved with AVC/audit evidence or a short permissive probe.
2. Classify the denial:
   - wrong file label -> `semanage fcontext` + `restorecon`
   - missing boolean -> `setsebool -P`
   - wrong port label -> `semanage port`
   - hidden `dontaudit` -> `semodule -DB`, reproduce, `semodule -B`
   - genuine policy gap -> custom module, reviewed and version-controlled
3. Apply durable fix at the policy/source-of-truth layer.
4. Verify behavior and absence of new denials.

## File labels: persistent vs temporary

Temporary diagnostic:

```bash
chcon -t httpd_sys_content_t /srv/site/index.html
```

Persistent correct fix:

```bash
semanage fcontext -a -t httpd_sys_content_t '/srv/site(/.*)?'
restorecon -Rv /srv/site
matchpathcon -V /srv/site/index.html
```

The `(/.*)?` suffix matches the directory and everything below it. `/srv/site/.*` misses the directory itself.

Remove a local fcontext rule:

```bash
semanage fcontext -d '/srv/site(/.*)?'
restorecon -Rv /srv/site
```

Rule: `chcon` is for experiments/emergencies; `semanage fcontext` is for configuration management.

## Booleans

```bash
getsebool -a | grep httpd
semanage boolean -l | grep httpd
setsebool -P httpd_can_network_connect on
getsebool httpd_can_network_connect
```

`-P` persists and rebuilds policy; it can be slow. Batch/serialize across fleets.

Always look for booleans before custom policy.

## Port labels

```bash
semanage port -l | grep http_port_t
semanage port -a -t http_port_t -p tcp 8443
semanage port -m -t http_port_t -p tcp 8443
semanage port -d -t http_port_t -p tcp 8443
semanage port -l -C
```

For custom daemons, prefer a service-specific port type in a site policy module instead of overloading broad types like `http_port_t`.

## Per-domain permissive

Prefer domain-scoped diagnosis over global permissive:

```bash
semanage permissive -a httpd_t
# reproduce and collect denials
semanage permissive -d httpd_t
semanage permissive -l
```

Leaving a domain permissive is equivalent to disabling SELinux for that domain. Audit regularly.

## Dontaudit: “no AVC” does not prove “no SELinux”

```bash
semodule -DB       # disable dontaudit rules
# reproduce issue
ausearch -m AVC -ts recent -i
semodule -B        # restore dontaudit rules
```

Always pair `-DB` with `-B`; otherwise audit logs can flood.

## Custom policy modules

Generate a draft only after ruling out labels/booleans/ports:

```bash
ausearch -m AVC -ts recent | audit2allow -M local_myapp
less local_myapp.te          # review before install
semodule -i local_myapp.pp
semodule -l | grep local_myapp
sesearch -A -s myapp_t       # verify active policy includes expected rules
```

For serious modules:

- keep `.te`, `.fc`, `.if` or CIL in git
- build on a matching RHEL minor/policy version
- prefer refpolicy interfaces from `/usr/share/selinux/devel/include/`
- package/sign as RPM for fleets and air-gapped environments
- install at controlled priority (`semodule -X 400 -i foo.pp`) when needed

Module commands:

```bash
semodule -l
semodule -lfull
semodule -i foo.pp
semodule -u foo.pp
semodule -r foo
semodule -d foo
semodule -e foo
semodule -E foo > foo.cil
semodule -B
```

## Containers and MCS

Container processes usually run as `container_t` with unique MCS categories. Volumes must be labeled so `container_t` can access them:

```bash
podman run -v /host/path:/container/path:Z ...  # private label
podman run -v /host/path:/container/path:z ...  # shared label
ls -Zd /host/path
ausearch -m AVC -ts recent | audit2why
```

If a host agent also needs the same files, `:Z` may be wrong. Use a planned fcontext/type that both domains can access, reviewed in policy.

## Filesystem/xattr traps

- Labels live in `security.selinux` xattrs.
- `cp` creates new files that inherit destination defaults; `cp -a` preserves source labels, often wrong for the destination.
- `rsync` needs `-X` for xattrs; still verify with `matchpathcon -V` and `restorecon`.
- `tar` needs SELinux/xattrs options to preserve labels.
- NFSv3/CIFS and some mounts lack labels; use `context=` mount options where appropriate.
- Large full relabels (`touch /.autorelabel`) can take hours and harm hot DB/page cache behavior. Prefer targeted `restorecon -Rv <path>`.

## Fleet drift checks

```bash
getenforce
semanage fcontext -l -C
semanage port -l -C
semanage boolean -l | awk '$2 != $3'
semanage login -l
semanage permissive -l
semodule -lfull | sort
matchpathcon -V /critical/path
```

Air-gapped/fleet practice: package custom modules, sign artifacts, distribute through Satellite/local repos, and diff local customizations centrally.

## Anti-patterns

- permanent `setenforce 0` or `SELINUX=disabled`
- `chmod 777 && setenforce 0`
- `chcon` in Ansible/Puppet/Kickstart as a permanent fix
- blindly installing `audit2allow` output
- one giant custom module that grows forever
- labeling app logs as broad `var_log_t` when a service-specific log type is needed
- leaving `semodule -DB` or permissive domains enabled after debugging
- assuming containers make SELinux irrelevant

## Validation contract

For every SELinux fix, show:

```bash
getenforce
ls -Z /path OR ps -eZ OR semanage port/boolean/module query
ausearch -m AVC,USER_AVC -ts recent
service-specific smoke test
```

No new AVCs for the exercised path is the minimum evidence; for fleet rollout, aggregate denials across all hosts and require trend-to-zero before enforcing broadly.

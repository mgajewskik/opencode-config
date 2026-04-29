# Containers and Image Mode

Use this for Podman, Buildah, Skopeo, rootless/rootful containers, UBI, Quadlet, cgroups v2, SELinux container labels, and RHEL image mode/bootc.

## RHEL container stance

- Red Hat does not ship Docker Engine as the default container stack.
- Native tools: **Podman**, **Buildah**, **Skopeo**, **crun**, **containers-common**.
- SELinux and cgroups v2 are part of the expected security model.
- UBI is the normal RHEL-compatible base-image family.
- Quadlet is the current systemd integration path; `podman generate systemd` is older/deprecated for new designs.

## First probes

```bash
podman info
podman version
podman ps -a
podman images
podman system df
getenforce
rpm -q podman buildah skopeo containers-common container-selinux crun
systemctl --user status podman.socket 2>/dev/null || true
```

## Podman basics

```bash
podman run --rm -p 8080:80 docker.io/library/httpd
podman ps -a
podman logs -l
podman inspect -l | less
podman exec -it <container> /bin/sh
podman stop <container>
podman rm <container>
```

Rootless is preferred when feasible. Rootful is common for system services, privileged ports, and host integration.

## SELinux volume labels

If a bind mount fails despite Unix permissions, check SELinux first:

```bash
ausearch -m AVC -ts recent | audit2why
ls -Zd /host/path
podman inspect <container> | less
```

Mount suffixes:

```bash
podman run -v /host/path:/container/path:Z ...  # private label, one container
podman run -v /host/path:/container/path:z ...  # shared label, multiple containers
```

`container_t` + MCS categories prevent container peer access. Removing SELinux weakens the RHEL container security model.

If a host service also needs the files, do not blindly relabel with `:Z`. Create a service-specific type/fcontext or policy that both domains can access.

## Rootless gotchas

- UID/GID mappings can deny access even when SELinux is correct.
- Low ports may require sysctl or rootful service.
- User services need lingering if they must survive logout:

```bash
loginctl enable-linger <user>
systemctl --user status
```

Check:

```bash
podman unshare cat /proc/self/uid_map
podman unshare ls -ln /host/path
```

## Quadlet

Quadlet files live in:

- system: `/etc/containers/systemd/`
- user: `~/.config/containers/systemd/`

Example `/etc/containers/systemd/myapp.container`:

```ini
[Container]
Image=registry.access.redhat.com/ubi9/nginx-122
PublishPort=8080:8080
Volume=/srv/www:/usr/share/nginx/html:Z

[Service]
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Activate:

```bash
systemctl daemon-reload
systemctl start myapp.service
systemctl enable myapp.service
journalctl -u myapp.service -f
```

Use Quadlet for durable container services instead of ad hoc `podman run` shell scripts.

## UBI

Universal Base Image families:

- `ubi` - full base
- `ubi-minimal` - smaller, package manager available (`microdnf` or dnf5 direction)
- `ubi-micro` - no package manager; build from host with Buildah/multi-stage patterns
- `ubi-init` - includes systemd for init-style containers

UBI is freely redistributable. On subscribed RHEL hosts, UBI can access broader RHEL content during builds if entitled. In air-gapped environments, mirror registries and RPM repos explicitly.

## Buildah and Skopeo

```bash
buildah bud -f Containerfile -t registry.local/myapp:1.0 .
skopeo inspect docker://registry.access.redhat.com/ubi9/ubi
skopeo copy docker://registry.access.redhat.com/ubi9/ubi docker://registry.local/ubi9/ubi
skopeo copy docker://image oci-archive:./image.tar
```

Use Skopeo for registry-to-registry and disconnected image transfer workflows without local Docker daemon assumptions.

## cgroups v2 and systemd integration

RHEL 9+ defaults to cgroups v2. Rootless containers, systemd slices, and resource controls interact.

Inspect:

```bash
podman info --format '{{.Host.CgroupVersion}}'
systemd-cgls
systemd-cgtop
```

If resource accounting or limits look wrong, inspect the systemd unit/slice and Podman cgroup manager.

## Cleanup safety

`podman system prune -af` removes stopped containers, unused images, networks, and build cache. On air-gapped hosts or rollback-sensitive systems it can delete recovery artifacts and force registry access that may not exist.

Before pruning:

```bash
podman system df
podman ps -a
podman images
```

Only prune with explicit approval, image-retention awareness, and a way to restore required images.

## Image mode / bootc

RHEL 10 image mode uses bootable container images as OS artifacts. It shifts change control from per-host package transactions to image promotion.

Core commands vary by version, but the workflow is:

```bash
bootc status
bootc switch registry.local/os/my-rhel:version
systemctl reboot
bootc rollback
```

Use image mode when:

- fleet immutability and promotion fit the operating model
- workloads are greenfield or can tolerate image-based host updates
- regulated change control benefits from image artifact promotion

Avoid casual retrofits onto mutable estates without a migration plan.

## Container incident checklist

```bash
podman ps -a
podman logs <container>
podman inspect <container> | less
getenforce
ausearch -m AVC -ts recent | audit2why
ls -Zd <host-volume>
podman unshare ls -ln <host-volume>   # rootless UID mapping
ss -tulpen | grep <port>
firewall-cmd --list-all
```

Likely layers: container process, image entrypoint, systemd unit/Quadlet, SELinux labels, UID mapping, cgroups/resource limits, firewall/port publish, registry/image trust.

## Anti-patterns

- Installing upstream Docker on RHEL without support/SELinux/cgroups analysis.
- Running long-lived services from shell `podman run` commands instead of Quadlet/systemd.
- Fixing bind mounts with `chmod 777` rather than labels and UID mappings.
- Forgetting `:Z`/`:z` or using them when shared host access requires a better policy design.
- Treating UBI entitlement and full RHEL repos as the same thing.

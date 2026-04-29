# LXC Containers

Use this for LXC containers, VM-vs-container decisions, Docker-in-LXC, privileged/unprivileged containers, OCI templates, and container migration expectations.

## Core Model

Proxmox LXC guests are system containers. They share the host kernel and use Linux namespaces, cgroups, AppArmor/seccomp, and container config to isolate a Linux userspace. They are not the same operational model as QEMU VMs or Docker application containers.

Senior implication: an LXC can be a good lightweight Linux system container, but it does not give the same kernel isolation, passthrough behavior, or live-migration properties as a VM.

## VM vs LXC Decision Table

| Choose | When it fits | Avoid when |
|---|---|---|
| QEMU VM | strong isolation, different kernels, Docker/Kubernetes nodes, Windows/BSD, live migration, complex agents, PCI/USB passthrough boundaries | overhead is unacceptable and workload is simple Linux service |
| Unprivileged LXC | lightweight Linux service, homelab utility, simple system container, fast start/stop, low overhead | workload needs its own kernel, strong isolation, Docker-in-Docker, unusual kernel modules, live migration |
| Privileged LXC | narrow legacy cases where uid/gid mapping breaks required behavior | production by default; it weakens isolation and increases host blast radius |

Conservative default: use VMs for business-critical application platforms and Docker hosts unless you have a specific, tested reason to use LXC.

## Migration Semantics

- Running LXC containers do not live-migrate like VMs.
- Treat container movement as restart migration or backup/restore-style relocation unless current version/docs prove otherwise for the exact operation.
- HA for containers still implies service interruption and application restart semantics.
- Do not promise VM-like live migration for LXC-backed services.

## Docker-in-LXC

Docker-in-LXC is common in homelabs, but it is not the conservative production default.

Risks:

- shared host kernel boundary
- nesting and privileged options can erode isolation
- storage driver and cgroup behavior can surprise operators
- migration and supportability differ from a Docker host VM
- security reviews become harder because container boundaries stack in non-obvious ways

Recommended stance:

- For learning/disposable services: acceptable if labelled as a tradeoff.
- For serious workloads: default Docker/Kubernetes nodes to VMs.
- If LXC is chosen, document privileged/unprivileged mode, nesting, storage driver, backup/restore, and recovery behavior.

## PVE 9.1 OCI Image Support

PVE 9.1 introduced OCI-image-based LXC creation. Treat it as version-sensitive:

- useful for creating containers from registry-style images
- not proof that LXC has become Docker/Kubernetes
- operational caveats should be checked against the installed PVE docs and local behavior before standardizing

## LXC Backup and Recovery

- Backup/restore behavior differs from VMs because the guest shares the host kernel and filesystem semantics may differ.
- Validate file ownership, uid/gid mappings, application state, and network config after restore.
- For stateful services, restore-test the actual service, not only container start.

## LXC Smells

- “LXC is just a lighter VM.”
- Privileged LXC used by default.
- Docker-in-LXC for production because it saved RAM.
- HA expectations copied from VM live migration.
- No documented nesting, uid/gid, AppArmor/seccomp, or storage-driver assumptions.
- Container chosen before deciding isolation, migration, and recovery requirements.

## Validation

For any LXC standard:

1. Confirm privileged vs unprivileged mode and why.
2. Test backup and restore to a different node.
3. Test restart migration behavior and measure outage.
4. Validate service function after restore/restart.
5. If Docker is nested, test storage driver, cgroup behavior, security profile, and recovery path.

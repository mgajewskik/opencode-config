# Storage and Virtualization

Use this for StorageClasses, LSO, LVMS, ODF, registry storage, PV design, snapshots, and OpenShift Virtualization/KubeVirt.

## Bare-Metal Storage Decision Tree

```text
SNO/edge/local disks -> LVMS
Need simple raw local PVs -> LSO
Need RWX, object, snapshots, production HA storage -> ODF or vendor CSI
Have existing SAN/NAS -> vendor CSI if supported
Cloud platform -> platform CSI driver
```

Switching storage later means migrating data. Treat it as architecture, not day-2 polish.

## LSO

LocalStorageOperator wraps raw devices into PVs.

Good for:

- raw devices for ODF
- node-affine high-performance local block
- simple local PVs

Limitations:

- no dynamic provisioning
- RWO/node-affine
- no snapshots/clones/RWX

Use `/dev/disk/by-id` rather than `/dev/sdX`.

## LVMS

LVMS manages LVM thin pools per node via TopoLVM CSI.

Good for:

- SNO
- edge clusters
- dev/test
- local dynamic RWO volumes

Limitations:

- no multi-node replication
- no RWX
- node loss means data on that node is gone unless app-level replication exists

## ODF

ODF wraps Ceph/Rook/NooBaa into an OpenShift-supported operator stack.

Provides:

- RBD RWO block
- CephFS RWX file
- object/S3 via RGW/NooBaa depending deployment
- snapshots/clones
- encryption/KMS patterns

Costs:

- real CPU/RAM/disk/network overhead
- minimum production footprint
- operational Ceph expertise
- latency overhead versus local disks

Use ODF when production bare-metal needs one supported stack for RWO + RWX + object, especially with virtualization or logging/object storage requirements.

## StorageClass Practices

- Ensure exactly one sensible default StorageClass unless you intentionally require explicit selection.
- Use `WaitForFirstConsumer` for topology/node-affine storage.
- Provide specialized classes for database/NVMe, general workloads, RWX, and virtualization as needed.
- Label/document what operators should use.
- Avoid zero default StorageClass unless you want many operators stuck Pending.

## Internal Image Registry Storage

On bare metal, internal registry may be removed/unmanaged until configured.

Production guidance:

- never leave it on `emptyDir`
- use persistent RWX-capable storage such as CephFS or a supported NAS/CSI option
- size for builds and mirrored catalogs, not just demo pushes
- include registry storage in DR and capacity monitoring

If registry storage is lost, builds and ImageStreams may break in non-obvious ways.

## Snapshots and Backups

- CSI snapshots are not application-consistent backups unless workload quiescing is handled.
- PV snapshots do not replace etcd snapshots.
- OADP/Velero helps workload/namespace portability, not destroyed-control-plane recovery.
- For apps, pair storage snapshots with app-level consistency checks.

## OpenShift Virtualization Model

OpenShift Virtualization is KubeVirt plus CDI/HCO and OCP integrations.

Core CRs:

- `VirtualMachine`: desired VM definition
- `VirtualMachineInstance`: running VM instance
- `VirtualMachineInstanceMigration`: migration request
- `DataVolume`: populate PVC from upload, URL, registry, clone, etc.
- `HyperConverged`: umbrella stack config

Each VM is a `virt-launcher` pod running QEMU/KVM; disks are PVCs.

## Virtualization Storage Requirements

- Live migration needs shared access during cutover.
- Prefer block volume mode for VM disks where supported.
- RWX block is a stricter requirement than generic RWX file.
- SR-IOV-attached VMs generally cannot live migrate.
- VM naming and version compatibility can affect live migration; verify against current CNV/OCP matrix.

Good fits:

- VM lift-and-shift
- mixed VM/container estates
- VMware-exit paths where OCP becomes the shared platform

Bad fits:

- workloads that should simply be pods
- strict low-latency virtualization without accepting Kubernetes scheduling/storage tradeoffs
- GPU/SR-IOV-heavy estates without careful node and operator design

## Node Maintenance with VMs

Draining nodes can trigger VM eviction/migration depending on eviction strategy and storage/network support. Before maintenance:

- list VMIs on node
- check migration strategy
- verify storage supports migration
- verify secondary networks do not block migration
- plan capacity on target nodes

## Guardrails

- Do not initialize or consume raw devices without identity verification and rollback plan.
- Do not recommend NFS as a universal production answer; state workload and support limits.
- Do not assume all VMs can live migrate.
- Do not treat storage snapshots as backups without consistency and restore drills.
- Do not use `emptyDir` registry storage in production.

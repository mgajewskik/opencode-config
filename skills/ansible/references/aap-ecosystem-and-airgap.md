# AAP Ecosystem and Air-Gapped Operations

Use this reference when the request touches Red Hat Ansible Automation Platform, AWX, Private Automation Hub, Event-Driven Ansible, execution mesh, regulated environments, disconnected installs, or ecosystem tradeoffs.

## Boundaries

- `ansible-core` is the CLI engine.
- AWX is the upstream controller/orchestrator.
- AAP is the supported Red Hat platform: controller, EEs, hub, mesh, EDA, gateway, curated/signed content, RBAC, audit, and lifecycle support.
- AAP is automation orchestration, not a CI/CD platform, CMDB, runtime secret manager, or Kubernetes reconcile loop.

Default fit:

- Terraform/Pulumi create infrastructure; Ansible configures inside systems.
- Packer can use Ansible to bake images; the same role may also configure running hosts.
- Helm/Argo own Kubernetes workload reconciliation; Ansible is strongest at cluster boundaries, legacy systems, network/edge devices, and procedural operations.

## AAP Component Map

| Component | What it does | Senior checks |
|---|---|---|
| Platform Gateway | unified UI/API, SSO/auth, routes to controller/hub/EDA | LB URLs, `CSRF_TRUSTED_ORIGINS`, auth integration |
| Automation Controller | RBAC, inventories, projects, job/workflow templates, schedules, surveys, notifications, activity stream | org/team boundaries, credential scope, instance groups, audit forwarding |
| Execution Environment | OCI image with ansible-core, collections, Python/system deps, runner | built in CI, pinned by digest, internal CA baked into base EE |
| Automation Mesh | receptor overlay for distributed execution | control/execution/hop/hybrid roles, mTLS, TCP 27199, zone locality |
| Private Automation Hub | collection repo, container registry for EEs, optional Python package mirror | content signing, retention, Pulp storage backup |
| Event-Driven Ansible | rulebooks reacting to events and usually launching job templates | only for real event-driven value, not cron replacement by fashion |

## Install Topology Defaults

- AAP 2.5+ strategic VM path: containerized installer on RHEL with rootless Podman/systemd quadlets.
- OpenShift available and owned by a platform team: operator path can make sense.
- RPM installs are legacy: deprecated in AAP 2.6 and removed after 2.6. Treat any RPM-based estate as migration work.
- AAP support is RHEL-centered. Rocky/Alma may work technically, but support-contract risk matters in regulated engagements.

## Execution Environment Discipline

Production defaults:

- build layered EEs: org-base -> team-base -> app/domain EE
- bake internal CAs into the base EE, not every team EE
- pin base images, collections, wheels, and final job-template EE references by digest
- mirror base images, Galaxy/Red Hat content, Python wheels, and RPM repositories for disconnected use
- reproduce controller behavior locally with `ansible-navigator` or `ansible-runner` against the same EE

Smell: a hand-built EE tagged `latest` in production.

## Air-Gap Pattern

Two-PAH topology is the default serious pattern:

1. Connected staging PAH syncs certified/validated/community content.
2. Content is reviewed, signed, and exported from staging.
3. Artifacts cross the boundary via approved media/process.
4. Disconnected production PAH imports content.
5. Controllers pull only from production PAH and enforce signed content where supported.

Include EE images and Python/system package mirrors in the same operating model. PAH database backups do not replace backing up Pulp content and container storage.

## Regulated / Multi-Zone Design Defaults

- Use per-zone instance groups and execution nodes so jobs run near targets and cannot cross boundaries accidentally.
- Use hop nodes for DMZ traversal; they relay and should not execute automation.
- Bind job templates to the minimum instance group and inventory scope.
- Add workflow approval nodes before production waves.
- Forward activity stream to durable logging such as Splunk/ELK/SIEM.
- Use external runtime secret systems such as CyberArk, Conjur, or HashiCorp Vault when audit and rotation matter.
- Test backup and restore quarterly, including PAH content and PostgreSQL major-version compatibility.

## EDA Decision Rule

Use EDA when the automation is genuinely event-driven: alert remediation, ticket/webhook-triggered workflows, or infrastructure events that should map to constrained job templates.

Do not use EDA merely because a scheduled AAP job or CI trigger is boring. More event sources mean more ingress, audit, and failure modes.

## Ecosystem Tradeoffs

Choose Ansible when the problem is repeatable configuration or procedural operations across existing systems. Prefer alternatives when:

- reactive reconcile loops are required -> Kubernetes operators, Argo, Salt reactor
- cloud resources are being created and lifecycle-managed -> Terraform/Pulumi first
- fleet is >10k targets with high-frequency reconciliation -> consider Salt/minion architecture
- the workload is Kubernetes-native -> Helm/Kustomize/GitOps, with Ansible at boundaries
- one host or one bootstrap step is all you need -> a small shell/Python script may be cheaper

## Incident Runbook Seeds

Hub/PAH crash during deploy:

1. pause workflows or disable affected job templates
2. identify Pulp/container storage failure and disk pressure
3. verify whether metadata, artifacts, and image blobs are intact
4. remove only unused content; do not delete digests referenced by job templates
5. verify EE pull with a test job before resuming
6. check for receptor work-unit zombies and activity-stream gaps
7. add retention, storage alerts, and explicit PAH-content backup after the incident

Mesh node unavailable:

1. inspect receptor status from the correct service user on the node
2. verify receptor peers, mTLS, firewall/TCP 27199, and instance-group assignment
3. confirm the job execution path exists with matching ownership on execution/hybrid nodes
4. drain or reassign workloads before broad restart where possible

## Version-Sensitive Facts to Verify Locally

- exact ansible-core, collection, and EE versions
- AAP minor version and install topology
- whether AAP is RPM, containerized, or operator-managed
- PAH/AWX/Controller backup scope
- EDA DB compatibility across upgrades
- Lightspeed availability for the user's deployment mode

Prefer local manifests, `ansible --version`, EE definitions, `ansible-galaxy collection list`, controller settings, and pinned Red Hat docs over memory.

# Upgrades and Porting

Use this reference when the user is upgrading `ansible-core`, changing controller runtime, moving between major versions, or hardening version discipline.

## Upgrade Doctrine

- do not upgrade `ansible-core` casually in a large estate
- pin current versions before changing anything
- read porting implications before rollout, not after breakage
- treat upgrades as compatibility work, not package refresh work
- distinguish the `ansible` community package from `ansible-core`; they have different release and maintenance models

## Default Upgrade Path

1. record current `ansible-core`, collection, and runtime versions
2. pin dependencies explicitly
3. identify roles, plugins, or workflows with version-sensitive behavior
4. run validation on the smallest realistic canary path
5. expand only after check-mode, live canary, and idempotency look sane

Version facts are time-sensitive. Verify current maintained versions from local manifests, lockfiles, EE definitions, `ansible --version`, collection lists, and official release/porting docs before advising an upgrade target.

## High-Risk Areas

- undefined variable behavior hardening
- templating or conditional evaluation changes
- collection compatibility drift
- plugin or callback compatibility with the new core version
- execution-environment dependency mismatches
- role variable exposure and include/import behavior around major boundaries
- module `check_mode` / `diff_mode` support changing across collections
- third-party strategy plugins on ansible-core 2.19+ due to deprecation of non-`ansible.builtin` strategies
- AAP 2.4/2.5/2.6 install-topology changes, especially RPM deprecation/removal path
- EDA and controller data migrations where backing services or DB compatibility changes

## Porting Review Checklist

- Are collection versions pinned and reviewed for compatibility?
- Are custom plugins or modules part of the upgrade test surface?
- Does the EE pin the new controller-side dependencies explicitly?
- Do check-mode and live runs still agree on the critical paths?
- Is there a rollback plan to the prior runtime?
- Are AAP platform components, PostgreSQL major versions, PAH content, and EE images included in backup/restore planning?

## Safe Recommendation Defaults

- upgrade through canaries, not across the whole fleet at once
- validate custom plugins and callbacks explicitly
- prefer a temporary compatibility branch or tagged runtime artifact over floating latest
- call out version-specific unknowns if the user does not provide the exact target versions

## Anti-Patterns

- floating to latest `ansible-core`
- upgrading the `ansible` package while assuming only core behavior changed
- upgrading core without reviewing collection compatibility
- assuming lint alone proves upgrade readiness
- testing only playbooks while ignoring custom plugins or EEs
- upgrading AAP while assuming controller DB backup also preserves hub content and EE image blobs
- treating Rocky/Alma AAP installs as support-equivalent to RHEL without checking the contract

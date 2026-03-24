# Configuration and Authentication

Use this module when GitLab auth, host selection, TLS, or environment setup is the blocker.

## Python Path Requirements

`scripts/gl.py` expects:

```bash
export GITLAB_HOST="https://gitlab.example.com"   # optional, defaults to gitlab.com
export GITLAB_TOKEN="glpat-xxx"
export GITLAB_SSL_VERIFY="false"                  # optional override for self-signed / broken TLS only
```

Quick checks:

```bash
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" detect
uv run "$HOME/.config/opencode/skills/gitlab/scripts/gl.py" whoami
```

## glab Fallback Requirements

```bash
glab auth status
```

If needed:

```bash
glab auth login --stdin < token.txt
```

Never pass tokens as plain CLI flags in shared shells.

## Host Selection

- `gl.py` uses `GITLAB_HOST`
- `glab` uses repo remotes, configured host, or `GITLAB_HOST`
- for cross-repo work, prefer `-R group/project` with glab

## Self-Hosted / TLS Problems

Typical fallbacks:

```bash
glab config set skip_tls_verify true --host gitlab.example.com   # dev-only
glab config set ca_cert /path/to/server.pem --host gitlab.example.com
```

## Debugging

```bash
GLAB_DEBUG_HTTP=true glab api projects/:id
DEBUG=true glab mr create
```

## Decision Tree

```text
gl.py auth/env broken?
├─ Missing env vars → fix GITLAB_HOST / GITLAB_TOKEN
├─ Self-hosted host mismatch → verify host and repo remote
├─ TLS issue → use glab TLS config or CA cert
└─ Need work now → use glab fallback once auth is healthy
```

Load [troubleshooting.md](troubleshooting.md) for Python-side command failures.

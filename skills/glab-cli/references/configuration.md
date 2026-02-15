# Configuration & Authentication

## Authentication Methods

| Method | When to Use | Command |
|--------|-------------|---------|
| OAuth (gitlab.com) | Default for SaaS | `glab auth login` → select Web |
| OAuth (self-managed) | Self-managed with OAuth app | Set client_id first, then `glab auth login --hostname HOST` → Web |
| Personal Access Token | Most common, works everywhere | `glab auth login --stdin < token.txt` |
| CI Job Token | Inside GitLab CI jobs | `glab auth login --job-token $CI_JOB_TOKEN --hostname $CI_SERVER_HOST` |

### PAT Setup

Required scopes: `api` + `write_repository`

Quick links:
- gitlab.com: `https://gitlab.com/-/user_settings/personal_access_tokens?scopes=api%2Cwrite_repository`
- Self-managed: `https://YOUR_HOST/-/user_settings/personal_access_tokens?scopes=api,write_repository`

Secure login (never pass token as CLI arg in shared envs):
```bash
glab auth login --stdin < mytoken.txt
```

Check status:
```bash
glab auth status
```

### OAuth Self-Managed Prerequisites

Create OAuth app at user/group/instance level:
- Redirect URI: `http://localhost:7171/auth/redirect`
- NOT confidential
- Scopes: `openid`, `profile`, `read_user`, `write_repository`, `api`

Store app ID:
```bash
glab config set client_id <ID> --host <HOSTNAME>
```

### CI Auto-Login (EXPERIMENTAL)

```bash
GLAB_ENABLE_CI_AUTOLOGIN=true glab release list -R $CI_PROJECT_PATH
```

### Manual CI Login

```bash
glab auth login --job-token $CI_JOB_TOKEN --hostname $CI_SERVER_HOST --api-protocol $CI_SERVER_PROTOCOL
GITLAB_HOST=$CI_SERVER_URL glab release list -R $CI_PROJECT_PATH
```

## Configuration Levels

| Level | Scope | Command | File Location |
|-------|-------|---------|---------------|
| System-wide | All users | Place file manually | `/etc/xdg/glab-cli/config.yml` |
| Global | Per-user | `glab config set --global KEY VAL` | `~/.config/glab-cli/config.yml` |
| Local | Per-repo | `glab config set KEY VAL` | `.git/glab-cli/config.yml` |
| Per-host | Per GitLab instance | `glab config set KEY VAL --host HOST` | Stored in global config |

### Config Search Order (highest priority first)

1. `$GLAB_CONFIG_DIR/config.yml`
2. `~/.config/glab-cli/config.yml` (legacy, backward compat)
3. `$XDG_CONFIG_HOME/glab-cli/config.yml` (platform-specific)
4. `$XDG_CONFIG_DIRS/glab-cli/config.yml` (system-wide, default `/etc/xdg/`)

Platform-specific XDG locations:
- Linux: `~/.config/glab-cli/config.yml`
- macOS: `~/Library/Application Support/glab-cli/config.yml`
- Windows: `%APPDATA%\glab-cli\config.yml`

Warning: if config exists in both legacy and XDG location, legacy wins with a warning.

### Config Settings

| Setting | Description | Example |
|---------|-------------|---------|
| `browser` | Browser for web-based auth | `firefox`, `chrome` |
| `check_update` | Auto-check for updates | `true`, `false` |
| `display_hyperlinks` | Show clickable links | `true`, `false` |
| `editor` | Text editor for interactive edits | `vim`, `nano`, `code` |
| `glab_pager` | Pager for long output | `less`, `more`, `cat` |
| `glamour_style` | Markdown rendering style | `dark`, `light`, `notty` |
| `host` | Default GitLab host | `gitlab.example.com` |
| `token` | Auth token (per-host) | Auto-managed by `glab auth` |
| `visual` | Visual editor (fallback to `editor`) | `code --wait` |

### Set Default Host

```bash
glab config set -g host gitlab.example.com
```

Enables commands outside git repos to target self-managed instance.

## Environment Variables

### GitLab Access Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `GITLAB_TOKEN` | Auth token (overrides config) | `glpat-xxxxxxxxxxxxxxxxxxxx` |
| `GITLAB_HOST` | Target GitLab host | `gitlab.example.com` |
| `GITLAB_API_HOST` | API endpoint (if different from host) | `api.gitlab.example.com` |
| `GITLAB_CLIENT_ID` | OAuth app client ID | `abc123...` |
| `GITLAB_GROUP` | Default group for commands | `myorg` |
| `GITLAB_REPO` | Default repo for commands | `myorg/myproject` |
| `GITLAB_URI` | Full GitLab URL | `https://gitlab.example.com` |

### glab Config Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `BROWSER` | Browser for web auth | `firefox` |
| `FORCE_HYPERLINKS` | Force hyperlink display | `1` |
| `GLAB_CONFIG_DIR` | Config directory override | `/custom/path` |
| `GLAB_CHECK_UPDATE` | Enable update checks | `true` |
| `GLAB_DEBUG_HTTP` | Show HTTP request/response | `true` |
| `GLAB_SEND_TELEMETRY` | Send usage telemetry | `false` |
| `GLAMOUR_STYLE` | Markdown rendering style | `dark` |
| `NO_COLOR` | Disable colored output | `1` |
| `NO_PROMPT` | Disable interactive prompts | `1` |
| `VISUAL` / `EDITOR` | Text editor | `vim` |

### Token Precedence

1. `GITLAB_TOKEN` env var
2. Config file token

## Self-Signed Certificates

```bash
# Option 1: Skip TLS verification (insecure, dev only)
glab config set skip_tls_verify true --host gitlab.example.com

# Option 2: Provide CA cert (recommended)
glab config set ca_cert /path/to/server.pem --host gitlab.example.com
```

## mTLS Setup

Edit `~/.config/glab-cli/config.yml`:

```yaml
hosts:
  gitlab.example.com:
    token: glpat-xxxxxxxxxxxxxxxxxxxx
    client_cert: /path/to/client.crt
    client_key: /path/to/client.key
    ca_cert: /path/to/ca.pem
```

## Debugging

```bash
# Show git commands, expanded aliases, DNS errors
DEBUG=true glab mr create

# Show HTTP request/response
GLAB_DEBUG_HTTP=true glab api projects/123
```

## Multi-Instance Workflow

Inside git repo: glab uses remote's host automatically.

Outside git repo: uses configured default host or `GITLAB_HOST` env var.

Per-host config stores separate tokens:

```yaml
hosts:
  gitlab.com:
    token: glpat-aaaaaaaaaaaaaaaaaa
  gitlab.example.com:
    token: glpat-bbbbbbbbbbbbbbbbbb
```

Switch instances:
```bash
# Temporary override
GITLAB_HOST=gitlab.example.com glab mr list

# Set default
glab config set -g host gitlab.example.com
```

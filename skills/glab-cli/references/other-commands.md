# Other Commands

## Issues

```bash
# List issues
glab issue list
glab issue list --assignee=@me
glab issue list --label bug --milestone "v1.0"
glab issue list -F json

# Create issue
glab issue create -t "Bug: login fails" -d "Steps to reproduce..."
glab issue create -t "Title" --label bug,urgent --assignee user1 -m "Sprint 5"

# View issue
glab issue view 42
glab issue view 42 --comments
glab issue view 42 --web

# Comment on issue
glab issue note 42 -m "Working on this"

# Close/reopen
glab issue close 42
glab issue reopen 42

# Update
glab issue update 42 --add-label in-progress --remove-label backlog

# Subscribe
glab issue subscribe 42

# Board view
glab issue board view
```

## CI/CD Variables

```bash
# List variables
glab variable list
glab variable list --group my-group

# Get specific variable
glab variable get MY_VAR

# Set variable (value as arg or via stdin)
glab variable set MY_VAR "value"
glab variable set MY_VAR -v "value"              # explicit value flag
cat secret.txt | glab variable set MY_SECRET     # from stdin

# Set file variable
glab variable set MY_VAR "value" --type file

# Set with environment scope
glab variable set MY_VAR "value" --scope production

# Set with options
glab variable set MY_VAR "value" --masked --protected
glab variable set MY_VAR "value" --hidden        # hidden variables
glab variable set MY_VAR "value" --raw           # raw string (no expansion)
glab variable set MY_VAR "value" --description "API key for service X"

# Group variable
glab variable set MY_VAR "value" --group mygroup --scope prod

# Update
glab variable update MY_VAR "new-value"

# Delete
glab variable delete MY_VAR

# Export all (useful for backup/migration)
glab variable export
glab variable export -F json
```

## Snippets

```bash
# Create snippet
glab snippet create -t "My snippet" -f file.py
glab snippet create -t "Title" -d "description" --visibility public

# List snippets
glab snippet list

# View snippet
glab snippet view <id>
```

## Labels

```bash
glab label list
glab label create "priority::high" --color "#FF0000" --description "High priority"
```

## Milestones

```bash
glab milestone list
glab milestone create "v2.0" --description "Major release"
```

## Tokens

```bash
# List personal access tokens
glab token list --type personal

# Create project access token (default 30 days)
glab token create my-token --access-level developer --scope read_repository

# Create with custom duration
glab token create my-token --access-level maintainer --scope api --duration 7d

# Create group access token
glab token create my-token --group mygroup --access-level owner --scope api --duration 2w

# Create personal access token (non-admins: only k8s_proxy scope)
glab token create my-token --user @me --scope k8s_proxy --duration 90d

# Multiple scopes
glab token create my-token --access-level developer --scope read_repository --scope read_registry

# Revoke token
glab token revoke <token-id>
```

## Deploy Keys

```bash
glab deploy-key list
glab deploy-key create "My key" --key "ssh-rsa AAAA..."
glab deploy-key delete <key-id>
```

## SSH Keys

```bash
glab ssh-key list
glab ssh-key add --title "My laptop" --key-file ~/.ssh/id_ed25519.pub
glab ssh-key delete <key-id>
```

## GPG Keys

```bash
glab gpg-key list
glab gpg-key add --key-file my-key.gpg
```

## Incidents

```bash
glab incident list
glab incident view <id>
glab incident close <id>
```

## Iterations

```bash
glab iteration list --group my-group
```

## Secure Files

```bash
glab securefile list
glab securefile download <file-id>
```

## Changelog

```bash
glab changelog generate --version v1.0.0
```

## User Info

```bash
glab user events         # your recent activity
```

## Completions

```bash
# Generate shell completions
glab completion bash > /etc/bash_completion.d/glab
glab completion zsh > ~/.zfunc/_glab
glab completion fish > ~/.config/fish/completions/glab.fish
glab completion powershell > glab.ps1
```

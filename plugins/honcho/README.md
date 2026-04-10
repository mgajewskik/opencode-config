# Honcho OpenCode Plugin

Integrates [Honcho](https://honcho.dev) memory (Plastic Labs) into OpenCode. The plugin
automatically uploads filtered conversation messages to Honcho and injects Honcho-derived
context into your prompts so the assistant can give more informed, personalised responses
across sessions.

---

## What the plugin does

- **Uploads user messages** to Honcho after each `chat.message` hook (filtered, deduped).
- **Uploads assistant messages** to Honcho when an OpenCode session goes idle (`session.idle`
  event), also filtered and deduped.
- **Injects Honcho context** as a synthetic prompt part on the first message of each OpenCode
  session, and again after a compaction event refreshes the cache.
- **Exposes eight tools** the assistant can invoke: `honcho_search`, `honcho_chat`,
  `honcho_peer_context`, `honcho_peer_card`, `honcho_summaries`, `honcho_upload_file`,
  `honcho_remember`, and `honcho_status`.

The plugin uses the official `@honcho-ai/sdk` package. Lower-level SDK HTTP calls (`client.http`)
are used only for endpoints not yet covered by the high-level SDK methods.

---

## Quick start

### 1. Create the config file

```
~/.config/opencode/honcho.jsonc
```

Minimum viable config:

```jsonc
{
  "enabled": true,
  "workspace": "your-workspace-id"
}
```

`apiKey` defaults to the `HONCHO_API_KEY` environment variable when the field is absent from
the config file.

### 2. Register the plugin in `opencode.json`

> **Note:** Plugin registration for local TypeScript plugins is not yet confirmed. The `plugin`
> array in `opencode.json` currently lists only NPM package names
> (`"opencode-mermaid-renderer"`). The `openmemory` plugin at `plugins/openmemory.ts` is also
> absent from `opencode.json`, suggesting local plugins may be loaded via a mechanism not yet
> documented here. Verify with OpenCode's plugin-loading documentation before relying on this
> step.

### 3. Verify the import

```
bun --print "import('./plugins/honcho.ts').then(m => console.log(Object.keys(m)))"
```

Expected output: `[ 'HonchoPlugin', 'default' ]`

> **Validation status:** Import resolves correctly. Focused Bun unit tests pass. Live Honcho v3
> was validated with authenticated `curl` probes and an SDK-backed wrapper smoke test. The
> OpenCode tool runtime in a running session may need a reload to pick up code changes.

---

## Honcho model: workspace vs peer vs session

This plugin is easiest to reason about if you keep Honcho's three main concepts separate:

- **Workspace** = top-level memory namespace / trust boundary
- **Peer** = durable actor identity inside that workspace
- **Session** = one project thread or interaction thread between peers

### What should be a peer?

For coding workflows, the safest default is:

- **you** = one stable user peer (for example `mgajewskik`)
- **assistant** = one generic assistant peer (for example `agent`)

This plugin keeps a single assistant peer and records agent/model differences as message metadata
instead of splitting them into separate peers.

Why: peers accumulate cross-session memory. If you frequently rename agents, swap models, or
change prompts/permissions, creating a separate Honcho peer for each internal agent will fragment
that memory and make later merges harder.

### What do `observeMe` and `observeOthers` mean?

Honcho has two related peer/session-peer reasoning flags:

- **`observeMe`** = whether Honcho should derive memory and representation for that peer from
  messages sent by that peer.
- **`observeOthers`** = whether that peer should build a session-scoped theory-of-mind view of the
  other peers it sees in the same session.

In plain terms:

- if the **user peer** has `observeMe: true`, Honcho can learn preferences and patterns from your
  messages.
- if the **assistant peer** has `observeMe: true`, Honcho can also derive insights from assistant
  and subagent-authored messages stored under the shared assistant peer.
- if a peer has `observeOthers: true`, Honcho can form directional "what this peer knows or thinks
  about the others in this session" representations. This is mainly useful for asymmetric
  multi-agent setups.

Current plugin behaviour: when associating peers with a session, the plugin currently adds both the
user peer and the shared assistant peer with `observeMe: true` and `observeOthers: true`. That
means both sides of the OpenCode conversation can contribute to Honcho reasoning today.

### Are conclusions per session or per peer?

Both matter, but not equally:

- **session summaries / message search** are session-scoped
- **peer representations / peer context / peer chat** are peer-centric and accumulate across
  sessions in the same workspace

That means separate workspaces split your long-term profile, and separate peers split assistant
identity history.

### Recommended workspace strategy

Choose workspaces by **trust boundary**, not by tool name.

Good examples:

- `coding` or `main` for personal + general work across OpenCode and Claude Code
- `client-acme` for a sensitive client that must stay isolated

If OpenCode and Claude Code use the **same workspace** and the **same user peer name**, your user
memory can connect across both tools. If they use different workspaces, your profile is split.

### Current plugin limitation: one global config

Today this plugin loads a single global config file from:

```
~/.config/opencode/honcho.jsonc
```

It does **not** yet support path-based workspace/profile overrides. So if you want different
workspaces for personal vs client directories, the plugin will need a future config-routing layer
(for example `overrides: [{ matchPrefix, workspace, peerName, ... }]`) or a wrapper that swaps the
config file by directory.

### Claude Code comparison

The official `plastic-labs/claude-honcho` plugin also treats sessions as project/thread identities.
Its default strategy is **per-directory**, with optional `git-branch` and `chat-instance` modes.
By default it names sessions from the Claude peer/user peer plus the project basename, and it also
supports per-path session overrides in its own config.

So if you want OpenCode and Claude Code to share both **profile memory** and **project memory**,
you need to align:

1. workspace
2. user peer name
3. session naming strategy (if exact project-session sharing matters)

---

## Config reference

Config is loaded from `~/.config/opencode/honcho.jsonc` (or `honcho.json` as a fallback). This
is **not** `~/.honcho/config.json`. JSONC comments (`//` and `/* */`) are supported via an
inline parser — no external dependency.

| Field | Type | Default | Description |
|---|---|---|---|
| `enabled` | boolean | `false` | Must be `true` to activate. Also requires `workspace`. |
| `workspace` | string | `""` | Honcho workspace ID. Required when `enabled: true`. |
| `apiKey` | string | env `HONCHO_API_KEY` | API key. Config file takes precedence over env var. |
| `apiBaseUrl` | string | `"https://api.honcho.dev"` | Honcho API base URL. |
| `peerName` | string | `"opencode-user"` | Stable peer ID used for the user in Honcho. |
| `assistantName` | string | `"agent"` | Stable peer ID used for the shared assistant peer in Honcho. |
| `context.maxLength` | number | `4000` | Max characters of Honcho context injected into prompt. |
| `context.injectOnFirstMessage` | boolean | `true` | Inject context on first message per session. |
| `context.enablePeerChat` | boolean | `false` | Include optional peer-chat synthesis for the user and assistant peers in auto-injected context. |
| `filter.stripCodeBlocks` | boolean | `true` | Strip only long fenced code blocks before uploading. |
| `filter.maxCodeBlockLines` | number | `10` | Keep fenced code blocks up to this many content lines. |
| `filter.maxLineLength` | number | `500` | Drop lines longer than this (chars). |
| `filter.maxContentLength` | number | `8000` | Max total characters uploaded per message. |
| `filter.minContentLength` | number | `20` | Skip upload when filtered content is shorter than this. |

### `assistantName`

Assistant messages are always stored under one shared assistant peer. The default peer ID is
`"agent"`. If you set `assistantName`, the value is sanitised into a stable Honcho peer ID
(non-alphanumeric characters replaced with `-`, repeated separators collapsed, trimmed, and
truncated to 40 characters).

Per-message provenance still captures:

- `tool: "opencode"`
- `agent_name`
- `model_id`

The plugin does not store `provider_id` metadata.

---

## Session identity

The plugin derives a stable Honcho session name from the project directory so all conversations
in the same project map to the same Honcho session.

### Git project with commit history

The session name is derived from the full first commit hash:

```
git-{fullFirstCommitHash}
```

The hash is computed by running `git rev-list --max-parents=0 --all` and taking the
lexicographically first root commit. The full hash stays within Honcho's ID limits and avoids
unnecessary prefixes. No local state file is ever created for git projects.

### Non-git project

A normalized-path-based session name is generated on first use:

```
local-{normalized-path}
```

The name is persisted to `.opencode/honcho-session.json` under the project directory so it
survives restarts. If the normalized path would be too long, the plugin truncates it and adds a
short deterministic hash suffix.

### Migration (non-git → git)

If a `.opencode/honcho-session.json` exists and the project now has git history, the plugin:

1. Creates the new git-derived session in Honcho.
2. Copies all messages from the old local session into the new session (best-effort).
3. Deletes `.opencode/honcho-session.json` only if all messages were copied successfully.
4. If any message copy fails, the state file is kept so the next startup can retry.

---

## Automatic behaviour

### User message upload

On every `chat.message` hook, the plugin:

1. Extracts text from non-synthetic message parts.
2. Runs the content through the filter (see [Filtering](#filtering)).
3. If the filtered result passes the minimum length check, queues it for upload to Honcho. By
   default the prompt is stored under the user peer.
4. For child sessions only, if the OpenCode session has a `parentID` and there is no prior
   persisted history in that child session, the plugin treats that prompt as a subagent seed prompt
   and stores it under the shared assistant peer instead. This intentionally does **not** require
   the in-flight message to already appear in `session.messages()`, because OpenCode can fire
   `chat.message` before the current seed prompt is persisted.
   - Practical effect: true subagent sessions usually match this rule because they start empty.
   - Forked sessions should usually stay user-attributed because they are expected to expose prior
     persisted history in the child session.
   - If OpenCode ever creates a forked child session that looks empty to `session.messages()`, only
     the first prompt in that fork could be misattributed to the assistant peer.
5. Failed uploads are retried on the next `chat.message` or `session.idle` for the same
   OpenCode session.

Messages are deduped by OpenCode message ID. Startup bootstraps known uploaded IDs by reading
the Honcho session message list.

### Assistant message upload

When an OpenCode session emits `session.idle`, the plugin fetches the full message list for
that session, finds finished assistant messages (non-summary) not yet uploaded, filters each
one, and posts them to Honcho under the configured shared assistant peer (`assistantName`).
Failed uploads are not marked as done, so the next `session.idle` retries them.

### Context injection

On the first message of each OpenCode session (when `context.injectOnFirstMessage` is `true`),
the plugin fetches Honcho-derived context and prepends it as a synthetic `text` part. The
injected body is built in this order:

1. user peer card
2. optional user peer chat synthesis (only when `context.enablePeerChat` is `true`)
3. assistant peer card
4. optional assistant peer chat synthesis (only when `context.enablePeerChat` is `true`)
5. session summary (long summary preferred, short summary fallback)

The plugin does **not** inject raw recent session messages into automatic prompt context.

The injected block is wrapped:

```
[HONCHO CONTEXT]
...context body...
[END HONCHO CONTEXT]
```

Context longer than `context.maxLength` is truncated with a `[context truncated]` marker.

If one section fetch fails, the plugin keeps any other available sections and still injects the
partial context. If Honcho returns no usable context at all (for example first-ever session with no
summary and empty peer cards), the part is not added and no error is raised.

### Context refresh after compaction

The context cache is invalidated when OpenCode fires a `session.compacted` event (preferred) or
a `message.updated` event with `role=assistant`, `summary=true`, and `finish` set (fallback for
older OpenCode versions). After invalidation, the injection flag is cleared so the next message
triggers a fresh Honcho context fetch.

There is no timer or TTL-based refresh. Cache invalidation is compaction-driven only.

---

## Tools

All eight tools are always registered. They return `{ success: false, error: "..." }` when the
plugin is not configured.

### `honcho_search`

```
args: { query: string, limit?: number }
```

Semantically searches the current project's Honcho session for past conversation content
relevant to `query`. Best when you want raw recall or supporting evidence from prior
conversation text. If you want Honcho to synthesize what that memory implies for the current
task, project/session context, prior similar work, or user patterns, prefer `honcho_chat`.
Set `limit` to control how many matching Honcho messages are retrieved; it must be a positive
integer and defaults to `10`. Uses the Honcho SDK session search method and joins matching
message content from the response.

### `honcho_chat`

```
args: { query: string }
```

Queries Honcho's peer chat method with a single natural-language question grounded in relevant
memory. Use it when you want a synthesized answer—e.g. what has already been tried on a
similar task, what matters in the current project/session context, or what the user tends to
prefer—rather than raw retrieved conversation snippets. Returns Honcho's derived response
string.

### `honcho_peer_context`

```
args: {}
```

Returns the current user peer's context from Honcho. The context includes the peer's derived
representation and any peer-card-backed content that spans all sessions in the workspace. Useful
when you want the full cross-session profile rather than just the current project's session
context.

### `honcho_peer_card`

```
args: {}
```

Returns the user peer card from Honcho as a structured list of derived traits or facts
associated with the peer. Returns `{ count, items: string[] }`. An empty list means Honcho has
not yet built a card for this peer.

### `honcho_summaries`

```
args: {}
```

Returns the short and long Honcho summaries for the current project session, if they exist.
Returns `{ shortSummary: string | null, longSummary: string | null }`. Summaries are generated
by Honcho server-side after sufficient conversation history accumulates.

### `honcho_upload_file`

```
args: { filePath: string, contentType?: string }
```

Reads a local file and uploads it into the current Honcho session under the user peer. Relative
paths are resolved from the current project directory (the same directory OpenCode was opened
in). Files must stay inside that project root; `../` escapes, absolute paths outside the project,
and symlink escapes are rejected. Obvious secret-like files (for example `.env`, `.pem`, `.key`,
`.p12`, `.pfx`, common SSH private key names) are blocked, and files over 5 MiB are rejected.
The `contentType` argument is optional; when omitted, the plugin guesses from the file
extension (e.g. `.ts` → `text/typescript`, `.md` → `text/markdown`, unknown → `application/octet-stream`).
Returns `{ uploadedCount, messageIds[] }`.

### `honcho_remember`

```
args: {
  content: string,
  observer?: "user" | "agent",
  observed?: "user" | "agent",
}
```

Stores a plain-text conclusion or insight in Honcho (`POST /conclusions`) anchored to the
current project session, with explicit observer/observed attribution. The session is injected
automatically.

- `observer` = who made the observation. Defaults to `"user"`.
- `observed` = who the conclusion is about. Defaults to `"user"`.

Recommended patterns:

- direct user fact: `observer="user"`, `observed="user"`
  - example: `remember that I like flowers`
- user's observation about the agent: `observer="user"`, `observed="agent"`
  - example: `remember that as agent, you need to ask before installing packages`
- agent reflection about the user/project: `observer="agent"`, `observed="user"`
- agent self-reflection: `observer="agent"`, `observed="agent"`

The content is run through the same filter as uploaded messages — code blocks and log-like
content are rejected.

### `honcho_status`

```
args: {}
```

Returns the current plugin configuration, project session identity (`sessionName`, `kind`),
runtime Honcho IDs (`honchoSessionId`, `userPeerId`, `assistantPeerId`), and filter/context
settings. Useful for debugging. If the plugin is not configured, returns instructions for
creating the config file.

---

## Filtering

All content (user messages, assistant messages, `honcho_remember` payloads) passes through the
same deterministic filter before upload. No model-generated summarisation is performed.

Filter steps, in order:

1. **ANSI escape codes** — removed.
2. **Long fenced code blocks** (`` ```...``` ``) — stripped only when they exceed
   `filter.maxCodeBlockLines` and `filter.stripCodeBlocks: true`.
3. **Inline code** (`` `...` ``) — preserved.
4. **Stack trace lines** — lines matching `^\s{2,}at \S+.*\(.*\)$` are dropped.
5. **Timestamp-prefixed log lines** — lines starting with an ISO 8601 date/time prefix are
   dropped.
6. **Oversized lines** — lines longer than `filter.maxLineLength` characters are dropped.
7. **Blank line collapse** — three or more consecutive blank lines are reduced to two.
8. **Truncation** — content exceeding `filter.maxContentLength` is cut and appended with
   `\n[truncated]`.
9. **Minimum length** — if the result is shorter than `filter.minContentLength`, the message is
   skipped entirely.

### Privacy tradeoff

The filter removes large code dumps, logs, and stack traces from what is sent to Honcho while
keeping short code snippets and inline references that often carry useful intent. No personally
identifiable information is stripped automatically beyond what the filter rules above cover.
Review what you type in OpenCode if you have strict data-residency or privacy requirements.

---

## Logging

All plugin activity is appended to:

```
~/.local/share/opencode/honcho.log
```

Each OpenCode startup writes a session-start marker. Log lines include ISO timestamps and
structured JSON payloads. The log file is append-only and grows unboundedly; no rotation is
implemented.

---

## Running the tests

Four unit test files cover the filter rules, REST client, project identity logic, and
assistant peer naming helpers. Run them with Bun from the OpenCode config directory:

```bash
# All four test files
bun test plugins/honcho/honcho.test.ts \
         plugins/honcho/services/filter.test.ts \
         plugins/honcho/services/client.test.ts \
         plugins/honcho/services/project.test.ts
```

Or run all tests under the plugin directory:

```bash
bun test plugins/honcho/
```

The client tests mock `globalThis.fetch` and make no network calls. The project tests create
and clean up real temporary directories under `$TMPDIR` and run real `git` commands.

---

## Module layout

```
plugins/
├── honcho.ts                  # Re-exports HonchoPlugin and default from honcho/honcho.ts
└── honcho/
    ├── types.ts               # Config, Honcho v3 REST shapes, internal types
    ├── config.ts              # Loads from ~/.config/opencode/honcho.jsonc, merges defaults
    ├── honcho.ts              # Plugin entry point: hooks + 8 tools
    ├── honcho.test.ts         # Unit tests for assistant peer naming + metadata helpers
    └── services/
        ├── logger.ts          # Append-only file logger → ~/.local/share/opencode/honcho.log
        ├── filter.ts          # Deterministic content filter
        ├── client.ts          # HonchoClient: SDK-based Honcho v3 REST client
        ├── project.ts         # Session identity (git hash or local state file)
        ├── state.ts           # In-memory dedup and context-injection tracking
        ├── cache.ts           # Context cache with compaction-driven invalidation
        ├── context.ts         # Formats context string for prompt injection
        ├── filter.test.ts     # Unit tests for filter rules
        ├── client.test.ts     # Unit tests for REST client (fetch-mocked)
        └── project.test.ts    # Unit tests for session identity resolution
```

---

## Known limitations and caveats

- **Plugin registration unconfirmed.** The `plugin` field in `opencode.json` currently lists
  only the NPM package `opencode-mermaid-renderer`. How OpenCode loads local TypeScript plugins
  under `plugins/` is not yet confirmed. Check OpenCode's plugin documentation.

- **In-memory dedup only.** The uploaded-message tracking (`HonchoSessionState`) is in memory
  per plugin invocation. On OpenCode restart, the plugin re-bootstraps known message IDs by
  reading the Honcho session message list. If a message ID cannot be found in Honcho's response,
  it may be re-uploaded.

- **Singleton SDK client.** `getHonchoClient` returns a module-level singleton. Changing
  `workspace` or `apiBaseUrl` at runtime requires a process restart.

- **No log rotation.** `~/.local/share/opencode/honcho.log` grows indefinitely.

// ─── Plugin configuration ─────────────────────────────────────────────────────

export interface HonchoContextConfig {
  /** Max characters of Honcho context to inject into prompt (default: 4000) */
  maxLength: number;
  /** Inject context on first message of each session (default: true) */
  injectOnFirstMessage: boolean;
  /** Enable optional peer-chat synthesis in auto-injected context (default: false) */
  enablePeerChat: boolean;
}

export interface HonchoFilterConfig {
  /** Strip fenced code blocks longer than maxCodeBlockLines (default: true) */
  stripCodeBlocks: boolean;
  /** Keep fenced code blocks up to this many content lines; strip longer ones (default: 10) */
  maxCodeBlockLines: number;
  /** Drop lines longer than this from uploaded content (default: 500) */
  maxLineLength: number;
  /** Max total characters to upload per message (default: 8000) */
  maxContentLength: number;
  /** Min characters required to bother uploading; skip if shorter (default: 20) */
  minContentLength: number;
}

export interface HonchoPluginConfig {
  /**
   * Enable the plugin. Must be set to true explicitly; defaults false.
   * Requires `workspace` to also be set.
   */
  enabled: boolean;
  /** Honcho API key (also reads HONCHO_API_KEY env var) */
  apiKey?: string;
  /** Honcho API base URL (default: https://api.honcho.dev) */
  apiBaseUrl: string;
  /** Honcho workspace ID used with Honcho's get-or-create workspace endpoint */
  workspace: string;
  /** Name used for the user peer in Honcho (default: opencode-user) */
  peerName: string;
  /** Name used for the shared assistant peer in Honcho (default: agent) */
  assistantName: string;
  /** Context injection settings */
  context: HonchoContextConfig;
  /** Upload content filtering settings */
  filter: HonchoFilterConfig;
}

export interface HonchoSession {
  id: string;
  workspace_id: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface HonchoMessage {
  id: string;
  session_id: string;
  content: string;
  /** v3: messages are authored by a peer, not a role string */
  peer_id?: string;
  /** Kept for migration / compatibility reads */
  role?: "user" | "assistant" | "system";
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface HonchoConclusion {
  id: string;
  workspace_id: string;
  session_id?: string;
  /** The peer that was observed / is the subject of the conclusion */
  observed_id?: string;
  /** The peer that made the observation */
  observer_id?: string;
  content: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

// ─── Honcho v3 context response shapes ───────────────────────────────────────

/** Response from GET /v3/workspaces/{ws}/peers/{pid}/context */
export interface HonchoPeerContextResponse {
  peer_id: string;
  target_id: string;
  representation?: string | null;
  peer_card?: string[] | null;
}

export interface HonchoInjectedContextSections {
  userPeerCard: string[];
  userPeerSynthesis: string | null;
  assistantPeerCard: string[];
  assistantPeerSynthesis: string | null;
  sessionSummary: string | null;
}

// ─── Internal plugin types ────────────────────────────────────────────────────

/** Resolved Honcho entity IDs after initialization. */
export interface HonchoRuntimeIdentity {
  honchoSessionId: string;
  userPeerId: string;
  assistantPeerId: string;
}

/** Persisted in `.opencode/honcho-session.json` for non-git projects. */
export interface HonchoLocalSessionState {
  sessionName: string;
  createdAt: string;
  directory: string;
}

/** Result of resolving the project-level Honcho session identity. */
export interface HonchoProjectIdentity {
  /** Stable session name to use in Honcho */
  sessionName: string;
  /** Whether this came from git or a local state file */
  kind: "git" | "local";
  /** Full path to local state file; present for "local" kind and migration scenarios */
  localStateFile?: string;
  /** Old session name to migrate from; only set during git migration */
  migrationSource?: string;
}

import type { Plugin, PluginInput } from "@opencode-ai/plugin";
import type { Part } from "@opencode-ai/sdk";
import { tool } from "@opencode-ai/plugin";
import { realpathSync, statSync } from "node:fs";
import { basename, extname, isAbsolute, relative, resolve } from "node:path";

import { CONFIG, isConfigured } from "./config.js";
import { log } from "./services/logger.js";
import { getHonchoClient } from "./services/client.js";
import { filterContent } from "./services/filter.js";
import { resolveProjectIdentity, deleteLocalStateFile } from "./services/project.js";
import { HonchoSessionState } from "./services/state.js";
import { HonchoContextCache } from "./services/cache.js";
import {
  formatHonchoContextForPrompt,
  formatStructuredHonchoContext,
} from "./services/context.js";
import type {
  HonchoMessage,
  HonchoProjectIdentity,
  HonchoRuntimeIdentity,
} from "./types.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  const ts = Date.now().toString(16);
  const rnd = Math.random().toString(36).slice(2, 12);
  return `${prefix}_${ts}${rnd}`;
}

function isNonSyntheticTextPart(part: Part): part is Part & { type: "text"; text: string } {
  return (
    part.type === "text" &&
    typeof (part as { text?: unknown }).text === "string" &&
    (part as { synthetic?: unknown }).synthetic !== true
  );
}

function getStoredOpencodeMessageId(message: HonchoMessage): string | null {
  const messageId = message.metadata?.["opencode_message_id"];
  return typeof messageId === "string" && messageId.trim() ? messageId : null;
}

function getStoredOpencodeRole(
  message: HonchoMessage,
  userPeerId: string
): "user" | "assistant" | null {
  const storedRole = message.metadata?.["opencode_role"];
  if (storedRole === "user" || storedRole === "assistant") {
    return storedRole;
  }
  if (
    typeof message.metadata?.["assistant_peer"] === "string" ||
    typeof message.metadata?.["agent_name"] === "string" ||
    typeof message.metadata?.["model_id"] === "string"
  ) {
    return "assistant";
  }
  if (message.peer_id) {
    return message.peer_id === userPeerId ? "user" : "assistant";
  }
  return null;
}

export function resolveAssistantPeerName(name: string | undefined): string {
  const trimmed = (name ?? "").trim();
  const sanitized = trimmed
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return sanitized || "agent";
}

function buildUserMessageMetadata(
  opencodeMessageId: string,
  opencodeSessionId: string
): Record<string, unknown> {
  return {
    opencode_message_id: opencodeMessageId,
    opencode_session_id: opencodeSessionId,
    opencode_role: "user",
    tool: "opencode",
  };
}

export function buildAssistantMessageMetadata(
  opencodeMessageId: string,
  opencodeSessionId: string,
  agentName?: string,
  modelId?: string
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {
    opencode_message_id: opencodeMessageId,
    opencode_session_id: opencodeSessionId,
    opencode_role: "assistant",
    tool: "opencode",
  };

  if (agentName) {
    metadata["agent_name"] = agentName;
  }
  if (modelId) {
    metadata["model_id"] = modelId;
  }

  return metadata;
}

export function describeInitFailure(error: unknown): string {
  const value = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  return value.trim() || "Unknown Honcho initialization error";
}

export function nextInitFailureNotificationState(
  previousErrorKey: string | null,
  outcome: { ok: true } | { ok: false; error: unknown }
): { errorKey: string | null; shouldNotify: boolean } {
  if (outcome.ok) {
    return { errorKey: null, shouldNotify: false };
  }

  const errorKey = describeInitFailure(outcome.error);
  return {
    errorKey,
    shouldNotify: previousErrorKey !== errorKey,
  };
}

function shortenPath(path: string): string {
  return path.replace(/^\/home\/[^/]+/, "~").replace(/^\/Users\/[^/]+/, "~");
}

type ToastVariant = "info" | "success" | "warning" | "error";

function showToast(
  ctx: PluginInput,
  title: string,
  message: string,
  variant: ToastVariant = "info",
  duration = 3000
): void {
  try {
    const tui = (ctx.client as {
      tui?: {
        showToast: (params: {
          body: { title: string; message: string; variant: ToastVariant; duration: number };
        }) => Promise<unknown>;
      };
    }).tui;

    tui
      ?.showToast({
        body: { title, message, variant, duration },
      })
      .catch((error) => {
        log("[honcho] toast notification failed", { error: String(error) });
      });
  } catch (error) {
    log("[honcho] notification dispatch failed", { error: String(error) });
  }
}

function notifyInitializationFailure(ctx: PluginInput, directory: string, error: unknown): void {
  const message = `${shortenPath(directory)} — ${describeInitFailure(error)}`;
  showToast(ctx, "Honcho initialization failed", message, "error", 6000);
}

function guessContentType(filePath: string): string {
  switch (extname(filePath).toLowerCase()) {
    case ".txt":
      return "text/plain";
    case ".md":
      return "text/markdown";
    case ".json":
    case ".jsonc":
      return "application/json";
    case ".js":
    case ".mjs":
    case ".cjs":
      return "text/javascript";
    case ".ts":
    case ".tsx":
      return "text/typescript";
    case ".jsx":
      return "text/jsx";
    case ".py":
      return "text/x-python";
    case ".sh":
      return "application/x-sh";
    case ".yml":
    case ".yaml":
      return "application/yaml";
    case ".xml":
      return "application/xml";
    case ".csv":
      return "text/csv";
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const BLOCKED_UPLOAD_EXTENSIONS = new Set([".key", ".p12", ".pem", ".pfx"]);
const BLOCKED_UPLOAD_FILENAMES = new Set([
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "id_rsa",
]);

function formatMiB(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} MiB`;
}

function assertUploadPathAllowed(resolvedPath: string): void {
  const filename = basename(resolvedPath).toLowerCase();
  const extension = extname(filename);

  if (filename === ".env" || filename.startsWith(".env.")) {
    throw new Error("Refusing to upload .env files to Honcho");
  }

  if (BLOCKED_UPLOAD_EXTENSIONS.has(extension)) {
    throw new Error(`Refusing to upload secret-like file type: ${extension}`);
  }

  if (BLOCKED_UPLOAD_FILENAMES.has(filename)) {
    throw new Error(`Refusing to upload secret-like file: ${filename}`);
  }
}

function resolveUploadPath(directory: string, requestedPath: string): string {
  const realProjectRoot = realpathSync(directory);
  const candidatePath = isAbsolute(requestedPath)
    ? requestedPath
    : resolve(realProjectRoot, requestedPath);
  let realTargetPath: string;

  try {
    realTargetPath = realpathSync(candidatePath);
  } catch {
    throw new Error(`File path could not be resolved: ${requestedPath}`);
  }

  const relativeTargetPath = relative(realProjectRoot, realTargetPath);

  if (
    relativeTargetPath === ".." ||
    relativeTargetPath.startsWith("../") ||
    isAbsolute(relativeTargetPath)
  ) {
    throw new Error("File path must stay within the current project directory");
  }

  return realTargetPath;
}

const NOT_CONFIGURED_MSG =
  "Honcho plugin is not active. " +
  'Create ~/.config/opencode/honcho.jsonc with at minimum: { "enabled": true, "workspace": "<id>" }';

// ─── Minimal OpenCode client typing (mirrors CompactionContext pattern) ────────

interface OcMessageInfo {
  id: string;
  role: string;
  sessionID: string;
  parentID?: string;
  modelID?: string;
  summary?: boolean;
  finish?: string | boolean;
}

interface OcSessionInfo {
  id?: string;
  parentID?: string;
}

interface OcSessionMessage {
  info: OcMessageInfo;
  parts?: Array<{ type: string; text?: string }>;
}

type OcSessionClient = {
  session: {
    get: (params: {
      path: { id: string };
      query: { directory: string };
    }) => Promise<{ data?: OcSessionInfo }>;
    messages: (params: {
      path: { id: string };
      query: { directory: string };
    }) => Promise<{
      data?: OcSessionMessage[];
    }>;
  };
};

type ChatMessageRole = "user" | "assistant";

interface PendingChatUpload {
  honchoSessionId: string;
  opencodeSessionId: string;
  opencodeMessageId: string;
  peerId: string;
  role: ChatMessageRole;
  content: string;
  metadata: Record<string, unknown>;
}

interface ChatMessageAttribution {
  peerId: string;
  role: ChatMessageRole;
  metadata: Record<string, unknown>;
}

function getOcSessionMessages(
  response: Awaited<ReturnType<OcSessionClient["session"]["messages"]>>
): OcSessionMessage[] | null {
  if (Array.isArray(response.data)) {
    return response.data;
  }

  return Array.isArray(response as unknown) ? (response as unknown as OcSessionMessage[]) : null;
}

export function isChildSessionSeedPrompt(
  parentId: string | null,
  opencodeMessageId: string,
  sessionMessages: OcSessionMessage[] | null | undefined
): boolean {
  if (!parentId || !Array.isArray(sessionMessages)) {
    return false;
  }

  if (sessionMessages.length === 0) {
    return true;
  }

  let hasCurrentMessage = false;

  for (const message of sessionMessages) {
    const messageId = message?.info?.id;
    if (typeof messageId !== "string" || !messageId.trim()) {
      return false;
    }
    if (messageId === opencodeMessageId) {
      hasCurrentMessage = true;
      continue;
    }
    return false;
  }

  return hasCurrentMessage;
}

// ─── Plugin entry point ───────────────────────────────────────────────────────

export const HonchoPlugin: Plugin = async (ctx: PluginInput) => {
  const { directory } = ctx;

  log("[honcho] plugin init", { directory, configured: isConfigured() });

  if (!isConfigured()) {
    log("[honcho] plugin disabled (enabled=false or workspace not set)");
  }

  // ── These are set up only when configured ─────────────────────────────────
  const client = isConfigured()
    ? getHonchoClient(CONFIG.workspace, CONFIG.apiBaseUrl, CONFIG.apiKey)
    : null;

  const sessionState = new HonchoSessionState();
  const contextCache = new HonchoContextCache();

  // Resolve project identity (cheap git call, always safe to run)
  const projectIdentity = isConfigured()
    ? await resolveProjectIdentity(directory)
    : ({ sessionName: "", kind: "local" as const });

  if (isConfigured()) {
    log("[honcho] project identity resolved", {
      sessionName: projectIdentity.sessionName,
      kind: projectIdentity.kind,
      hasMigration: !!(projectIdentity as HonchoProjectIdentity).migrationSource,
    });
  }

  // ── Runtime assistant provenance tracking ─────────────────────────────────
  // Kept per OpenCode session so parallel chats do not share one mutable value.
  const assistantAgentNames = new Map<string, string>();
  const assistantAgentByParent = new Map<string, string>();

  // ── Pending-upload guard for assistant messages ───────────────────────────
  // Prevents concurrent session.idle events from uploading the same message twice.
  // Format: "${honchoSessionId}:${opencodeMsgId}"
  const pendingAsstUploads = new Set<string>();

  // ── Pending user upload retry queue ───────────────────────────────────────
  // Failed chat.message uploads stay in-memory and are retried on the next
  // chat.message / session.idle for the same OpenCode session.
  const pendingChatUploads = new Map<string, PendingChatUpload>();
  const pendingUserUploadAttempts = new Set<string>();

  // ── Child-session seed prompt attribution cache ───────────────────────────
  const sessionParentIds = new Map<string, string | null>();
  const resolvedChildSessionSeeds = new Set<string>();
  const childSessionSeedPromptMessageIds = new Map<string, string>();

  // ── Lazy Honcho entity initialization ─────────────────────────────────────

  let initResult: HonchoRuntimeIdentity | null = null;
  let initPromise: Promise<HonchoRuntimeIdentity> | null = null;
  let lastInitFailureNotificationKey: string | null = null;

  function resetInitFailureNotificationState(): void {
    lastInitFailureNotificationKey = nextInitFailureNotificationState(
      lastInitFailureNotificationKey,
      { ok: true }
    ).errorKey;
  }

  function notifyInitFailureIfNeeded(err: unknown, source: string): void {
    const nextState = nextInitFailureNotificationState(lastInitFailureNotificationKey, {
      ok: false,
      error: err,
    });
    lastInitFailureNotificationKey = nextState.errorKey;

    if (!nextState.shouldNotify) {
      log("[honcho] initialization failure notification suppressed", {
        source,
        error: nextState.errorKey,
      });
      return;
    }

    log("[honcho] initialization failure notification triggered", {
      source,
      error: nextState.errorKey,
    });
    notifyInitializationFailure(ctx, directory, err);
  }

  async function bootstrapUploadedMessageIds(
    honchoSessionId: string,
    userPeerId: string
  ): Promise<void> {
    try {
      const messages = await client!.listMessages(honchoSessionId);
      let bootstrappedUser = 0;
      let bootstrappedAssistant = 0;

      for (const message of messages) {
        const opencodeMessageId = getStoredOpencodeMessageId(message);
        if (!opencodeMessageId) continue;

        const role = getStoredOpencodeRole(message, userPeerId);
        if (role === "user") {
          sessionState.markUserMsgUploaded(honchoSessionId, opencodeMessageId);
          bootstrappedUser++;
        } else if (role === "assistant") {
          sessionState.markAsstMsgUploaded(honchoSessionId, opencodeMessageId);
          bootstrappedAssistant++;
        }
      }

      log("[honcho] bootstrapped uploaded message ids", {
        honchoSessionId,
        user: bootstrappedUser,
        assistant: bootstrappedAssistant,
      });
    } catch (err) {
      log("[honcho] bootstrap uploaded ids failed (non-fatal)", {
        error: String(err),
      });
    }
  }

  async function ensureInitialized(): Promise<HonchoRuntimeIdentity> {
    if (!client) throw new Error("Honcho plugin not configured");
    if (initResult) return initResult;
    if (initPromise) return initPromise;

    initPromise = (async (): Promise<HonchoRuntimeIdentity> => {
      log("[honcho] initializing Honcho entities");
      const identity = projectIdentity as HonchoProjectIdentity;
      const assistantPeerName = resolveAssistantPeerName(CONFIG.assistantName);
      await client.ensureWorkspace();

      const [userPeerId, assistantPeerId, honchoSessionId] = await Promise.all([
        client.ensurePeer(CONFIG.peerName),
        client.ensurePeer(assistantPeerName),
        client.ensureSession(identity.sessionName),
      ]);

      await Promise.all([
        client.addSessionPeer(honchoSessionId, userPeerId),
        client.addSessionPeer(honchoSessionId, assistantPeerId),
      ]);

      if (identity.migrationSource && identity.localStateFile) {
        await performMigration(identity, honchoSessionId, userPeerId);
      }

      await bootstrapUploadedMessageIds(honchoSessionId, userPeerId);

      initResult = { honchoSessionId, userPeerId, assistantPeerId };
      resetInitFailureNotificationState();
      log("[honcho] initialization complete", {
        honchoSessionId,
        userPeerId,
        assistantPeerId,
        assistantPeerName,
      });
      return initResult;
    })();

    try {
      return await initPromise;
    } catch (err) {
      initPromise = null; // Allow retry on next call
      notifyInitFailureIfNeeded(err, "ensureInitialized");
      throw err;
    }
  }

  // ── Migration helper ──────────────────────────────────────────────────────

  /**
   * Copy messages from an old local session into the new git-derived session.
   * The local state file is deleted ONLY if migration completes without error.
   * On partial failure or error the file is preserved so the next startup can retry.
   */
  async function performMigration(
    identity: HonchoProjectIdentity,
    newSessionId: string,
    userPeerId: string
  ): Promise<void> {
    log("[honcho] performing session migration", {
      from: identity.migrationSource,
      to: identity.sessionName,
    });

    let migrationComplete = false;

    try {
      const oldSessionId = await client!.findSession(identity.migrationSource!);
      if (!oldSessionId) {
        log("[honcho] migration source session not found; keeping local state file", {
          migrationSource: identity.migrationSource,
        });
      } else {
        const oldMessages = await client!.listMessages(oldSessionId);
        const existingMessages = await client!.listMessages(newSessionId);
        const migratedKeys = new Set(
          existingMessages
            .map((message) => {
              const sourceSession = message.metadata?.["migrated_from_session"];
              const sourceMessage = message.metadata?.["migrated_from_message_id"];
              return typeof sourceSession === "string" && typeof sourceMessage === "string"
                ? `${sourceSession}:${sourceMessage}`
                : null;
            })
            .filter((key): key is string => key !== null)
        );

        log("[honcho] migrating messages", { count: oldMessages.length });
        let allSucceeded = true;
        for (const msg of oldMessages) {
          const migrationKey = `${identity.migrationSource}:${msg.id}`;
          if (migratedKeys.has(migrationKey)) {
            continue;
          }

          // Use the message's stored peer_id if available, otherwise fall back to userPeer
          const peerId = msg.peer_id ?? userPeerId;
          const result = await client!.createMessage(newSessionId, msg.content, peerId, {
            ...msg.metadata,
            migrated_from_session: identity.migrationSource,
            migrated_from_message_id: msg.id,
          });
          if (result === null) {
            allSucceeded = false;
          } else {
            migratedKeys.add(migrationKey);
          }
        }
        migrationComplete = allSucceeded;
      }
    } catch (err) {
      log("[honcho] migration error (best-effort, continuing)", { error: String(err) });
      // migrationComplete stays false – keep the state file for retry
    }

    if (migrationComplete && identity.localStateFile) {
      deleteLocalStateFile(identity.localStateFile);
    } else if (!migrationComplete) {
      log("[honcho] migration incomplete – keeping local state file for retry", {
        localStateFile: identity.localStateFile,
      });
    }
  }

  // ── Context helpers ───────────────────────────────────────────────────────

  async function fetchAndCacheContext(identity: HonchoRuntimeIdentity): Promise<string | null> {
    log("[honcho] fetching Honcho injection context", { honchoSessionId: identity.honchoSessionId });
    const assistantPeerName = resolveAssistantPeerName(CONFIG.assistantName);
    const sections = await client!.buildInjectedContext({
      sessionId: identity.honchoSessionId,
      userPeerId: identity.userPeerId,
      userPeerName: CONFIG.peerName,
      assistantPeerId: identity.assistantPeerId,
      assistantPeerName: assistantPeerName,
      enablePeerChat: CONFIG.context.enablePeerChat,
    });
    const context = sections ? formatStructuredHonchoContext(sections) : null;
    contextCache.set(identity.honchoSessionId, context);
    log("[honcho] context fetched", { hasContent: !!context });
    return context;
  }

  async function getContext(identity: HonchoRuntimeIdentity): Promise<string | null> {
    const cached = contextCache.get(identity.honchoSessionId);
    if (cached !== undefined) return cached;
    return fetchAndCacheContext(identity);
  }

  function getMessageUploadKey(honchoSessionId: string, opencodeMessageId: string): string {
    return `${honchoSessionId}:${opencodeMessageId}`;
  }

  function getParentAgentKey(opencodeSessionId: string, parentMessageId: string): string {
    return `${opencodeSessionId}:${parentMessageId}`;
  }

  function queueUserUpload(upload: PendingChatUpload): string {
    const key = getMessageUploadKey(upload.honchoSessionId, upload.opencodeMessageId);
    pendingChatUploads.set(key, upload);
    return key;
  }

  function isChatMessageUploaded(
    honchoSessionId: string,
    opencodeMessageId: string,
    role: ChatMessageRole
  ): boolean {
    return role === "assistant"
      ? sessionState.isAsstMsgUploaded(honchoSessionId, opencodeMessageId)
      : sessionState.isUserMsgUploaded(honchoSessionId, opencodeMessageId);
  }

  function markChatMessageUploaded(
    honchoSessionId: string,
    opencodeMessageId: string,
    role: ChatMessageRole
  ): void {
    if (role === "assistant") {
      sessionState.markAsstMsgUploaded(honchoSessionId, opencodeMessageId);
      return;
    }

    sessionState.markUserMsgUploaded(honchoSessionId, opencodeMessageId);
  }

  async function getSessionParentId(opencodeSessionId: string): Promise<string | null> {
    const cached = sessionParentIds.get(opencodeSessionId);
    if (cached !== undefined) {
      return cached;
    }

    const oc = ctx.client as unknown as OcSessionClient;
    const { data } = await oc.session.get({
      path: { id: opencodeSessionId },
      query: { directory },
    });
    const parentId = typeof data?.parentID === "string" && data.parentID.trim() ? data.parentID : null;
    sessionParentIds.set(opencodeSessionId, parentId);
    return parentId;
  }

  async function shouldAttributeChildSeedPromptToAssistant(
    opencodeSessionId: string,
    opencodeMessageId: string
  ): Promise<boolean> {
    const cachedSeedPromptMessageId = childSessionSeedPromptMessageIds.get(opencodeSessionId);
    if (cachedSeedPromptMessageId) {
      return cachedSeedPromptMessageId === opencodeMessageId;
    }

    if (resolvedChildSessionSeeds.has(opencodeSessionId)) {
      return false;
    }

    try {
      const parentId = await getSessionParentId(opencodeSessionId);
      if (!parentId) {
        return false;
      }

      const oc = ctx.client as unknown as OcSessionClient;
      const response = await oc.session.messages({
        path: { id: opencodeSessionId },
        query: { directory },
      });
      if (!isChildSessionSeedPrompt(parentId, opencodeMessageId, getOcSessionMessages(response))) {
        resolvedChildSessionSeeds.add(opencodeSessionId);
        return false;
      }

      childSessionSeedPromptMessageIds.set(opencodeSessionId, opencodeMessageId);
      resolvedChildSessionSeeds.add(opencodeSessionId);
      return true;
    } catch (err) {
      log("[honcho] child-session seed prompt detection failed; falling back to user attribution", {
        sessionID: opencodeSessionId,
        msgId: opencodeMessageId,
        error: String(err),
      });
      return false;
    }
  }

  async function resolveChatMessageAttribution(
    identity: HonchoRuntimeIdentity,
    input: {
      sessionID: string;
      agent?: string;
      model?: { providerID: string; modelID: string };
    },
    opencodeMessageId: string
  ): Promise<ChatMessageAttribution> {
    const isAssistantSeedPrompt = await shouldAttributeChildSeedPromptToAssistant(
      input.sessionID,
      opencodeMessageId
    );

    if (isAssistantSeedPrompt) {
      return {
        peerId: identity.assistantPeerId,
        role: "assistant",
        metadata: buildAssistantMessageMetadata(
          opencodeMessageId,
          input.sessionID,
          input.agent,
          input.model?.modelID
        ),
      };
    }

    return {
      peerId: identity.userPeerId,
      role: "user",
      metadata: buildUserMessageMetadata(opencodeMessageId, input.sessionID),
    };
  }

  async function attemptQueuedUserUpload(
    key: string,
    upload: PendingChatUpload,
    source: "chat.message" | "chat.message.retry" | "session.idle"
  ): Promise<void> {
    if (isChatMessageUploaded(upload.honchoSessionId, upload.opencodeMessageId, upload.role)) {
      pendingChatUploads.delete(key);
      return;
    }
    if (pendingUserUploadAttempts.has(key)) {
      return;
    }

    pendingUserUploadAttempts.add(key);
    try {
      const newId = await client!.createMessage(
        upload.honchoSessionId,
        upload.content,
        upload.peerId,
        upload.metadata
      );
      if (newId !== null) {
        markChatMessageUploaded(upload.honchoSessionId, upload.opencodeMessageId, upload.role);
        pendingChatUploads.delete(key);
        log("[honcho] chat.message prompt uploaded", {
          msgId: upload.opencodeMessageId,
          role: upload.role,
          source,
        });
      } else {
        log("[honcho] chat.message prompt upload returned null (queued for retry)", {
          msgId: upload.opencodeMessageId,
          role: upload.role,
          source,
        });
      }
    } catch (err) {
      log("[honcho] chat.message prompt upload failed", {
        msgId: upload.opencodeMessageId,
        role: upload.role,
        source,
        error: String(err),
      });
    } finally {
      pendingUserUploadAttempts.delete(key);
    }
  }

  async function flushPendingUserUploads(
    honchoSessionId: string,
    opencodeSessionId: string,
    source: "chat.message.retry" | "session.idle"
  ): Promise<void> {
    const queued = Array.from(pendingChatUploads.entries()).filter(
      ([, upload]) =>
        upload.honchoSessionId === honchoSessionId &&
        upload.opencodeSessionId === opencodeSessionId
    );

    if (queued.length === 0) return;

    log("[honcho] retrying queued user uploads", {
      sessionID: opencodeSessionId,
      count: queued.length,
      source,
    });

    for (const [key, upload] of queued) {
      await attemptQueuedUserUpload(key, upload, source);
    }
  }

  // ── chat.message hook ─────────────────────────────────────────────────────

  async function handleChatMessage(
    input: {
      sessionID: string;
      agent?: string;
      model?: { providerID: string; modelID: string };
    },
    output: {
      message: { id: string; sessionID: string };
      parts: Part[];
    }
  ): Promise<void> {
    if (!isConfigured()) return;

    // Track the most recently seen agent name per OpenCode session
    if (input.agent) {
      assistantAgentNames.set(input.sessionID, input.agent);
      assistantAgentByParent.set(getParentAgentKey(input.sessionID, output.message.id), input.agent);
    }

    try {
      const identity = await ensureInitialized();

      await flushPendingUserUploads(
        identity.honchoSessionId,
        input.sessionID,
        "chat.message.retry"
      );

      // Extract text from user message parts
      const textParts = output.parts.filter(isNonSyntheticTextPart);
      const userText = textParts.map((p) => p.text).join("\n");

      // Upload chat.message prompt (fire-and-forget, deduped)
      const msgId = output.message.id;
      if (userText.trim()) {
        const attribution = await resolveChatMessageAttribution(identity, input, msgId);
        if (!isChatMessageUploaded(identity.honchoSessionId, msgId, attribution.role)) {
          const filtered = filterContent(userText, CONFIG.filter);
          if (filtered.filtered) {
            const queuedUpload: PendingChatUpload = {
              honchoSessionId: identity.honchoSessionId,
              opencodeSessionId: input.sessionID,
              opencodeMessageId: msgId,
              peerId: attribution.peerId,
              role: attribution.role,
              content: filtered.filtered,
              metadata: attribution.metadata,
            };
            const uploadKey = queueUserUpload(queuedUpload);
            void attemptQueuedUserUpload(uploadKey, queuedUpload, "chat.message");
          } else {
            log("[honcho] chat.message prompt filtered out", {
              msgId,
              role: attribution.role,
              reason: filtered.reason,
            });
            // Mark handled so we don't retry on the next hook invocation.
            markChatMessageUploaded(identity.honchoSessionId, msgId, attribution.role);
          }
        }
      }

      // Inject Honcho context on first message per session (or after compaction)
      if (
        CONFIG.context.injectOnFirstMessage &&
        !sessionState.isContextInjected(input.sessionID)
      ) {
        try {
          const context = await getContext(identity);
          sessionState.markContextInjected(input.sessionID);

          if (context && context.trim()) {
            const formatted = formatHonchoContextForPrompt(context, CONFIG.context.maxLength);
            if (formatted) {
              const contextPart = {
                id: generateId("prt"),
                sessionID: input.sessionID,
                messageID: msgId,
                type: "text" as const,
                text: formatted,
                synthetic: true,
              } as Part;
              output.parts.unshift(contextPart);
              log("[honcho] context injected", { length: formatted.length });
            }
          } else {
            log("[honcho] no Honcho context available yet for this session");
          }
        } catch (err) {
          log("[honcho] context fetch failed; will retry on next message", {
            error: String(err),
          });
        }
      }
    } catch (err) {
      log("[honcho] chat.message error", { error: String(err) });
    }
  }

  // ── event hook ────────────────────────────────────────────────────────────

  async function handleEvent(input: {
    event: { type: string; properties?: unknown };
  }): Promise<void> {
    if (!isConfigured()) return;

    const { event } = input;
    const props = event.properties as Record<string, unknown> | undefined;

    if (event.type === "session.deleted") {
      const sessionInfo = props?.["info"] as { id?: string } | undefined;
      const deletedId = sessionInfo?.id;
      if (deletedId) {
        sessionState.deleteSession(deletedId);
        assistantAgentNames.delete(deletedId);
        sessionParentIds.delete(deletedId);
        resolvedChildSessionSeeds.delete(deletedId);
        childSessionSeedPromptMessageIds.delete(deletedId);
        for (const key of assistantAgentByParent.keys()) {
          if (key.startsWith(`${deletedId}:`)) {
            assistantAgentByParent.delete(key);
          }
        }
        for (const [key, upload] of pendingChatUploads.entries()) {
          if (upload.opencodeSessionId === deletedId) {
            pendingChatUploads.delete(key);
            pendingUserUploadAttempts.delete(key);
          }
        }
        if (initResult) contextCache.clear(initResult.honchoSessionId);
      }
      return;
    }

    // Detect compaction via dedicated session.compacted event (preferred)
    if (event.type === "session.compacted") {
      const compactedSessionId = props?.["sessionID"] as string | undefined;
      if (compactedSessionId) {
        log("[honcho] session.compacted event – invalidating context cache", {
          sessionID: compactedSessionId,
        });
        try {
          const identity = await ensureInitialized();
          contextCache.invalidate(identity.honchoSessionId);
          sessionState.clearContextInjected(compactedSessionId);
        } catch (err) {
          log("[honcho] session.compacted handler error", { error: String(err) });
        }
      }
      return;
    }

    // Detect compaction: assistant summary message finished (fallback for older OpenCode versions)
    if (event.type === "message.updated") {
      const info = props?.["info"] as OcMessageInfo | undefined;
      if (!info?.sessionID) return;

      if (info.role === "assistant" && info.summary === true && info.finish) {
        log("[honcho] compaction detected via message.updated – invalidating context cache", {
          sessionID: info.sessionID,
        });
        try {
          const identity = await ensureInitialized();
          contextCache.invalidate(identity.honchoSessionId);
          // Clear injection flag so next message gets fresh context
          sessionState.clearContextInjected(info.sessionID);
        } catch (err) {
          log("[honcho] compaction handler error", { error: String(err) });
        }
      }
      return;
    }

    // Capture assistant messages when the session goes idle
    if (event.type === "session.idle") {
      const sessionID = props?.["sessionID"] as string | undefined;
      if (sessionID) {
        try {
          const identity = await ensureInitialized();
          await flushPendingUserUploads(identity.honchoSessionId, sessionID, "session.idle");
        } catch (err) {
          log("[honcho] session.idle user upload retry failed", { error: String(err) });
        }
        await captureAssistantMessages(sessionID);
      }
    }
  }

  // ── Assistant message capture ─────────────────────────────────────────────

  async function captureAssistantMessages(opencodeSessionId: string): Promise<void> {
    try {
      const identity = await ensureInitialized();
      const oc = ctx.client as unknown as OcSessionClient;

      const resp = await oc.session.messages({
        path: { id: opencodeSessionId },
        query: { directory },
      });

      const messages = getOcSessionMessages(resp);
      if (!messages) {
        log("[honcho] session.messages returned malformed data during assistant capture", {
          sessionID: opencodeSessionId,
        });
        return;
      }

      const candidates = messages.filter(
        (m) =>
          m.info.role === "assistant" &&
          m.info.finish &&
          !m.info.summary &&
          !sessionState.isAsstMsgUploaded(identity.honchoSessionId, m.info.id)
      );

      if (candidates.length === 0) return;
      log("[honcho] capturing assistant messages", { count: candidates.length });

      for (const msg of candidates) {
        const uploadKey = `${identity.honchoSessionId}:${msg.info.id}`;

        // Concurrent session.idle guard: skip if upload already in flight
        if (pendingAsstUploads.has(uploadKey)) {
          log("[honcho] assistant message upload already in progress, skipping", {
            msgId: msg.info.id,
          });
          continue;
        }
        pendingAsstUploads.add(uploadKey);

        try {
          const textParts = (msg.parts ?? []).filter((p) => p.type === "text" && p.text);
          const content = textParts.map((p) => p.text!).join("\n");
          if (!content.trim()) continue;

          const filtered = filterContent(content, CONFIG.filter);
          if (!filtered.filtered) {
            log("[honcho] assistant message filtered out", {
              reason: filtered.reason,
              msgId: msg.info.id,
            });
            sessionState.markAsstMsgUploaded(identity.honchoSessionId, msg.info.id);
            continue;
          }

          const resolvedAgentName = msg.info.parentID
            ? assistantAgentByParent.get(getParentAgentKey(opencodeSessionId, msg.info.parentID))
            : undefined;

          const agentName = resolvedAgentName ?? assistantAgentNames.get(opencodeSessionId);
          const metadata = buildAssistantMessageMetadata(
            msg.info.id,
            opencodeSessionId,
            agentName,
            msg.info.modelID
          );

          const newId = await client!.createMessage(
            identity.honchoSessionId,
            filtered.filtered,
            identity.assistantPeerId,
            metadata
          );

          if (newId !== null) {
            // Mark success AFTER confirmed upload – never eagerly
            sessionState.markAsstMsgUploaded(identity.honchoSessionId, msg.info.id);
            log("[honcho] assistant message uploaded", {
              msgId: msg.info.id,
              assistantPeerId: identity.assistantPeerId,
            });
          } else {
            log("[honcho] assistant message upload returned null (will retry next idle)", {
              msgId: msg.info.id,
            });
          }
        } catch (err) {
          log("[honcho] assistant message upload failed", {
            msgId: msg.info.id,
            error: String(err),
          });
          // Do NOT mark as uploaded so the next session.idle can retry
        } finally {
          pendingAsstUploads.delete(uploadKey);
        }
      }
    } catch (err) {
      log("[honcho] captureAssistantMessages error", { error: String(err) });
    }
  }

  // ── Return unified hooks (all tools always registered) ────────────────────

  if (isConfigured()) {
    void ensureInitialized().catch((err) => {
      log("[honcho] startup initialization check failed", { error: String(err) });
    });
  }

  return {
    "chat.message": handleChatMessage as Parameters<Plugin>[0] extends never
      ? never
      : (
          input: Parameters<typeof handleChatMessage>[0],
          output: Parameters<typeof handleChatMessage>[1]
        ) => Promise<void>,

    event: handleEvent as (input: { event: { type: string; properties?: unknown } }) => Promise<void>,

    tool: {
      honcho_search: tool({
        description:
          "Semantically search the Honcho memory system for raw context relevant to a query. " +
          "Best for exact recall or supporting evidence from past conversations in the current " +
          "project's Honcho session; prefer honcho_chat for synthesized answers about user " +
          "preferences, patterns, or working style.",
        args: {
          query: tool.schema
            .string()
            .describe(
              "What you want to find in past conversation history. Use honcho_search for raw " +
              "recall/evidence; prefer honcho_chat for summarized preference or working-style questions."
            ),
        },
        async execute({ query }) {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const result = await client!.sessionSearch(identity.honchoSessionId, query);
            if (!result) {
              return JSON.stringify({ success: false, error: "No results found or search unavailable" });
            }
            return JSON.stringify({ success: true, query, content: result });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_chat: tool({
        description:
          "Query Honcho's reasoning about the current user based on past conversation history. " +
          "Returns Honcho's derived understanding of the user's preferences, patterns, and goals. " +
          "Prefer this over honcho_search when you want a synthesized answer about the user's " +
          "preferences, patterns, goals, or working style. Sends a single question to the user " +
          "peer's dialectic reasoning endpoint.",
        args: {
          query: tool.schema
            .string()
            .describe(
              "A question to ask Honcho about the user when you want a synthesized answer, " +
              "e.g. 'What does this user prefer for code style?'"
            ),
        },
        async execute({ query }) {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const result = await client!.peerChat(identity.userPeerId, query);
            if (!result) {
              return JSON.stringify({ success: false, error: "Peer chat returned no response" });
            }
            return JSON.stringify({ success: true, query, response: result });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_peer_context: tool({
        description:
          "Return the current user peer context from Honcho, including any derived representation " +
          "and peer-card-backed context available for this peer.",
        args: {},
        async execute() {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const content = await client!.getPeerContext(identity.userPeerId);
            if (content === null || content === undefined || !content.trim()) {
              return JSON.stringify({
                success: true,
                content: null,
                message: "No peer context available yet for the current user peer.",
              });
            }
            return JSON.stringify({ success: true, content });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_peer_card: tool({
        description:
          "Return the current user peer card from Honcho as a structured list of derived facts or " +
          "traits associated with this peer.",
        args: {},
        async execute() {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const items = (await client!.getPeerCard(identity.userPeerId)) ?? [];
            return JSON.stringify({
              success: true,
              count: items.length,
              items,
              message:
                items.length > 0
                  ? "Peer card retrieved successfully."
                  : "Peer card is empty for the current user peer.",
            });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_summaries: tool({
        description:
          "Return the short and long Honcho summaries for the current project session, if they " +
          "exist.",
        args: {},
        async execute() {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const summaries = await client!.getSessionSummaries(identity.honchoSessionId);
            return JSON.stringify({
              success: true,
              shortSummary: summaries.shortSummary,
              longSummary: summaries.longSummary,
              message:
                summaries.shortSummary || summaries.longSummary
                  ? "Session summaries retrieved successfully."
                  : "No session summaries are available yet.",
            });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_upload_file: tool({
        description:
          "Upload a local file into the current Honcho session for the current user peer. Relative " +
          "paths are resolved from the current project directory.",
        args: {
          filePath: tool.schema
            .string()
            .describe("Path to the file to upload. Relative paths resolve from the current project directory."),
          contentType: tool.schema
            .string()
            .optional()
            .describe("Optional MIME type override. Defaults to a small extension-based guess."),
        },
        async execute({ filePath, contentType }) {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const resolvedPath = resolveUploadPath(directory, filePath);
            assertUploadPathAllowed(resolvedPath);
            const stats = statSync(resolvedPath);
            if (!stats.isFile()) {
              throw new Error("Upload path must reference a regular file");
            }
            if (stats.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
              throw new Error(
                `File exceeds upload limit of ${formatMiB(MAX_UPLOAD_FILE_SIZE_BYTES)} (${MAX_UPLOAD_FILE_SIZE_BYTES} bytes)`
              );
            }
            const filename = basename(resolvedPath);
            const effectiveContentType = contentType?.trim() || guessContentType(resolvedPath);
            const uploaded = await client!.uploadFile(identity.honchoSessionId, identity.userPeerId, {
              path: resolvedPath,
              filename,
              contentType: effectiveContentType,
              metadata: {
                tool: "opencode",
                upload_source: "honcho_upload_file",
              },
            });

            return JSON.stringify({
              success: uploaded.length > 0,
              filePath,
              resolvedPath,
              filename,
              contentType: effectiveContentType,
              uploadedCount: uploaded.length,
              messageIds: uploaded.map((message) => message.id),
              message:
                uploaded.length > 0
                  ? "File uploaded to Honcho successfully."
                  : "File upload returned no messages.",
            });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_remember: tool({
        description:
          "Explicitly store a semantic conclusion or important insight in Honcho for future " +
          "reference. Use this to record key facts, decisions, or patterns that should persist " +
          "across sessions.",
        args: {
          content: tool.schema
            .string()
            .describe("The conclusion or insight to store in Honcho"),
        },
        async execute({ content }) {
          if (!isConfigured()) return JSON.stringify({ success: false, error: NOT_CONFIGURED_MSG });
          try {
            const identity = await ensureInitialized();
            const filtered = filterContent(content, CONFIG.filter);
            if (!filtered.filtered) {
              return JSON.stringify({
                success: false,
                error: `Content filtered out (${filtered.reason}). Provide a plain-text description.`,
              });
            }
            // observed_id = user peer (subject); observer_id = user peer (observer)
            // session_id anchors the conclusion to the current project session
            const id = await client!.createConclusion(
              filtered.filtered,
              identity.userPeerId,
              identity.userPeerId,
              identity.honchoSessionId
            );
            if (!id) {
              return JSON.stringify({ success: false, error: "Failed to store conclusion in Honcho" });
            }
            return JSON.stringify({ success: true, id, message: "Conclusion stored in Honcho" });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),

      honcho_status: tool({
        description:
          "Show the current Honcho plugin status: configuration, project session identity, " +
          "workspace, peer IDs, and whether the plugin has been initialised this session.",
        args: {},
        async execute() {
          if (!isConfigured()) {
            return JSON.stringify({
              configured: false,
              message: NOT_CONFIGURED_MSG,
              configLookup: [
                "~/.config/opencode/honcho.jsonc",
                "~/.config/opencode/honcho.json",
              ],
            });
          }
          try {
            return JSON.stringify({
              configured: true,
              enabled: CONFIG.enabled,
              workspace: CONFIG.workspace,
              apiBaseUrl: CONFIG.apiBaseUrl,
              peerName: CONFIG.peerName,
              assistantName: CONFIG.assistantName,
              effectiveAssistantPeerName: resolveAssistantPeerName(CONFIG.assistantName),
              trackedAssistantMetadataSessions: assistantAgentNames.size,
              trackedAssistantMetadataParents: assistantAgentByParent.size,
              projectIdentity: {
                sessionName: (projectIdentity as HonchoProjectIdentity).sessionName,
                kind: (projectIdentity as HonchoProjectIdentity).kind,
              },
              runtimeIdentity: initResult
                ? {
                  initialized: true,
                  honchoSessionId: initResult.honchoSessionId,
                  userPeerId: initResult.userPeerId,
                  assistantPeerId: initResult.assistantPeerId,
                }
                : { initialized: false },
              filterConfig: CONFIG.filter,
              contextConfig: CONFIG.context,
            });
          } catch (err) {
            return JSON.stringify({ success: false, error: String(err) });
          }
        },
      }),
    },
  };
};

export default HonchoPlugin;

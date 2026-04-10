import { readFileSync } from "node:fs";
import { basename } from "node:path";

import {
  ConflictError,
  Honcho,
  type ConclusionResponse,
  type PageResponse,
} from "@honcho-ai/sdk";

import { log } from "./logger.js";
import type {
  HonchoConclusion,
  HonchoInjectedContextSections,
  HonchoMessage,
  HonchoPeerContextResponse,
  HonchoSession,
} from "../types.js";

const TIMEOUT_MS = 15_000;
const LIST_PAGE_SIZE = 100;
export const DEFAULT_SESSION_SEARCH_LIMIT = 10;

function normalizeBaseURL(baseUrl: string): string {
  return baseUrl.replace(/\/(?:v2|v3)\/?$/, "").replace(/\/$/, "");
}

function toItems<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (!raw || typeof raw !== "object") return [];

  const record = raw as Record<string, unknown>;
  if (Array.isArray(record.items)) return record.items as T[];
  if (Array.isArray(record.data)) return record.data as T[];
  if (Array.isArray(record.results)) return record.results as T[];
  return [];
}

function formatPeerContext(data: HonchoPeerContextResponse): string | null {
  const parts: string[] = [];

  if (data.representation?.trim()) {
    parts.push(`Representation:\n${data.representation.trim()}`);
  }

  if (Array.isArray(data.peer_card) && data.peer_card.length > 0) {
    parts.push(`Peer Card:\n${data.peer_card.map((item) => `- ${item}`).join("\n")}`);
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}

function normalizePeerCard(card: string[] | null): string[] {
  return Array.isArray(card)
    ? card.map((item) => item.trim()).filter(Boolean)
    : [];
}

function selectSessionSummary(summaries: {
  shortSummary: string | null;
  longSummary: string | null;
} | null): string | null {
  const preferred = summaries?.longSummary?.trim() || summaries?.shortSummary?.trim();
  return preferred || null;
}

function buildUserPeerSynthesisPrompt(userPeerName: string): string {
  return `Summarize what you know about ${userPeerName}. Focus on preferences, current projects, and working style.`;
}

function buildAssistantPeerSynthesisPrompt(assistantPeerName: string): string {
  return `What has ${assistantPeerName} been working on recently? Summarize recent activities relevant to the current work.`;
}

export type HonchoPeerChatReasoningLevel = "minimal" | "low" | "medium" | "high" | "max";

export interface HonchoPeerChatOptions {
  session?: string;
  reasoningLevel?: HonchoPeerChatReasoningLevel;
  target?: string;
}

function toHonchoSession(session: {
  id: string;
  workspaceId: string;
  metadata?: Record<string, unknown>;
}): HonchoSession {
  return {
    id: session.id,
    workspace_id: session.workspaceId,
    metadata: session.metadata,
  };
}

function toHonchoMessage(message: {
  id: string;
  content: string;
  peerId: string;
  sessionId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}): HonchoMessage {
  return {
    id: message.id,
    session_id: message.sessionId,
    content: message.content,
    peer_id: message.peerId,
    metadata: message.metadata,
    created_at: message.createdAt,
  };
}

function toHonchoMessages(
  messages: Array<{
    id: string;
    content: string;
    peerId: string;
    sessionId: string;
    metadata: Record<string, unknown>;
    createdAt: string;
  }>
): HonchoMessage[] {
  return messages.map(toHonchoMessage);
}

function toHonchoConclusion(
  workspaceId: string,
  conclusion: ConclusionResponse
): HonchoConclusion {
  return {
    id: conclusion.id,
    workspace_id: workspaceId,
    session_id: conclusion.session_id ?? undefined,
    observed_id: conclusion.observed_id,
    observer_id: conclusion.observer_id,
    content: conclusion.content,
    created_at: conclusion.created_at,
  };
}

export class HonchoClient {
  private readonly baseUrl: string;
  private readonly workspaceId: string;
  private readonly apiKey?: string;
  private readonly client: Honcho;

  constructor(workspaceId: string, baseUrl: string, apiKey?: string) {
    this.workspaceId = workspaceId;
    this.baseUrl = normalizeBaseURL(baseUrl);
    this.apiKey = apiKey;
    this.client = new Honcho({
      apiKey,
      workspaceId,
      baseURL: this.baseUrl,
      timeout: TIMEOUT_MS,
    });
  }

  private ws(suffix = ""): string {
    return `/v3/workspaces/${encodeURIComponent(this.workspaceId)}${suffix}`;
  }

  private async collectWorkspacePages<T>(
    fetchPage: (page: number, size: number) => Promise<PageResponse<T>>
  ): Promise<T[]> {
    const items: T[] = [];
    let page = 1;

    while (true) {
      const response = await fetchPage(page, LIST_PAGE_SIZE);
      items.push(...response.items);

      if (response.items.length === 0 || response.page >= response.pages) {
        return items;
      }

      page = response.page + 1;
    }
  }

  async ensureWorkspace(): Promise<string> {
    log("[honcho/client] ensureWorkspace", { workspaceId: this.workspaceId });
    try {
      const workspace = await this.client.http.post<{ id: string }>("/v3/workspaces", {
        body: { id: this.workspaceId },
      });
      return workspace.id;
    } catch (err) {
      log("[honcho/client] ensureWorkspace: error", { error: String(err) });
      throw err;
    }
  }

  async ensurePeer(id: string): Promise<string> {
    log("[honcho/client] ensurePeer", { id });
    try {
      const peer = await this.client.http.post<{ id: string }>(this.ws("/peers"), {
        body: { id },
      });
      log("[honcho/client] ensurePeer: ready", { id: peer.id });
      return peer.id;
    } catch (err) {
      log("[honcho/client] ensurePeer: error", { error: String(err) });
      throw err;
    }
  }

  async ensureSession(id: string): Promise<string> {
    log("[honcho/client] ensureSession", { id });
    try {
      const session = await this.client.http.post<{ id: string }>(this.ws("/sessions"), {
        body: { id },
      });
      log("[honcho/client] ensureSession: ready", { id: session.id });
      return session.id;
    } catch (err) {
      log("[honcho/client] ensureSession: error", { error: String(err) });
      throw err;
    }
  }

  async listSessions(): Promise<HonchoSession[]> {
    try {
      const page = await this.client.sessions();
      const sessions = await page.toArray();
      return sessions.map(toHonchoSession);
    } catch (err) {
      log("[honcho/client] listSessions: error", { error: String(err) });
      throw err;
    }
  }

  async findSession(id: string): Promise<string | null> {
    const sessions = await this.listSessions();
    return sessions.find((session) => session.id === id)?.id ?? null;
  }

  async addSessionPeer(sessionId: string, peerId: string): Promise<void> {
    log("[honcho/client] addSessionPeer", { sessionId, peerId });
    try {
      const session = await this.client.session(sessionId);
      await session.addPeers([
        peerId,
        {
          observeMe: true,
          observeOthers: true,
        },
      ]);
    } catch (err) {
      if (err instanceof ConflictError || (typeof err === "object" && err !== null && "status" in err && err.status === 409)) {
        log("[honcho/client] addSessionPeer: already associated", { sessionId, peerId });
        return;
      }

      log("[honcho/client] addSessionPeer: error (non-fatal)", { error: String(err) });
    }
  }

  async createMessage(
    sessionId: string,
    content: string,
    peerId: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    log("[honcho/client] createMessage", {
      sessionId,
      peerId,
      contentLength: content.length,
    });

    try {
      const [session, peer] = await Promise.all([
        this.client.session(sessionId),
        this.client.peer(peerId),
      ]);
      const messages = await session.addMessages(peer.message(content, { metadata }));
      return messages[0]?.id ?? null;
    } catch (err) {
      log("[honcho/client] createMessage: error", { error: String(err) });
      return null;
    }
  }

  async listMessages(sessionId: string): Promise<HonchoMessage[]> {
    log("[honcho/client] listMessages", { sessionId });
    try {
      const session = await this.client.session(sessionId);
      const page = await session.messages();
      const messages = await page.toArray();
      return toHonchoMessages(messages);
    } catch (err) {
      log("[honcho/client] listMessages: error", { error: String(err) });
      throw err;
    }
  }

  async getPeerContext(peerId: string): Promise<string | null> {
    log("[honcho/client] getPeerContext", { peerId });
    try {
      const peer = await this.client.peer(peerId);
      const context = await peer.context();
      return formatPeerContext({
        peer_id: peer.id,
        target_id: peer.id,
        representation: context.representation,
        peer_card: context.peerCard,
      });
    } catch (err) {
      log("[honcho/client] getPeerContext: error", { error: String(err) });
      throw err;
    }
  }

  async getPeerCard(peerId: string): Promise<string[] | null> {
    log("[honcho/client] getPeerCard", { peerId });
    try {
      const peer = await this.client.peer(peerId);
      return await peer.getCard();
    } catch (err) {
      log("[honcho/client] getPeerCard: error", { error: String(err) });
      throw err;
    }
  }

  async getSessionSummaries(sessionId: string): Promise<{
    shortSummary: string | null;
    longSummary: string | null;
  }> {
    log("[honcho/client] getSessionSummaries", { sessionId });
    try {
      const session = await this.client.session(sessionId);
      const summaries = await session.summaries();
      return {
        shortSummary: summaries.shortSummary?.content ?? null,
        longSummary: summaries.longSummary?.content ?? null,
      };
    } catch (err) {
      log("[honcho/client] getSessionSummaries: error", { error: String(err) });
      throw err;
    }
  }

  async buildInjectedContext(params: {
    sessionId: string;
    userPeerId: string;
    userPeerName: string;
    assistantPeerId: string;
    assistantPeerName: string;
    enablePeerChat: boolean;
  }): Promise<HonchoInjectedContextSections | null> {
    const safe = async <T>(
      section: string,
      load: () => Promise<T>
    ): Promise<{ value: T | null; failed: boolean }> => {
      try {
        return {
          value: await load(),
          failed: false,
        };
      } catch (err) {
        log("[honcho/client] buildInjectedContext: section failed", {
          section,
          error: String(err),
        });
        return {
          value: null,
          failed: true,
        };
      }
    };

    const [userPeerCard, userPeerSynthesis, assistantPeerCard, assistantPeerSynthesis, summaries] = await Promise.all([
      safe("userPeerCard", async () => normalizePeerCard(await this.getPeerCard(params.userPeerId))),
       params.enablePeerChat
        ? safe(
          "userPeerSynthesis",
          async () => await this.peerChat(
              params.userPeerId,
             buildUserPeerSynthesisPrompt(params.userPeerName)
            )
        )
        : Promise.resolve(null),
      safe(
        "assistantPeerCard",
        async () => normalizePeerCard(await this.getPeerCard(params.assistantPeerId))
      ),
       params.enablePeerChat
         ? safe(
           "assistantPeerSynthesis",
           async () => await this.peerChat(
             params.assistantPeerId,
             buildAssistantPeerSynthesisPrompt(params.assistantPeerName),
             { session: params.sessionId }
           )
         )
         : Promise.resolve(null),
      safe("sessionSummary", async () => await this.getSessionSummaries(params.sessionId)),
    ]);

    if (userPeerCard.failed && assistantPeerCard.failed && summaries.failed) {
      throw new Error("Failed to load all core Honcho injection sections");
    }

    const context: HonchoInjectedContextSections = {
      userPeerCard: userPeerCard.value ?? [],
      userPeerSynthesis: userPeerSynthesis?.value?.trim() || null,
      assistantPeerCard: assistantPeerCard.value ?? [],
      assistantPeerSynthesis: assistantPeerSynthesis?.value?.trim() || null,
      sessionSummary: selectSessionSummary(summaries.value),
    };

    const hasContent =
      context.userPeerCard.length > 0 ||
      !!context.userPeerSynthesis ||
      context.assistantPeerCard.length > 0 ||
      !!context.assistantPeerSynthesis ||
      !!context.sessionSummary;

    return hasContent ? context : null;
  }

  async sessionSearch(
    sessionId: string,
    query: string,
    limit = DEFAULT_SESSION_SEARCH_LIMIT
  ): Promise<string | null> {
    log("[honcho/client] sessionSearch", { sessionId, query: query.slice(0, 50), limit });
    try {
      const session = await this.client.session(sessionId);
      const messages = await session.search(query, { limit });
      const content = messages
        .map((message) => message.content.trim())
        .filter(Boolean)
        .join("\n\n");
      return content || null;
    } catch (err) {
      log("[honcho/client] sessionSearch: error", { error: String(err) });
      return null;
    }
  }

  async peerChat(
    peerId: string,
    query: string,
    options?: HonchoPeerChatOptions
  ): Promise<string | null> {
    log("[honcho/client] peerChat", { peerId, queryLength: query.length });
    try {
      const peer = await this.client.peer(peerId);
      return await peer.chat(query, options);
    } catch (err) {
      log("[honcho/client] peerChat: error", { error: String(err) });
      return null;
    }
  }

  async uploadFile(
    sessionId: string,
    peerId: string,
    file: {
      path: string;
      contentType: string;
      filename?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<HonchoMessage[]> {
    log("[honcho/client] uploadFile", {
      sessionId,
      peerId,
      path: file.path,
      contentType: file.contentType,
    });

    try {
      const [session, peer] = await Promise.all([
        this.client.session(sessionId),
        this.client.peer(peerId),
      ]);
      const uploaded = await session.uploadFile(
        {
          filename: file.filename ?? basename(file.path),
          content: readFileSync(file.path),
          content_type: file.contentType,
        },
        peer,
        {
          metadata: file.metadata,
        }
      );

      return toHonchoMessages(uploaded);
    } catch (err) {
      log("[honcho/client] uploadFile: error", { error: String(err) });
      throw err;
    }
  }

  async createConclusion(
    content: string,
    observedId: string,
    observerId: string,
    sessionId: string
  ): Promise<string | null> {
    log("[honcho/client] createConclusion", { contentLength: content.length, observedId });
    try {
      const observer = await this.client.peer(observerId);
      const scope = observerId === observedId
        ? observer.conclusions
        : observer.conclusionsOf(observedId);
      const conclusions = await scope.create({ content, sessionId });
      return conclusions[0]?.id ?? null;
    } catch (err) {
      log("[honcho/client] createConclusion: error", { error: String(err) });
      return null;
    }
  }

  async queryConclusions(query: string): Promise<HonchoConclusion[]> {
    log("[honcho/client] queryConclusions", { query: query.slice(0, 50) });
    try {
      const data = await this.client.http.post<
        ConclusionResponse[] | { items?: ConclusionResponse[]; data?: ConclusionResponse[]; results?: ConclusionResponse[] }
      >(this.ws("/conclusions/query"), {
        body: { query },
      });

      return toItems<ConclusionResponse>(data).map((conclusion) =>
        toHonchoConclusion(this.workspaceId, conclusion)
      );
    } catch (err) {
      log("[honcho/client] queryConclusions: error", { error: String(err) });
      return [];
    }
  }

  async listConclusions(): Promise<HonchoConclusion[]> {
    log("[honcho/client] listConclusions");
    try {
      const conclusions = await this.collectWorkspacePages<ConclusionResponse>((page, size) =>
        this.client.http.post<PageResponse<ConclusionResponse>>(this.ws("/conclusions/list"), {
          body: {},
          query: { page, size },
        })
      );

      return conclusions.map((conclusion) =>
        toHonchoConclusion(this.workspaceId, conclusion)
      );
    } catch (err) {
      log("[honcho/client] listConclusions: error", { error: String(err) });
      throw err;
    }
  }
}

let _instance: HonchoClient | null = null;

export function getHonchoClient(
  workspaceId: string,
  baseUrl: string,
  apiKey?: string
): HonchoClient {
  if (!_instance) {
    _instance = new HonchoClient(workspaceId, baseUrl, apiKey);
  }
  return _instance;
}

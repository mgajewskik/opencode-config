// @ts-nocheck
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { HonchoClient } from "./client.js";

type FetchCall = {
  url: string;
  init: RequestInit;
};

const originalFetch = globalThis.fetch;

describe("HonchoClient", () => {
  let calls: FetchCall[];
  let responses: Response[];
  let tmpPaths: string[];

  beforeEach(() => {
    calls = [];
    responses = [];
    tmpPaths = [];

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      calls.push({ url, init: init ?? {} });

      return responses.shift() ?? jsonResponse({});
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const path of tmpPaths) {
      rmSync(path, { force: true, recursive: true });
    }
  });

  function createClient() {
    return new HonchoClient("workspace-1", "https://honcho.example/v3/", "test-key");
  }

  function createTempFile(name: string, content: string) {
    const dir = `/tmp/honcho-client-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    mkdirSync(dir, { recursive: true });
    tmpPaths.push(dir);
    const path = join(dir, name);
    writeFileSync(path, content);
    return path;
  }

  function jsonResponse(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
      ...init,
    });
  }

  function pageResponse(items: unknown[]) {
    return jsonResponse({
      items,
      page: 1,
      pages: 1,
      size: items.length || 1,
      total: items.length,
    });
  }

  function apiMessage(id: string, content: string) {
    return {
      id,
      content,
      peer_id: "peer-1",
      session_id: "session-1",
      workspace_id: "workspace-1",
      metadata: {},
      created_at: "2026-03-28T10:00:00.000Z",
    };
  }

  function apiConclusion(id: string, content: string) {
    return {
      id,
      content,
      observer_id: "observer-1",
      observed_id: "observed-1",
      session_id: "session-1",
      created_at: "2026-03-28T10:00:00.000Z",
    };
  }

  function pathOf(call: FetchCall) {
    return new URL(call.url).pathname;
  }

  function bodyOf(call: FetchCall) {
    const body = call.init.body;
    return body ? JSON.parse(body as string) : undefined;
  }

  function parsedBody(index = 0) {
    return bodyOf(calls[index]!);
  }

  function callsForPath(path: string) {
    return calls.filter((call) => pathOf(call) === path);
  }

  function lastCallForPath(path: string) {
    const matches = callsForPath(path);
    expect(matches.length).toBeGreaterThan(0);
    return matches.at(-1)!;
  }

  it("posts workspace creation to the v3 workspace endpoint", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));

    const workspaceId = await createClient().ensureWorkspace();

    expect(workspaceId).toBe("workspace-1");
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://honcho.example/v3/workspaces");
    expect(calls[0]!.init.method).toBe("POST");
    expect(parsedBody()).toEqual({ id: "workspace-1" });
  });

  it("posts stable ids when ensuring peers and sessions", async () => {
    responses.push(jsonResponse({ id: "peer-1" }));
    responses.push(jsonResponse({ id: "session-1" }));

    const client = createClient();
    const peerId = await client.ensurePeer("peer-1");
    const sessionId = await client.ensureSession("session-1");

    expect(peerId).toBe("peer-1");
    expect(sessionId).toBe("session-1");
    expect(calls).toHaveLength(2);
    expect(calls[0]!.url).toBe("https://honcho.example/v3/workspaces/workspace-1/peers");
    expect(calls[0]!.init.method).toBe("POST");
    expect(parsedBody(0)).toEqual({ id: "peer-1" });
    expect(calls[1]!.url).toBe("https://honcho.example/v3/workspaces/workspace-1/sessions");
    expect(calls[1]!.init.method).toBe("POST");
    expect(parsedBody(1)).toEqual({ id: "session-1" });
  });

  it("adds a session peer with the expected peer-map body", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({}));

    await createClient().addSessionPeer("session-1", "peer-1");

    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const peerCall = lastCallForPath(
      "/v3/workspaces/workspace-1/sessions/session-1/peers",
    );
    expect(peerCall.init.method).toBe("POST");
    expect(bodyOf(peerCall)).toEqual({
      "peer-1": { observe_me: true, observe_others: true },
    });
  });

  it("creates session messages through the SDK wrapper", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse([
      { ...apiMessage("message-1", "hello world"), metadata: { source: "chat" } },
    ]));

    const messageId = await createClient().createMessage(
      "session-1",
      "hello world",
      "peer-1",
      { source: "chat" },
    );

    expect(messageId).toBe("message-1");
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const messageCall = lastCallForPath(
      "/v3/workspaces/workspace-1/sessions/session-1/messages",
    );
    expect(messageCall.init.method).toBe("POST");
    expect(bodyOf(messageCall)).toEqual({
      messages: [
        {
          content: "hello world",
          peer_id: "peer-1",
          metadata: { source: "chat" },
        },
      ],
    });
  });

  it("lists sessions, messages, and conclusions with the wrapper's stable request shapes", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(pageResponse([{ id: "session-1" }]));
    responses.push(pageResponse([apiMessage("message-1", "hi")]));
    responses.push(pageResponse([apiConclusion("conclusion-1", "learned")]));

    const client = createClient();
    const sessions = await client.listSessions();
    const messages = await client.listMessages("session-1");
    const conclusions = await client.listConclusions();

    expect(sessions.map((item) => item.id)).toEqual(["session-1"]);
    expect(messages.map((item) => item.id)).toEqual(["message-1"]);
    expect(conclusions.map((item) => item.id)).toEqual(["conclusion-1"]);

    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const sessionsCall = lastCallForPath("/v3/workspaces/workspace-1/sessions/list");
    expect(sessionsCall.init.method).toBe("POST");
    expect(bodyOf(sessionsCall)).toEqual({});

    const messagesCall = lastCallForPath("/v3/workspaces/workspace-1/sessions/session-1/messages/list");
    expect(messagesCall.init.method).toBe("POST");
    expect(bodyOf(messagesCall)).toEqual({});

    const conclusionsCall = lastCallForPath("/v3/workspaces/workspace-1/conclusions/list");
    expect(conclusionsCall.init.method).toBe("POST");
    expect(new URL(conclusionsCall.url).searchParams.get("page")).toBe("1");
    expect(new URL(conclusionsCall.url).searchParams.get("size")).toBe("100");
    expect(bodyOf(conclusionsCall)).toEqual({});
  });

  it("joins session search results returned through the SDK", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse([
      apiMessage("message-1", "first memory"),
      { ...apiMessage("message-2", "second memory"), created_at: "2026-03-28T10:01:00.000Z" },
    ]));

    const result = await createClient().sessionSearch("session-1", "what matters?");

    expect(result).toBe("first memory\n\nsecond memory");
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const searchCall = lastCallForPath(
      "/v3/workspaces/workspace-1/sessions/session-1/search",
    );
    expect(searchCall.init.method).toBe("POST");
    expect(bodyOf(searchCall)).toEqual({ query: "what matters?", limit: 10 });
  });

  it("forwards a custom session search limit through the SDK", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse([apiMessage("message-1", "first memory")]));

    const result = await createClient().sessionSearch("session-1", "what matters?", 5);

    expect(result).toBe("first memory");

    const searchCall = lastCallForPath(
      "/v3/workspaces/workspace-1/sessions/session-1/search",
    );
    expect(searchCall.init.method).toBe("POST");
    expect(bodyOf(searchCall)).toEqual({ query: "what matters?", limit: 5 });
  });

  it("posts peer chat queries using the SDK dialectic payload", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ content: "peer answer" }));

    const reply = await createClient().peerChat("peer-1", "What should I remember?");

    expect(reply).toBe("peer answer");
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const chatCall = lastCallForPath("/v3/workspaces/workspace-1/peers/peer-1/chat");
    expect(chatCall.init.method).toBe("POST");
    expect(bodyOf(chatCall)).toEqual({
      query: "What should I remember?",
      stream: false,
    });
  });

  it("forwards optional peer chat SDK options to the dialectic payload", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ content: "peer answer" }));

    const reply = await createClient().peerChat("peer-1", "What changed?", {
      session: "session-1",
      reasoningLevel: "high",
      target: "assistant-peer",
    });

    expect(reply).toBe("peer answer");

    const chatCall = lastCallForPath("/v3/workspaces/workspace-1/peers/peer-1/chat");
    expect(chatCall.init.method).toBe("POST");
    expect(bodyOf(chatCall)).toEqual({
      query: "What changed?",
      stream: false,
      session_id: "session-1",
      reasoning_level: "high",
      target: "assistant-peer",
    });
  });

  it("gets the peer card through the SDK wrapper", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ peer_card: ["Prefers concise updates", "Uses Bun"] }));

    const peerCard = await createClient().getPeerCard("peer-1");

    expect(peerCard).toEqual(["Prefers concise updates", "Uses Bun"]);
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const cardCall = lastCallForPath("/v3/workspaces/workspace-1/peers/peer-1/card");
    expect(cardCall.init.method).toBe("GET");
  });

  it("gets short and long session summaries through the SDK wrapper", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({
      id: "session-1",
      short_summary: { content: "Short summary" },
      long_summary: { content: "Long summary" },
    }));

    const summaries = await createClient().getSessionSummaries("session-1");

    expect(summaries).toEqual({
      shortSummary: "Short summary",
      longSummary: "Long summary",
    });
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const summariesCall = lastCallForPath("/v3/workspaces/workspace-1/sessions/session-1/summaries");
    expect(summariesCall.init.method).toBe("GET");
  });

  it("builds injected context from peer cards and the long session summary without recent messages", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ peer_card: ["Prefers concise updates"] }));
    responses.push(jsonResponse({ peer_card: ["Tracks subagent work"] }));
    responses.push(jsonResponse({
      id: "session-1",
      short_summary: { content: "Short summary" },
      long_summary: { content: "Long summary" },
    }));

    const context = await createClient().buildInjectedContext({
      sessionId: "session-1",
      userPeerId: "peer-user",
      userPeerName: "mgajewskik",
      assistantPeerId: "agent",
      assistantPeerName: "agent",
      enablePeerChat: false,
    });

    expect(context).toEqual({
      userPeerCard: ["Prefers concise updates"],
      userPeerSynthesis: null,
      assistantPeerCard: ["Tracks subagent work"],
      assistantPeerSynthesis: null,
      sessionSummary: "Long summary",
    });
    expect(callsForPath("/v3/workspaces/workspace-1/sessions/session-1/context")).toHaveLength(0);
    expect(callsForPath("/v3/workspaces/workspace-1/peers/peer-user/chat")).toHaveLength(0);
    expect(callsForPath("/v3/workspaces/workspace-1/peers/agent/chat")).toHaveLength(0);
  });

  it("keeps user synthesis global and scopes assistant synthesis to the current session", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ peer_card: [] }));
    responses.push(jsonResponse({ content: "User synthesis" }));
    responses.push(jsonResponse({ peer_card: [] }));
    responses.push(jsonResponse({ content: "Assistant synthesis" }));
    responses.push(jsonResponse({
      id: "session-1",
      short_summary: { content: "Short summary" },
      long_summary: null,
    }));

    const context = await createClient().buildInjectedContext({
      sessionId: "session-1",
      userPeerId: "peer-user",
      userPeerName: "mgajewskik",
      assistantPeerId: "agent",
      assistantPeerName: "agent",
      enablePeerChat: true,
    });

    expect(context?.userPeerSynthesis).toBe("User synthesis");
    expect(context?.assistantPeerSynthesis).toBe("Assistant synthesis");
    expect(context?.sessionSummary).toBe("Short summary");

    const userChatCall = lastCallForPath("/v3/workspaces/workspace-1/peers/peer-user/chat");
    expect(bodyOf(userChatCall)).toEqual({
      query: "Summarize what you know about mgajewskik. Focus on preferences, current projects, and working style.",
      stream: false,
    });

    const assistantChatCall = lastCallForPath("/v3/workspaces/workspace-1/peers/agent/chat");
    expect(bodyOf(assistantChatCall)).toEqual({
      query: "What has agent been working on recently? Summarize recent activities relevant to the current work.",
      stream: false,
      session_id: "session-1",
    });
  });

  it("degrades gracefully when one injected-context section fails", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ peer_card: ["Prefers concise updates"] }));
    responses.push(new Response("boom", { status: 500 }));
    responses.push(jsonResponse({
      id: "session-1",
      short_summary: { content: "Short summary" },
      long_summary: null,
    }));

    const context = await createClient().buildInjectedContext({
      sessionId: "session-1",
      userPeerId: "peer-user",
      userPeerName: "mgajewskik",
      assistantPeerId: "agent",
      assistantPeerName: "agent",
      enablePeerChat: false,
    });

    expect(context).toEqual({
      userPeerCard: ["Prefers concise updates"],
      userPeerSynthesis: null,
      assistantPeerCard: [],
      assistantPeerSynthesis: null,
      sessionSummary: "Short summary",
    });
  });

  it("returns null when injected-context sections succeed but are all empty", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse({ peer_card: [] }));
    responses.push(jsonResponse({ peer_card: [] }));
    responses.push(jsonResponse({
      id: "session-1",
      short_summary: null,
      long_summary: null,
    }));

    const context = await createClient().buildInjectedContext({
      sessionId: "session-1",
      userPeerId: "peer-user",
      userPeerName: "mgajewskik",
      assistantPeerId: "agent",
      assistantPeerName: "agent",
      enablePeerChat: false,
    });

    expect(context).toBeNull();
  });

  it("throws when all core injected-context sections fail so callers can retry", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    for (let i = 0; i < 12; i += 1) {
      responses.push(new Response("boom", { status: 500 }));
    }

    await expect(createClient().buildInjectedContext({
      sessionId: "session-1",
      userPeerId: "peer-user",
      userPeerName: "mgajewskik",
      assistantPeerId: "agent",
      assistantPeerName: "agent",
      enablePeerChat: false,
    })).rejects.toThrow("Failed to load all core Honcho injection sections");
  });

  it("uploads files with multipart form data and maps returned messages", async () => {
    const filePath = createTempFile("notes.md", "# Notes\nHello Honcho\n");
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse([
      { ...apiMessage("message-1", "uploaded file"), metadata: { source: "upload" } },
    ]));

    const uploaded = await createClient().uploadFile("session-1", "peer-1", {
      path: filePath,
      contentType: "text/markdown",
      metadata: { source: "upload" },
    });

    expect(uploaded).toEqual([
      {
        id: "message-1",
        session_id: "session-1",
        content: "uploaded file",
        peer_id: "peer-1",
        metadata: { source: "upload" },
        created_at: "2026-03-28T10:00:00.000Z",
      },
    ]);
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const uploadCall = lastCallForPath("/v3/workspaces/workspace-1/sessions/session-1/messages/upload");
    expect(uploadCall.init.method).toBe("POST");
    expect(uploadCall.init.body).toBeInstanceOf(FormData);

    const body = uploadCall.init.body as FormData;
    expect(body.get("peer_id")).toBe("peer-1");
    expect(JSON.parse(body.get("metadata") as string)).toEqual({ source: "upload" });

    const file = body.get("file") as File;
    expect(file.name).toBe("notes.md");
    expect(file.type).toBe("text/markdown");
    expect(await file.text()).toBe("# Notes\nHello Honcho\n");
  });

  it("throws when peer-card, summaries, or upload requests fail", async () => {
    const filePath = createTempFile("fallback.txt", "content");

    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(new Response("boom", { status: 500 }));
    responses.push(new Response("boom", { status: 500 }));
    responses.push(new Response("boom", { status: 500 }));
    await expect(createClient().getPeerCard("peer-1")).rejects.toThrow();

    calls = [];
    responses = [];
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(new Response("boom", { status: 500 }));
    responses.push(new Response("boom", { status: 500 }));
    responses.push(new Response("boom", { status: 500 }));
    await expect(createClient().getSessionSummaries("session-1")).rejects.toThrow();

    calls = [];
    responses = [];
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(new Response("boom", { status: 500 }));
    await expect(createClient().uploadFile("session-1", "peer-1", {
      path: filePath,
      contentType: "text/plain",
    })).rejects.toThrow();
  });

  it("creates conclusions with the current SDK request payload", async () => {
    responses.push(jsonResponse({ id: "workspace-1" }));
    responses.push(jsonResponse([apiConclusion("conclusion-1", "remember this")]));

    const conclusionId = await createClient().createConclusion(
      "remember this",
      "observed-1",
      "observer-1",
      "session-1",
    );

    expect(conclusionId).toBe("conclusion-1");
    expect(callsForPath("/v3/workspaces")).toHaveLength(1);

    const conclusionCall = lastCallForPath("/v3/workspaces/workspace-1/conclusions");
    expect(conclusionCall.init.method).toBe("POST");
    expect(bodyOf(conclusionCall)).toEqual({
      conclusions: [
        {
          content: "remember this",
          observed_id: "observed-1",
          observer_id: "observer-1",
          session_id: "session-1",
        },
      ],
    });
  });
});

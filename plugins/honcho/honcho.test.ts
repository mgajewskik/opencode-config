// @ts-nocheck
import { describe, expect, it } from "bun:test";
import {
  buildAssistantMessageMetadata,
  describeInitFailure,
  isChildSessionSeedPrompt,
  nextInitFailureNotificationState,
  resolveAssistantPeerName,
} from "./honcho.js";

describe("Honcho assistant peer helpers", () => {
  it("falls back to the default shared assistant peer name", () => {
    expect(resolveAssistantPeerName(undefined)).toBe("agent");
    expect(resolveAssistantPeerName("   ")).toBe("agent");
  });

  it("sanitizes the configured assistant peer name", () => {
    expect(resolveAssistantPeerName("Agent / GPT-5.4")).toBe("Agent-GPT-5-4");
  });

  it("stores assistant provenance in metadata without provider_id", () => {
    expect(
      buildAssistantMessageMetadata(
        "msg-1",
        "session-1",
        "smart",
        "openai/gpt-5.4",
      ),
    ).toEqual({
      opencode_message_id: "msg-1",
      opencode_session_id: "session-1",
      opencode_role: "assistant",
      tool: "opencode",
      agent_name: "smart",
      model_id: "openai/gpt-5.4",
    });
  });
});

describe("Honcho initialization failure helpers", () => {
  it("describes initialization errors with a stable string", () => {
    expect(describeInitFailure(new Error("Missing API key"))).toBe("Error: Missing API key");
    expect(describeInitFailure("network down")).toBe("network down");
  });

  it("dedupes repeated failures until initialization succeeds", () => {
    const firstFailure = nextInitFailureNotificationState(null, {
      ok: false,
      error: new Error("Missing API key"),
    });
    expect(firstFailure).toEqual({
      errorKey: "Error: Missing API key",
      shouldNotify: true,
    });

    const repeatedFailure = nextInitFailureNotificationState(firstFailure.errorKey, {
      ok: false,
      error: new Error("Missing API key"),
    });
    expect(repeatedFailure).toEqual({
      errorKey: "Error: Missing API key",
      shouldNotify: false,
    });

    const reset = nextInitFailureNotificationState(repeatedFailure.errorKey, { ok: true });
    expect(reset).toEqual({ errorKey: null, shouldNotify: false });

    const failureAfterSuccess = nextInitFailureNotificationState(reset.errorKey, {
      ok: false,
      error: new Error("Missing API key"),
    });
    expect(failureAfterSuccess).toEqual({
      errorKey: "Error: Missing API key",
      shouldNotify: true,
    });
  });

  it("notifies again when the failure changes", () => {
    const firstFailure = nextInitFailureNotificationState(null, {
      ok: false,
      error: new Error("Missing API key"),
    });

    const changedFailure = nextInitFailureNotificationState(firstFailure.errorKey, {
      ok: false,
      error: new Error("Workspace not found"),
    });

    expect(changedFailure).toEqual({
      errorKey: "Error: Workspace not found",
      shouldNotify: true,
    });
  });
});

describe("Honcho child-session seed prompt attribution", () => {
  it("attributes a child session seed prompt to the assistant when no persisted history exists yet", () => {
    expect(isChildSessionSeedPrompt("parent-msg-1", "msg-1", [])).toBe(true);
  });

  it("attributes a child session seed prompt to the assistant when there is no prior history", () => {
    expect(
      isChildSessionSeedPrompt("parent-msg-1", "msg-1", [{ info: { id: "msg-1" } }]),
    ).toBe(true);
  });

  it("does not attribute a forked child session prompt to the assistant when prior history exists", () => {
    expect(
      isChildSessionSeedPrompt("parent-msg-1", "msg-2", [
        { info: { id: "msg-1" } },
        { info: { id: "msg-2" } },
      ]),
    ).toBe(false);
  });

  it("does not attribute a top-level session prompt to the assistant", () => {
    expect(isChildSessionSeedPrompt(null, "msg-1", [{ info: { id: "msg-1" } }])).toBe(false);
  });

  it("does not attribute when the current message is missing from history", () => {
    expect(isChildSessionSeedPrompt("parent-msg-1", "msg-2", [{ info: { id: "msg-1" } }])).toBe(false);
  });

  it("does not attribute when the history is malformed", () => {
    expect(isChildSessionSeedPrompt("parent-msg-1", "msg-1", [{ info: {} }])).toBe(false);
  });

  it("does not attribute when the history response is missing", () => {
    expect(isChildSessionSeedPrompt("parent-msg-1", "msg-1", null)).toBe(false);
  });
});

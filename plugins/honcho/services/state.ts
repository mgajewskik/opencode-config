/**
 * In-memory runtime state for the Honcho plugin.
 *
 * Tracks per-session context injection status and per-Honcho-session
 * upload deduplication so messages are never uploaded twice.
 * All state is in-memory only – no files written here.
 */
export class HonchoSessionState {
  /** OpenCode session IDs that have already had Honcho context injected */
  private readonly contextInjected = new Set<string>();

  /**
   * Uploaded user message IDs keyed by honchoSessionId.
   * Values are sets of OpenCode message IDs that were already uploaded.
   */
  private readonly uploadedUserMsgIds = new Map<string, Set<string>>();

  /**
   * Uploaded assistant message IDs keyed by honchoSessionId.
   * Values are sets of OpenCode message IDs that were already uploaded.
   */
  private readonly uploadedAsstMsgIds = new Map<string, Set<string>>();

  // ─── Context injection tracking ───────────────────────────────────────────

  markContextInjected(opencodeSessionId: string): void {
    this.contextInjected.add(opencodeSessionId);
  }

  isContextInjected(opencodeSessionId: string): boolean {
    return this.contextInjected.has(opencodeSessionId);
  }

  /**
   * Clear the "context injected" flag for a session.
   * Called after compaction so the next message gets fresh Honcho context.
   */
  clearContextInjected(opencodeSessionId: string): void {
    this.contextInjected.delete(opencodeSessionId);
  }

  // ─── User message dedup ───────────────────────────────────────────────────

  isUserMsgUploaded(honchoSessionId: string, opencodeMsgId: string): boolean {
    return this.uploadedUserMsgIds.get(honchoSessionId)?.has(opencodeMsgId) ?? false;
  }

  markUserMsgUploaded(honchoSessionId: string, opencodeMsgId: string): void {
    let set = this.uploadedUserMsgIds.get(honchoSessionId);
    if (!set) {
      set = new Set();
      this.uploadedUserMsgIds.set(honchoSessionId, set);
    }
    set.add(opencodeMsgId);
  }

  // ─── Assistant message dedup ──────────────────────────────────────────────

  isAsstMsgUploaded(honchoSessionId: string, opencodeMsgId: string): boolean {
    return this.uploadedAsstMsgIds.get(honchoSessionId)?.has(opencodeMsgId) ?? false;
  }

  markAsstMsgUploaded(honchoSessionId: string, opencodeMsgId: string): void {
    let set = this.uploadedAsstMsgIds.get(honchoSessionId);
    if (!set) {
      set = new Set();
      this.uploadedAsstMsgIds.set(honchoSessionId, set);
    }
    set.add(opencodeMsgId);
  }

  // ─── Session cleanup ──────────────────────────────────────────────────────

  /** Remove all tracking for an OpenCode session (called on session.deleted). */
  deleteSession(opencodeSessionId: string): void {
    this.contextInjected.delete(opencodeSessionId);
    // Note: honchoSessionId-keyed dedup maps are not cleaned here because
    // we don't maintain a reverse (opencodeSessionId → honchoSessionId) map.
    // Memory is bounded by number of distinct Honcho sessions (low).
  }
}

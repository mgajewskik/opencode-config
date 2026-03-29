/**
 * Context cache for the Honcho plugin.
 *
 * Stores Honcho-derived session context in memory.
 * Context is fetched once per session start, then marked dirty on compaction.
 * After a compaction, the next message triggers a fresh fetch.
 *
 * No timer/TTL refresh – invalidation is compaction-driven only.
 */

interface CacheEntry {
  /** null = fetched successfully but Honcho returned no context */
  context: string | null;
  /** true = entry exists but is stale (compaction happened) */
  dirty: boolean;
  fetchedAt: number;
}

export class HonchoContextCache {
  private readonly entries = new Map<string, CacheEntry>();

  /**
   * Retrieve the cached context for a Honcho session.
   *
   * Returns:
   *   undefined  → no cache entry or entry is dirty (caller should re-fetch)
   *   null       → fetched, Honcho returned nothing
   *   string     → valid cached context
   */
  get(honchoSessionId: string): string | null | undefined {
    const entry = this.entries.get(honchoSessionId);
    if (!entry || entry.dirty) return undefined;
    return entry.context;
  }

  /** Store a freshly fetched context value. */
  set(honchoSessionId: string, context: string | null): void {
    this.entries.set(honchoSessionId, {
      context,
      dirty: false,
      fetchedAt: Date.now(),
    });
  }

  /**
   * Mark the cached context as stale after a compaction event.
   * The next call to get() will return undefined, prompting a fresh fetch.
   */
  invalidate(honchoSessionId: string): void {
    const entry = this.entries.get(honchoSessionId);
    if (entry) {
      entry.dirty = true;
    } else {
      // Pre-populate a dirty entry so we know to fetch on next access
      this.entries.set(honchoSessionId, {
        context: null,
        dirty: true,
        fetchedAt: 0,
      });
    }
  }

  /** Fully remove a cache entry (e.g. on session deletion). */
  clear(honchoSessionId: string): void {
    this.entries.delete(honchoSessionId);
  }
}

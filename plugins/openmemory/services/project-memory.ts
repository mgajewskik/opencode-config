import type { MemoryItem } from "../types/index.js";

export function projectMemoryFingerprint(memory: Pick<MemoryItem, "content" | "sector" | "metadata">): string {
  const type = typeof memory.metadata?.type === "string" ? memory.metadata.type : "";
  return JSON.stringify([(memory.content || "").trim(), type, memory.sector || ""]);
}

function memoryScore(memory: Pick<MemoryItem, "score" | "salience">): number {
  return memory.score ?? memory.salience ?? 0;
}

export function mergeProjectMemories(memories: MemoryItem[], limit?: number): MemoryItem[] {
  const deduped = new Map<string, MemoryItem>();

  for (const memory of memories) {
    const key = projectMemoryFingerprint(memory);
    const existing = deduped.get(key);
    if (!existing || memoryScore(memory) > memoryScore(existing)) {
      deduped.set(key, memory);
    }
  }

  const merged = [...deduped.values()].sort((a, b) => memoryScore(b) - memoryScore(a));
  return typeof limit === "number" ? merged.slice(0, limit) : merged;
}

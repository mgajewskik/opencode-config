import type { HonchoFilterConfig } from "../types.js";

// ─── Patterns ─────────────────────────────────────────────────────────────────

const FENCED_CODE_BLOCK = /```[\s\S]*?```/g;
const ANSI_ESCAPE = /\x1b\[[0-9;]*[mGKHF]/g;

// Stack trace lines: leading whitespace + "at Something ("
const STACK_TRACE_LINE = /^\s{2,}at\s+\S+.*\(.*\)\s*$/;

// Log-prefix lines: ISO timestamp or common log date prefix at start of line
const TIMESTAMP_PREFIX = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;

// ─── Filter ───────────────────────────────────────────────────────────────────

export interface FilterResult {
  /** Filtered content, or null if nothing meaningful remains */
  filtered: string | null;
  /** Short reason string when filtered is null */
  reason?: "empty" | "too_short" | "fully_stripped";
}

function stripLongFencedCodeBlocks(text: string, maxCodeBlockLines: number): string {
  return text.replace(FENCED_CODE_BLOCK, (block) => {
    const lines = block.split("\n");
    const contentLines = Math.max(lines.length - 2, 0);
    return contentLines > maxCodeBlockLines ? "" : block;
  });
}

/**
 * Deterministically filter content for upload to Honcho.
 *
 * Rules (all deterministic, no model-generated summarization):
 * 1. Remove ANSI escape codes
 * 2. Strip fenced code blocks longer than maxCodeBlockLines when configured
 * 3. Drop stack-trace lines
 * 4. Drop lines starting with an ISO timestamp (log lines)
 * 5. Drop lines longer than maxLineLength (raw JSON / binary blobs)
 * 6. Collapse excess blank lines
 * 7. Truncate to maxContentLength
 * 8. Return null if result is below minContentLength
 */
export function filterContent(
  text: string,
  config: HonchoFilterConfig
): FilterResult {
  if (!text || !text.trim()) {
    return { filtered: null, reason: "empty" };
  }

  let result = text;

  // Step 1: strip ANSI escapes
  result = result.replace(ANSI_ESCAPE, "");

  // Step 2: strip long fenced code blocks
  if (config.stripCodeBlocks) {
    result = stripLongFencedCodeBlocks(result, config.maxCodeBlockLines);
  }

  // Steps 3-5: process lines
  const lines = result.split("\n");
  const kept: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();

    // Drop stack trace lines
    if (STACK_TRACE_LINE.test(line)) continue;

    // Drop timestamp-prefixed log lines
    if (TIMESTAMP_PREFIX.test(trimmed)) continue;

    // Drop lines exceeding max length (likely raw JSON / log dump)
    if (trimmed.length > config.maxLineLength) continue;

    kept.push(line);
  }

  result = kept.join("\n").trim();

  // Step 6: collapse 3+ consecutive blank lines to 2
  result = result.replace(/\n{3,}/g, "\n\n");

  if (!result) {
    return { filtered: null, reason: "fully_stripped" };
  }

  if (result.length < config.minContentLength) {
    return { filtered: null, reason: "too_short" };
  }

  // Step 7: truncate to maxContentLength
  if (result.length > config.maxContentLength) {
    result = result.slice(0, config.maxContentLength).trimEnd() + "\n[truncated]";
  }

  return { filtered: result };
}

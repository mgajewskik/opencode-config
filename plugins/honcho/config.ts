import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { HonchoPluginConfig } from "./types.js";

// Config is read from ~/.config/opencode/honcho.jsonc (or .json fallback).
// This is OpenCode-specific – NOT ~/.honcho/config.json.
const CONFIG_DIR = join(homedir(), ".config", "opencode");
const CONFIG_FILES = [
  join(CONFIG_DIR, "honcho.jsonc"),
  join(CONFIG_DIR, "honcho.json"),
];

// ─── Inline minimal JSONC stripper (no external deps) ────────────────────────

function stripJsoncComments(content: string): string {
  let result = "";
  let i = 0;
  let inString = false;
  let inSLC = false; // single-line comment
  let inMLC = false; // multi-line comment

  while (i < content.length) {
    const ch = content[i];
    const nx = content[i + 1];

    if (!inSLC && !inMLC) {
      if (ch === '"') {
        // Count consecutive backslashes before the quote
        let bs = 0;
        let j = i - 1;
        while (j >= 0 && content[j] === "\\") {
          bs++;
          j--;
        }
        if (bs % 2 === 0) inString = !inString;
        result += ch;
        i++;
        continue;
      }
    }

    if (inString) {
      result += ch;
      i++;
      continue;
    }

    if (!inSLC && !inMLC) {
      if (ch === "/" && nx === "/") {
        inSLC = true;
        i += 2;
        continue;
      }
      if (ch === "/" && nx === "*") {
        inMLC = true;
        i += 2;
        continue;
      }
    }

    if (inSLC) {
      if (ch === "\n") {
        inSLC = false;
        result += ch;
      }
      i++;
      continue;
    }

    if (inMLC) {
      if (ch === "*" && nx === "/") {
        inMLC = false;
        i += 2;
        continue;
      }
      if (ch === "\n") result += ch;
      i++;
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS: HonchoPluginConfig = {
  enabled: false,
  apiBaseUrl: "https://api.honcho.dev",
  workspace: "",
  peerName: "opencode-user",
  assistantName: "agent",
  context: {
    maxLength: 4000,
    injectOnFirstMessage: true,
    enablePeerChat: false,
  },
  filter: {
    stripCodeBlocks: true,
    maxCodeBlockLines: 10,
    maxLineLength: 500,
    maxContentLength: 8000,
    minContentLength: 20,
  },
};

// ─── Deep merge helper ────────────────────────────────────────────────────────

function deepMerge<T extends object>(base: T, override: Partial<T>): T {
  const result: T = { ...base };
  for (const key of Object.keys(override) as Array<keyof T>) {
    const val = override[key];
    if (val === undefined || val === null) continue;
    const baseVal = base[key];
    if (
      typeof val === "object" &&
      !Array.isArray(val) &&
      typeof baseVal === "object" &&
      baseVal !== null &&
      !Array.isArray(baseVal)
    ) {
      (result as Record<keyof T, unknown>)[key] = deepMerge(
        baseVal as object,
        val as object
      );
    } else {
      (result as Record<keyof T, unknown>)[key] = val;
    }
  }
  return result;
}

// ─── Load ─────────────────────────────────────────────────────────────────────

function loadFileConfig(): Partial<HonchoPluginConfig> {
  for (const path of CONFIG_FILES) {
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, "utf-8");
        const json = stripJsoncComments(content);
        return JSON.parse(json) as Partial<HonchoPluginConfig>;
      } catch {
        // Invalid or missing config – fall through to defaults
      }
    }
  }
  return {};
}

const rawFileConfig = loadFileConfig();
const merged = deepMerge(DEFAULTS, rawFileConfig);

export const CONFIG: HonchoPluginConfig = {
  ...merged,
  // API key: config file takes precedence; env var is the fallback
  apiKey: merged.apiKey ?? process.env["HONCHO_API_KEY"],
};

export function isConfigured(): boolean {
  return CONFIG.enabled && !!CONFIG.workspace;
}

export function getConfigFilePath(): string | null {
  for (const path of CONFIG_FILES) {
    if (existsSync(path)) return path;
  }
  return null;
}

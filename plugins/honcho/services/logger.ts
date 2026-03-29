import { appendFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const LOG_DIR = join(homedir(), ".local", "share", "opencode");
const LOG_FILE = join(LOG_DIR, "honcho.log");

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

// Append a session-start marker on plugin load
try {
  ensureLogDir();
  writeFileSync(LOG_FILE, `\n--- Honcho session started: ${new Date().toISOString()} ---\n`, {
    flag: "a",
  });
} catch {
  // If we can't write the log file, silently continue
}

export function log(message: string, data?: unknown): void {
  const ts = new Date().toISOString();
  const line = data
    ? `[${ts}] ${message}: ${JSON.stringify(data)}\n`
    : `[${ts}] ${message}\n`;
  try {
    ensureLogDir();
    appendFileSync(LOG_FILE, line);
  } catch {
    // Ignore logging errors – never crash the plugin over logs
  }
}

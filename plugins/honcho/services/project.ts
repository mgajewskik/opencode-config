import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { log } from "./logger.js";
import type { HonchoLocalSessionState, HonchoProjectIdentity } from "../types.js";

// ─── Git helpers ──────────────────────────────────────────────────────────────

async function runGit(directory: string, args: string[]): Promise<string | null> {
  try {
    const proc = Bun.spawn(["git", ...args], {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        // Prevent git environment from being inherited by subprocesses
        GIT_DIR: undefined as unknown as string,
        GIT_WORK_TREE: undefined as unknown as string,
      },
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) return null;
    const output = await new Response(proc.stdout).text();
    return output.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the first commit hash for the repository containing `directory`.
 * Returns null if not a git repo or repo has no commits yet.
 */
async function resolveFirstCommitHash(directory: string): Promise<string | null> {
  const repoRoot = await runGit(directory, ["rev-parse", "--show-toplevel"]);
  if (!repoRoot) return null;

  const output = await runGit(repoRoot, ["rev-list", "--max-parents=0", "--all"]);
  if (!output) return null;

  const roots = output
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => /^[a-f0-9]{40}$/i.test(s))
    .sort();

  return roots[0] ?? null;
}

// ─── Local state file ─────────────────────────────────────────────────────────

export function getLocalStateFilePath(directory: string): string {
  return join(directory, ".opencode", "honcho-session.json");
}

function readLocalState(directory: string): HonchoLocalSessionState | null {
  const statePath = getLocalStateFilePath(directory);
  if (!existsSync(statePath)) return null;
  try {
    const raw = readFileSync(statePath, "utf-8");
    const parsed = JSON.parse(raw) as HonchoLocalSessionState;
    if (!parsed.sessionName) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalState(directory: string, state: HonchoLocalSessionState): void {
  const stateDir = join(directory, ".opencode");
  if (!existsSync(stateDir)) {
    mkdirSync(stateDir, { recursive: true });
  }
  writeFileSync(
    getLocalStateFilePath(directory),
    JSON.stringify(state, null, 2),
    "utf-8"
  );
}

/**
 * Delete the local state file (called after successful git migration).
 * Non-fatal on failure.
 */
export function deleteLocalStateFile(stateFilePath: string): void {
  if (!existsSync(stateFilePath)) return;
  try {
    unlinkSync(stateFilePath);
    log("[honcho/project] local state file deleted", { path: stateFilePath });
  } catch (err) {
    log("[honcho/project] failed to delete local state file (non-fatal)", {
      error: String(err),
    });
  }
}

function normalizeDirectorySlug(directory: string): string {
  const resolved = resolve(directory).replace(/\\/g, "/");
  const slug = resolved
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return slug || "root";
}

function formatLocalSessionName(directory: string): string {
  const slug = normalizeDirectorySlug(directory);
  const base = `local-${slug}`;
  if (base.length <= 100) return base;

  const hash = createHash("sha1").update(resolve(directory)).digest("hex").slice(0, 12);
  const maxSlugLength = 100 - `local--${hash}`.length;
  const truncatedSlug = slug.slice(0, maxSlugLength).replace(/-+$/g, "");
  return `local-${truncatedSlug}-${hash}`;
}

// ─── Identity resolution ──────────────────────────────────────────────────────

/**
 * Resolve a stable Honcho session identity for the given directory.
 *
 * Rules:
 * - Git repo with history → sessionName = "git-{fullFirstCommitHash}"
 *   Git repos NEVER create a local state file.
 * - Non-git or no commits → sessionName from local state file
 *   (created under `directory/.opencode/honcho-session.json` if not present)
 * - Migration: if a local state file exists and we're now in a git repo →
 *   return migrationSource so the plugin can copy old messages and delete the file.
 */
export async function resolveProjectIdentity(
  directory: string
): Promise<HonchoProjectIdentity> {
  const firstCommitHash = await resolveFirstCommitHash(directory);
  const localState = readLocalState(directory);

  if (firstCommitHash) {
    // ── Git repo with commit history ──────────────────────────────────────
    const sessionName = `git-${firstCommitHash}`;

    if (localState) {
      // Migration case: old local state exists but we're now in a git repo
      log("[honcho/project] migration needed", {
        from: localState.sessionName,
        to: sessionName,
      });
      return {
        sessionName,
        kind: "git",
        localStateFile: getLocalStateFilePath(directory),
        migrationSource: localState.sessionName,
      };
    }

    // Normal git case – no state file created or needed
    return { sessionName, kind: "git" };
  }

  // ── Non-git project ───────────────────────────────────────────────────────
  if (localState) {
    return {
      sessionName: localState.sessionName,
      kind: "local",
      localStateFile: getLocalStateFilePath(directory),
    };
  }

  // Create a fresh local state using a normalized-path-derived session name
  const sessionName = formatLocalSessionName(directory);
  const state: HonchoLocalSessionState = {
    sessionName,
    createdAt: new Date().toISOString(),
    directory,
  };

  try {
    writeLocalState(directory, state);
    log("[honcho/project] created local state", { sessionName, directory });
  } catch (err) {
    log("[honcho/project] failed to write local state (non-fatal)", {
      error: String(err),
    });
  }

  return {
    sessionName,
    kind: "local",
    localStateFile: getLocalStateFilePath(directory),
  };
}

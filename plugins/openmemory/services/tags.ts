import { createHash } from "node:crypto";
import { execSync } from "node:child_process";

import { CONFIG } from "../config.js";
import type { MemoryScopeContext } from "../types/index.js";

export interface LegacyProjectSource {
  projectId: string;
  label: string;
  path?: string;
}

export interface ProjectScopeResolution {
  userId: string;
  userScope: MemoryScopeContext;
  projectScope: MemoryScopeContext;
  projectId: string;
  projectKind: "git-root" | "path";
  tags: { user: string; project: string };
  repoRoot?: string;
  commonDir?: string;
  legacySources: LegacyProjectSource[];
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}

async function runGit(directory: string, args: string[]): Promise<string | null> {
  try {
    const proc = Bun.spawn(["git", ...args], {
      cwd: directory,
      stdout: "pipe",
      stderr: "pipe",
      env: { ...process.env, GIT_DIR: undefined, GIT_WORK_TREE: undefined },
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      return null;
    }

    const output = await new Response(proc.stdout).text();
    const trimmed = output.trim();
    return trimmed || null;
  } catch {
    return null;
  }
}

async function resolveRootCommitId(repoRoot: string): Promise<string | null> {
  const output = await runGit(repoRoot, ["rev-list", "--max-parents=0", "--all"]);
  if (!output) return null;

  const roots = output
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => /^[a-f0-9]{40}$/i.test(value))
    .sort();

  return roots[0] || null;
}

function parseWorktreePaths(porcelain: string | null): string[] {
  if (!porcelain) return [];

  return porcelain
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length).trim())
    .filter(Boolean);
}

export function getGitEmail(): string | null {
  try {
    const email = execSync("git config user.email", { encoding: "utf-8" }).trim();
    return email || null;
  } catch {
    return null;
  }
}

export function getUserId(): string {
  const email = getGitEmail();
  if (email) {
    return sha256(email);
  }
  const fallback = process.env.USER || process.env.USERNAME || "anonymous";
  return sha256(fallback);
}

export function getUserTag(): string {
  return `${CONFIG.scopePrefix}_user_${getUserId()}`;
}

export function getLegacyProjectId(directory: string): string {
  return sha256(directory);
}

export function getProjectTag(projectId: string): string {
  return `${CONFIG.scopePrefix}_project_${projectId}`;
}

function makeLegacySource(pathValue: string, label: string): LegacyProjectSource {
  return {
    projectId: getLegacyProjectId(pathValue),
    label,
    path: pathValue,
  };
}

function dedupeLegacySources(sources: LegacyProjectSource[]): LegacyProjectSource[] {
  const deduped = new Map<string, LegacyProjectSource>();

  for (const source of sources) {
    if (!deduped.has(source.projectId)) {
      deduped.set(source.projectId, source);
    }
  }

  return [...deduped.values()];
}

async function discoverLegacySources(directory: string, repoRoot: string): Promise<LegacyProjectSource[]> {
  const sources: LegacyProjectSource[] = [makeLegacySource(directory, "current directory")];

  if (repoRoot !== directory) {
    sources.push(makeLegacySource(repoRoot, "repository root"));
  }

  const worktreePaths = parseWorktreePaths(await runGit(repoRoot, ["worktree", "list", "--porcelain"]));
  for (const worktreePath of worktreePaths) {
    sources.push(makeLegacySource(worktreePath, `worktree:${worktreePath}`));
  }

  return dedupeLegacySources(sources);
}

export async function resolveProjectScope(directory: string): Promise<ProjectScopeResolution> {
  const userId = getUserId();
  const userScope: MemoryScopeContext = { userId };

  const repoRoot = await runGit(directory, ["rev-parse", "--show-toplevel"]);
  const rootCommitId = repoRoot ? await resolveRootCommitId(repoRoot) : null;
  const isGitRootId = !!rootCommitId;
  const projectId = isGitRootId ? `git-root:${rootCommitId}` : getLegacyProjectId(repoRoot || directory);
  const projectScope: MemoryScopeContext = { userId, projectId };
  const tags = {
    user: `${CONFIG.scopePrefix}_user_${userId}`,
    project: getProjectTag(projectId),
  };

  if (!isGitRootId) {
    return {
      userId,
      userScope,
      projectScope,
      projectId,
      projectKind: "path",
      tags,
      legacySources: [],
    };
  }

  const commonDir = await runGit(directory, ["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  const legacySources = repoRoot ? await discoverLegacySources(directory, repoRoot) : [makeLegacySource(directory, "current directory")];

  return {
    userId,
    userScope,
    projectScope,
    projectId,
    projectKind: "git-root",
    tags,
    repoRoot: repoRoot || undefined,
    commonDir: commonDir || undefined,
    legacySources,
  };
}

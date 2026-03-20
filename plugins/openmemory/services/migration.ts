import { mkdir, open, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { openMemoryClient } from "./client.js";
import { log } from "./logger.js";
import { projectMemoryFingerprint } from "./project-memory.js";
import {
  getLegacyProjectId,
  resolveProjectScope,
  type LegacyProjectSource,
  type ProjectScopeResolution,
} from "./tags.js";
import type { MemoryItem, MemoryScopeContext, MemoryType } from "../types/index.js";

const MIGRATION_LEDGER_VERSION = 1;
const MIGRATION_PAGE_SIZE = 200;
const STALE_MIGRATION_LOCK_MS = 15 * 60 * 1000;
const LOCK_HEARTBEAT_MS = 30 * 1000;
const COMPLETED_MIGRATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

class MigrationLockError extends Error {}

interface PendingMigration {
  startedAt: string;
  updatedAt: string;
  sources: LegacyProjectSource[];
  lastError?: string;
  stats?: MigrationStats;
}

interface MigrationLedger {
  version: number;
  pending: Record<string, PendingMigration>;
  completed: Record<string, { completedAt: string; expiresAt: string }>;
}

export interface MigrationStats {
  sourceScopes: number;
  discovered: number;
  copied: number;
  duplicates: number;
  failed: number;
}

export interface ProjectMemoryRuntimeState {
  resolution: ProjectScopeResolution;
  scopes: { user: MemoryScopeContext; project: MemoryScopeContext };
  tags: { user: string; project: string };
  projectReadScopes: MemoryScopeContext[];
  migrationNotice?: string;
  migrationFailed: boolean;
}

function emptyLedger(): MigrationLedger {
  return { version: MIGRATION_LEDGER_VERSION, pending: {}, completed: {} };
}

function migrationLedgerPath(commonDir: string): string {
  return join(commonDir, "openmemory-migration.json");
}

function migrationLockPath(ledgerPath: string): string {
  return `${ledgerPath}.lock`;
}

function normalizeMemoryText(content?: string): string {
  return (content || "").trim();
}

function dedupeSources(sources: LegacyProjectSource[]): LegacyProjectSource[] {
  const deduped = new Map<string, LegacyProjectSource>();
  for (const source of sources) {
    if (!deduped.has(source.projectId)) {
      deduped.set(source.projectId, source);
    }
  }
  return [...deduped.values()];
}

function scopeForProjectId(userId: string, projectId: string): MemoryScopeContext {
  return { userId, projectId };
}

function formatMigrationNotice(kind: "success" | "failure", targetProjectId: string, stats: MigrationStats, error?: string): string {
  const prefix = kind === "success" ? "[OPENMEMORY MIGRATION]" : "[OPENMEMORY MIGRATION FAILED]";
  const summary = `${stats.discovered} found, ${stats.copied} copied, ${stats.duplicates} duplicates skipped, ${stats.failed} failed across ${stats.sourceScopes} source scope${stats.sourceScopes === 1 ? "" : "s"}.`;
  if (kind === "success") {
    return `${prefix} Migrated project memories into ${targetProjectId}. ${summary}`;
  }
  return `${prefix} Could not finish migrating project memories into ${targetProjectId}. ${summary}${error ? ` Last error: ${error}.` : ""} Run \`openmemory mode:migrate\` to retry manually.`;
}

function lockFailureResult(sourceScopes: number, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    success: false as const,
    stats: { sourceScopes, discovered: 0, copied: 0, duplicates: 0, failed: 1 },
    error: message,
    locked: error instanceof MigrationLockError,
  };
}

async function readLedger(path: string): Promise<MigrationLedger> {
  try {
    const content = await readFile(path, "utf8");
    const parsed = JSON.parse(content) as MigrationLedger;
    if (parsed && parsed.version === MIGRATION_LEDGER_VERSION && parsed.pending) {
      parsed.completed ||= {};
      return parsed;
    }
  } catch {
    // Ignore missing/invalid ledgers and recreate below.
  }

  return emptyLedger();
}

async function writeLedger(path: string, ledger: MigrationLedger): Promise<void> {
  if (Object.keys(ledger.pending).length === 0 && Object.keys(ledger.completed).length === 0) {
    await rm(path, { force: true }).catch(() => undefined);
    return;
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(ledger, null, 2)}\n`, "utf8");
}

async function setPendingMigration(path: string, targetProjectId: string, entry: PendingMigration): Promise<void> {
  const ledger = await readLedger(path);
  delete ledger.completed[targetProjectId];
  ledger.pending[targetProjectId] = entry;
  await writeLedger(path, ledger);
}

async function clearPendingMigration(path: string, targetProjectId: string): Promise<void> {
  const ledger = await readLedger(path);
  delete ledger.pending[targetProjectId];
  await writeLedger(path, ledger);
}

async function setCompletedMigration(path: string, targetProjectId: string): Promise<void> {
  const ledger = await readLedger(path);
  delete ledger.pending[targetProjectId];
  ledger.completed[targetProjectId] = {
    completedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + COMPLETED_MIGRATION_TTL_MS).toISOString(),
  };
  await writeLedger(path, ledger);
}

async function getPendingMigration(path: string, targetProjectId: string): Promise<PendingMigration | null> {
  const ledger = await readLedger(path);
  return ledger.pending[targetProjectId] || null;
}

async function hasRecentCompletedMigration(path: string, targetProjectId: string): Promise<boolean> {
  const ledger = await readLedger(path);
  const completed = ledger.completed[targetProjectId];
  if (!completed) return false;

  if (Date.parse(completed.expiresAt) > Date.now()) {
    return true;
  }

  delete ledger.completed[targetProjectId];
  await writeLedger(path, ledger);
  return false;
}

async function withMigrationLock<T>(ledgerPath: string, fn: () => Promise<T>): Promise<T> {
  const lockPath = migrationLockPath(ledgerPath);
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  while (!handle) {
    try {
      handle = await open(lockPath, "wx");
      await writeFile(lockPath, JSON.stringify({ startedAt: new Date().toISOString() }), "utf8");
    } catch (error) {
      if (handle) {
        await handle.close().catch(() => undefined);
        handle = undefined;
        await rm(lockPath, { force: true }).catch(() => undefined);
      }

      const lockStat = await stat(lockPath).catch(() => null);
      if (lockStat && Date.now() - lockStat.mtimeMs > STALE_MIGRATION_LOCK_MS) {
        await rm(lockPath, { force: true }).catch(() => undefined);
        continue;
      }

      const message = error instanceof Error ? error.message : String(error);
      throw new MigrationLockError(`Another OpenMemory migration is already running (${message})`);
    }
  }

  try {
    heartbeat = setInterval(() => {
      writeFile(lockPath, JSON.stringify({ heartbeatAt: new Date().toISOString() }), "utf8").catch(() => undefined);
    }, LOCK_HEARTBEAT_MS);

    return await fn();
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat);
    }
    await handle.close().catch(() => undefined);
    await rm(lockPath, { force: true }).catch(() => undefined);
  }
}

async function listAllMemories(scope: MemoryScopeContext): Promise<MemoryItem[]> {
  const all: MemoryItem[] = [];
  let offset = 0;

  while (true) {
    const result = await openMemoryClient.listMemories(scope, { limit: MIGRATION_PAGE_SIZE, offset });
    if (!result.success) {
      throw new Error(result.error || `Failed to list memories for scope ${scope.projectId || "user"}`);
    }

    const memories = result.memories || [];
    all.push(...memories);

    if (memories.length < MIGRATION_PAGE_SIZE) {
      return all;
    }

    offset += memories.length;
  }
}

async function scopeHasMemories(scope: MemoryScopeContext): Promise<{ success: boolean; hasMemories: boolean; error?: string }> {
  const result = await openMemoryClient.listMemories(scope, { limit: 1 });
  if (!result.success) {
    return {
      success: false,
      hasMemories: false,
      error: result.error || `Failed to inspect scope ${scope.projectId || "user"}`,
    };
  }

  return {
    success: true,
    hasMemories: (result.memories?.length || 0) > 0,
  };
}

async function existingSourcesWithMemories(
  userId: string,
  sources: LegacyProjectSource[],
): Promise<{ sources: LegacyProjectSource[]; errors: string[] }> {
  const available: LegacyProjectSource[] = [];
  const errors: string[] = [];

  for (const source of dedupeSources(sources)) {
    const scope = scopeForProjectId(userId, source.projectId);
    const check = await scopeHasMemories(scope);
    if (!check.success) {
      errors.push(`Failed to inspect ${source.label}: ${check.error}`);
      continue;
    }

    if (check.hasMemories) {
      available.push(source);
    }
  }

  return { sources: available, errors };
}

async function migrateSourcesToTarget(
  userId: string,
  targetScope: MemoryScopeContext,
  sources: LegacyProjectSource[],
): Promise<{ success: true; stats: MigrationStats } | { success: false; stats: MigrationStats; error: string }> {
  const dedupedSources = dedupeSources(sources);
  const stats: MigrationStats = {
    sourceScopes: dedupedSources.length,
    discovered: 0,
    copied: 0,
    duplicates: 0,
    failed: 0,
  };

  const targetMemories = await listAllMemories(targetScope);
  const knownFingerprints = new Set(targetMemories.map(projectMemoryFingerprint));

  for (const source of dedupedSources) {
    const sourceScope = scopeForProjectId(userId, source.projectId);
    let sourceMemories: MemoryItem[];

    try {
      sourceMemories = await listAllMemories(sourceScope);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      stats.failed += 1;
      return { success: false, stats, error: `Failed to list source ${source.label}: ${message}` };
    }

    for (const memory of sourceMemories) {
      stats.discovered += 1;
      const fingerprint = projectMemoryFingerprint(memory);
      if (knownFingerprints.has(fingerprint)) {
        stats.duplicates += 1;
        continue;
      }

      const type = typeof memory.metadata?.type === "string" ? (memory.metadata.type as MemoryType) : undefined;
      const tags = Array.isArray(memory.tags) ? memory.tags.filter((tag): tag is string => typeof tag === "string") : undefined;
      const metadata = {
        ...(memory.metadata || {}),
        migrated_from_project_id: source.projectId,
        migrated_from_label: source.label,
        migrated_at: new Date().toISOString(),
        migration_version: MIGRATION_LEDGER_VERSION,
      };

      const addResult = await openMemoryClient.addMemory(normalizeMemoryText(memory.content), targetScope, {
        type,
        tags,
        metadata,
      });

      if (!addResult.success) {
        stats.failed += 1;
        return {
          success: false,
          stats,
          error: addResult.error || `Failed to copy memory from ${source.label}`,
        };
      }

      knownFingerprints.add(fingerprint);
      stats.copied += 1;
    }
  }

  return { success: true, stats };
}

async function parseManualSourcePaths(baseDirectory: string, fromPaths?: string): Promise<LegacyProjectSource[]> {
  if (!fromPaths) return [];

  const rawPaths = fromPaths
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith("/") ? value : join(baseDirectory, value)));

  const paths = await Promise.all(
    rawPaths.map(async (pathValue) => {
      try {
        return await realpath(pathValue);
      } catch {
        return pathValue;
      }
    })
  );

  return dedupeSources(paths.map((pathValue) => ({
    projectId: getLegacyProjectId(pathValue),
    label: `manual:${pathValue}`,
    path: pathValue,
  })));
}

export async function resolveProjectMemoryRuntimeState(directory: string): Promise<ProjectMemoryRuntimeState> {
  const resolution = await resolveProjectScope(directory);
  const baseState: ProjectMemoryRuntimeState = {
    resolution,
    scopes: { user: resolution.userScope, project: resolution.projectScope },
    tags: resolution.tags,
    projectReadScopes: [resolution.projectScope],
    migrationFailed: false,
  };

  if (resolution.projectKind !== "git-root") {
    return baseState;
  }

  if (!resolution.commonDir) {
    const failureNotice = formatMigrationNotice(
      "failure",
      resolution.projectId,
      { sourceScopes: resolution.legacySources.length, discovered: 0, copied: 0, duplicates: 0, failed: 1 },
      "Could not resolve shared git metadata directory for migration",
    );
    return {
      ...baseState,
      projectReadScopes: [resolution.projectScope, ...resolution.legacySources.map((source) => scopeForProjectId(resolution.userId, source.projectId))],
      migrationNotice: failureNotice,
      migrationFailed: true,
    };
  }

  const ledgerPath = migrationLedgerPath(resolution.commonDir);
  const pending = await getPendingMigration(ledgerPath, resolution.projectId);
  if (!pending && (await hasRecentCompletedMigration(ledgerPath, resolution.projectId))) {
    return baseState;
  }
  const sourceCandidates = dedupeSources([
    ...(pending?.sources || []),
    ...resolution.legacySources,
  ]);

  if (pending) {
    const retry = await withMigrationLock(ledgerPath, () =>
      migrateSourcesToTarget(resolution.userId, resolution.projectScope, sourceCandidates)
    ).catch((error) => lockFailureResult(sourceCandidates.length, error));
    if (retry.success) {
      await setCompletedMigration(ledgerPath, resolution.projectId);
      const notice = formatMigrationNotice("success", resolution.projectId, retry.stats);
      log("[migration] automatic retry succeeded", { target: resolution.projectId, stats: retry.stats });
      return { ...baseState, migrationNotice: notice };
    }

    if (!("locked" in retry && retry.locked)) {
      const updatedPending: PendingMigration = {
        startedAt: pending.startedAt,
        updatedAt: new Date().toISOString(),
        sources: sourceCandidates,
        lastError: retry.error,
        stats: retry.stats,
      };
      await setPendingMigration(ledgerPath, resolution.projectId, updatedPending);
    }

    const failureNotice = formatMigrationNotice("failure", resolution.projectId, retry.stats, retry.error);
    log("[migration] automatic retry failed", { target: resolution.projectId, error: retry.error, stats: retry.stats });
    return {
      ...baseState,
      projectReadScopes: [resolution.projectScope, ...sourceCandidates.map((source) => scopeForProjectId(resolution.userId, source.projectId))],
      migrationNotice: failureNotice,
      migrationFailed: true,
    };
  }

  const targetScopeCheck = await scopeHasMemories(resolution.projectScope);
  if (!targetScopeCheck.success) {
    const ledgerPath = migrationLedgerPath(resolution.commonDir);
    await setPendingMigration(ledgerPath, resolution.projectId, {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: resolution.legacySources,
      lastError: targetScopeCheck.error,
      stats: { sourceScopes: resolution.legacySources.length, discovered: 0, copied: 0, duplicates: 0, failed: 1 },
    });
    const failureNotice = formatMigrationNotice(
      "failure",
      resolution.projectId,
      { sourceScopes: 0, discovered: 0, copied: 0, duplicates: 0, failed: 1 },
      targetScopeCheck.error,
    );
    log("[migration] failed to inspect target scope", {
      target: resolution.projectId,
      error: targetScopeCheck.error,
    });
    return {
      ...baseState,
      projectReadScopes: [resolution.projectScope, ...resolution.legacySources.map((source) => scopeForProjectId(resolution.userId, source.projectId))],
      migrationNotice: failureNotice,
      migrationFailed: true,
    };
  }

  const legacyCheck = await existingSourcesWithMemories(resolution.userId, resolution.legacySources);
  if (legacyCheck.errors.length > 0) {
    const pendingEntry: PendingMigration = {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: resolution.legacySources,
      lastError: legacyCheck.errors.join("; "),
      stats: { sourceScopes: resolution.legacySources.length, discovered: 0, copied: 0, duplicates: 0, failed: legacyCheck.errors.length },
    };
    await setPendingMigration(ledgerPath, resolution.projectId, pendingEntry);
    const failureNotice = formatMigrationNotice("failure", resolution.projectId, pendingEntry.stats!, pendingEntry.lastError);
    log("[migration] legacy source inspection failed", {
      target: resolution.projectId,
      error: pendingEntry.lastError,
    });
    return {
      ...baseState,
      projectReadScopes: [resolution.projectScope, ...resolution.legacySources.map((source) => scopeForProjectId(resolution.userId, source.projectId))],
      migrationNotice: failureNotice,
      migrationFailed: true,
    };
  }

  const legacySources = legacyCheck.sources;
  if (legacySources.length === 0) {
    await setCompletedMigration(ledgerPath, resolution.projectId);
    return baseState;
  }

  const migration = await withMigrationLock(ledgerPath, () =>
    setPendingMigration(ledgerPath, resolution.projectId, {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: legacySources,
    }).then(() => migrateSourcesToTarget(resolution.userId, resolution.projectScope, legacySources))
  ).catch((error) => lockFailureResult(legacySources.length, error));
  if (migration.success) {
    await setCompletedMigration(ledgerPath, resolution.projectId);
    const notice = formatMigrationNotice("success", resolution.projectId, migration.stats);
    log("[migration] automatic migration succeeded", { target: resolution.projectId, stats: migration.stats });
    return { ...baseState, migrationNotice: notice };
  }

  if (!("locked" in migration && migration.locked)) {
    await setPendingMigration(ledgerPath, resolution.projectId, {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: legacySources,
      lastError: migration.error,
      stats: migration.stats,
    });
  }
  const failureNotice = formatMigrationNotice("failure", resolution.projectId, migration.stats, migration.error);
  log("[migration] automatic migration failed", { target: resolution.projectId, error: migration.error, stats: migration.stats });
  return {
    ...baseState,
    projectReadScopes: [resolution.projectScope, ...legacySources.map((source) => scopeForProjectId(resolution.userId, source.projectId))],
    migrationNotice: failureNotice,
    migrationFailed: true,
  };
}

export async function runManualProjectMigration(
  directory: string,
  fromPaths?: string,
): Promise<{
  success: boolean;
  targetProjectId?: string;
  sources?: LegacyProjectSource[];
  stats?: MigrationStats;
  error?: string;
}> {
  const resolution = await resolveProjectScope(directory);
  if (resolution.projectKind !== "git-root" || !resolution.commonDir) {
    return {
      success: false,
      error: "Project migration requires a git repository with at least one commit.",
    };
  }

  const sources = dedupeSources([
    ...resolution.legacySources,
    ...(await parseManualSourcePaths(resolution.repoRoot || directory, fromPaths)),
  ]);

  const availableSourcesResult = await existingSourcesWithMemories(resolution.userId, sources);
  if (availableSourcesResult.errors.length > 0) {
    const ledgerPath = migrationLedgerPath(resolution.commonDir);
    await setPendingMigration(ledgerPath, resolution.projectId, {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources,
      lastError: availableSourcesResult.errors.join("; "),
      stats: {
        sourceScopes: sources.length,
        discovered: 0,
        copied: 0,
        duplicates: 0,
        failed: availableSourcesResult.errors.length,
      },
    });

    return {
      success: false,
      targetProjectId: resolution.projectId,
      sources,
      stats: {
        sourceScopes: sources.length,
        discovered: 0,
        copied: 0,
        duplicates: 0,
        failed: availableSourcesResult.errors.length,
      },
      error: availableSourcesResult.errors.join("; "),
    };
  }

  const availableSources = availableSourcesResult.sources;
  if (availableSources.length === 0) {
    const ledgerPath = migrationLedgerPath(resolution.commonDir);
    await setCompletedMigration(ledgerPath, resolution.projectId);
    return {
      success: true,
      targetProjectId: resolution.projectId,
      sources: [],
      stats: { sourceScopes: 0, discovered: 0, copied: 0, duplicates: 0, failed: 0 },
    };
  }

  const ledgerPath = migrationLedgerPath(resolution.commonDir);
  const migration = await withMigrationLock(ledgerPath, () =>
    setPendingMigration(ledgerPath, resolution.projectId, {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: availableSources,
    }).then(() => migrateSourcesToTarget(resolution.userId, resolution.projectScope, availableSources))
  ).catch((error) => lockFailureResult(availableSources.length, error));
  if (migration.success) {
    await setCompletedMigration(ledgerPath, resolution.projectId);
    return {
      success: true,
      targetProjectId: resolution.projectId,
      sources: availableSources,
      stats: migration.stats,
    };
  }

  if (!("locked" in migration && migration.locked)) {
    await setPendingMigration(ledgerPath, resolution.projectId, {
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sources: availableSources,
      lastError: migration.error,
      stats: migration.stats,
    });
  }

  return {
    success: false,
    targetProjectId: resolution.projectId,
    sources: availableSources,
    stats: migration.stats,
    error: migration.error,
  };
}

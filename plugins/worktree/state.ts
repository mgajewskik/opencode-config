/**
 * SQLite State Module for Worktree Plugin
 *
 * Provides atomic, crash-safe persistence for worktree sessions and pending operations.
 * Uses bun:sqlite for zero external dependencies.
 *
 * Database location: ~/.local/share/opencode/plugins/worktree/{project-id}.sqlite
 * Project ID is the first git root commit SHA (40-char hex), with SHA-256 path hash fallback (16-char).
 */

import { Database } from "bun:sqlite"
import { createHash } from "node:crypto"
import { mkdirSync } from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { z } from "zod"
import type { OpencodeClient } from "../kdco-primitives"
import { getProjectId, logWarn } from "../kdco-primitives"

// =============================================================================
// TYPES
// =============================================================================

/** Represents an active worktree session */
export interface Session {
	id: string
	branch: string
	path: string
	createdAt: string
}

/** Pending spawn operation to be processed on session.idle */
export interface PendingSpawn {
	branch: string
	path: string
	sessionId: string
}

/** Pending delete operation to be processed on session.idle */
export interface PendingDelete {
	branch: string
	path: string
}

// =============================================================================
// SCHEMAS (Boundary Validation)
// =============================================================================

const sessionSchema = z.object({
	id: z.string().min(1),
	branch: z.string().min(1),
	path: z.string().min(1),
	createdAt: z.string().min(1),
})

const pendingSpawnSchema = z.object({
	branch: z.string().min(1),
	path: z.string().min(1),
	sessionId: z.string().min(1),
})

const pendingDeleteSchema = z.object({
	branch: z.string().min(1),
	path: z.string().min(1),
})

// =============================================================================
// DATABASE UTILITIES
// =============================================================================

export type WorktreeLocationMode = "sibling" | "xdg-data"

const MAX_WORKTREE_DIRNAME_BYTES = 255
const WORKTREE_HASH_LENGTH = 8

function shortWorktreeHash(value: string): string {
	return createHash("sha256").update(value).digest("hex").slice(0, WORKTREE_HASH_LENGTH)
}

function slugifyBranchForDirectory(branch: string): string {
	const slug = branch
		.replace(/\//g, "-")
		.replace(/[^A-Za-z0-9._-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")

	return slug || "worktree"
}

function byteLength(value: string): number {
	return new TextEncoder().encode(value).length
}

function truncateUtf8(value: string, maxBytes: number): string {
	if (maxBytes <= 0) return ""

	let result = ""
	for (const char of value) {
		if (byteLength(result + char) > maxBytes) break
		result += char
	}

	return result
}

function buildSiblingWorktreeDirName(repoName: string, branch: string, collisionSuffix?: string): string {
	const branchSlug = slugifyBranchForDirectory(branch)
	const collisionSegment = collisionSuffix ? `--${collisionSuffix}` : ""
	const directName = `${repoName}--${branchSlug}${collisionSegment}`
	if (byteLength(directName) <= MAX_WORKTREE_DIRNAME_BYTES) {
		return directName
	}

	const branchHashSegment = `--${shortWorktreeHash(`branch:${branch}`)}`
	let repoPart = repoName
	let repoHashSegment = ""
	let availableBranchBytes =
		MAX_WORKTREE_DIRNAME_BYTES -
		byteLength(`${repoPart}--`) -
		byteLength(branchHashSegment) -
		byteLength(collisionSegment)

	if (availableBranchBytes <= 0) {
		repoHashSegment = `--${shortWorktreeHash(`repo:${repoName}`)}`
		const minBranchBytes = 1
		const availableRepoBytes =
			MAX_WORKTREE_DIRNAME_BYTES -
			byteLength("--") -
			minBranchBytes -
			byteLength(repoHashSegment) -
			byteLength(branchHashSegment) -
			byteLength(collisionSegment)

		if (availableRepoBytes <= 0) {
			throw new Error(`Worktree directory name too long for repo '${repoName}'`)
		}

		repoPart = truncateUtf8(repoName, availableRepoBytes).replace(/-+$/g, "") || "repo"
		availableBranchBytes =
			MAX_WORKTREE_DIRNAME_BYTES -
			byteLength(`${repoPart}${repoHashSegment}--`) -
			byteLength(branchHashSegment) -
			byteLength(collisionSegment)
	}

	if (availableBranchBytes <= 0) {
		throw new Error(`Worktree directory name too long for repo '${repoName}'`)
	}

	const truncatedBranchSlug = truncateUtf8(branchSlug, availableBranchBytes).replace(/-+$/g, "") || "worktree"
	const shortenedName = `${repoPart}${repoHashSegment}--${truncatedBranchSlug}${branchHashSegment}${collisionSegment}`

	if (byteLength(shortenedName) > MAX_WORKTREE_DIRNAME_BYTES) {
		throw new Error(`Worktree directory name too long for repo '${repoName}'`)
	}

	return shortenedName
}

/**
 * Get the worktree path for a given project and branch.
 *
 * @param projectRoot - Absolute path to the project root
 * @param branch - Branch name for the worktree
 * @param mode - Location strategy for worktree placement
 * @param collisionSuffix - Optional suffix used when a sanitized sibling path collides
 * @returns Absolute path to the worktree directory
 */
export async function getWorktreePath(
	projectRoot: string,
	branch: string,
	mode: WorktreeLocationMode = "sibling",
	collisionSuffix?: string,
): Promise<string> {
	if (!branch || typeof branch !== "string") {
		throw new Error("branch is required")
	}

	if (mode === "xdg-data") {
		const projectId = await getProjectId(projectRoot)
		return path.join(os.homedir(), ".local", "share", "opencode", "worktree", projectId, branch)
	}

	const repoParent = path.dirname(projectRoot)
	const repoName = path.basename(projectRoot)
	const worktreeDirName = buildSiblingWorktreeDirName(repoName, branch, collisionSuffix)

	return path.join(repoParent, worktreeDirName)
}

/**
 * Get the database directory path.
 * Location: ~/.local/share/opencode/plugins/worktree/
 */
function getDbDirectory(): string {
	const home = os.homedir()
	return path.join(home, ".local", "share", "opencode", "plugins", "worktree")
}

/**
 * Get the full database file path for a project.
 * @param projectRoot - Absolute path to the project root
 */
async function getDbPath(projectRoot: string): Promise<string> {
	const projectId = await getProjectId(projectRoot)
	return path.join(getDbDirectory(), `${projectId}.sqlite`)
}

/**
 * Initialize the SQLite database for worktree state.
 * Creates the database file and schema if they don't exist.
 *
 * @param projectRoot - Absolute path to the project root
 * @returns Configured Database instance
 *
 * @example
 * ```ts
 * const db = await initStateDb("/home/user/my-project")
 * const sessions = getAllSessions(db)
 * db.close()
 * ```
 */
export async function initStateDb(projectRoot: string): Promise<Database> {
	// Guard: validate project root
	if (!projectRoot || typeof projectRoot !== "string") {
		throw new Error("initStateDb requires a valid project root path")
	}

	const dbPath = await getDbPath(projectRoot)
	const dbDir = path.dirname(dbPath)

	// Create directory synchronously (required before opening DB)
	mkdirSync(dbDir, { recursive: true })

	// Open database (creates if doesn't exist)
	const db = new Database(dbPath)

	// Configure SQLite for concurrent access
	db.exec("PRAGMA journal_mode=WAL")
	db.exec("PRAGMA busy_timeout=5000")

	// Create tables with schema
	db.exec(`
		CREATE TABLE IF NOT EXISTS sessions (
			id TEXT PRIMARY KEY,
			branch TEXT NOT NULL,
			path TEXT NOT NULL,
			created_at TEXT NOT NULL
		)
	`)

	db.exec(`
		CREATE TABLE IF NOT EXISTS pending_operations (
			id INTEGER PRIMARY KEY CHECK (id = 1),
			type TEXT NOT NULL,
			branch TEXT NOT NULL,
			path TEXT NOT NULL,
			session_id TEXT
		)
	`)

	db.exec(`
		CREATE TABLE IF NOT EXISTS metadata (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)
	`)

	return db
}

const CANONICAL_REPO_ROOT_KEY = "canonical_repo_root"
const CANONICAL_REPO_COMMON_DIR_KEY = "canonical_repo_common_dir"

function scopedMetadataKey(baseKey: string, commonDir: string): string {
	return `${baseKey}:${shortWorktreeHash(commonDir)}`
}

function getMetadataValue(db: Database, key: string): string | null {
	const stmt = db.prepare(`SELECT value FROM metadata WHERE key = $key`)
	const row = stmt.get({ $key: key }) as { value: string } | null
	return row?.value ?? null
}

function setMetadataValue(db: Database, key: string, value: string): void {
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO metadata (key, value)
		VALUES ($key, $value)
	`)

	stmt.run({
		$key: key,
		$value: value,
	})
}

export function getStoredCanonicalRepoRoot(db: Database, commonDir: string): string | null {
	if (!commonDir) return null
	return getMetadataValue(db, scopedMetadataKey(CANONICAL_REPO_ROOT_KEY, commonDir))
}

export function getStoredCanonicalRepoCommonDir(db: Database, commonDir: string): string | null {
	if (!commonDir) return null
	return getMetadataValue(db, scopedMetadataKey(CANONICAL_REPO_COMMON_DIR_KEY, commonDir))
}

export function setStoredCanonicalRepoRoot(db: Database, repoRoot: string, commonDir?: string): void {
	if (!repoRoot || !commonDir) return

	setMetadataValue(db, scopedMetadataKey(CANONICAL_REPO_ROOT_KEY, commonDir), repoRoot)
	setMetadataValue(db, scopedMetadataKey(CANONICAL_REPO_COMMON_DIR_KEY, commonDir), commonDir)
}

// =============================================================================
// SESSION CRUD
// =============================================================================

/**
 * Add a new session to the database.
 * Uses atomic INSERT OR REPLACE for idempotency.
 *
 * @param db - Database instance from initStateDb
 * @param session - Session data to persist
 */
export function addSession(db: Database, session: Session): void {
	// Parse at boundary for type safety
	const parsed = sessionSchema.parse(session)

	const stmt = db.prepare(`
		INSERT OR REPLACE INTO sessions (id, branch, path, created_at)
		VALUES ($id, $branch, $path, $createdAt)
	`)

	stmt.run({
		$id: parsed.id,
		$branch: parsed.branch,
		$path: parsed.path,
		$createdAt: parsed.createdAt,
	})
}

/**
 * Get a session by ID.
 *
 * @param db - Database instance from initStateDb
 * @param sessionId - Session ID to look up
 * @returns Session if found, null otherwise
 */
export function getSession(db: Database, sessionId: string): Session | null {
	// Guard: empty session ID
	if (!sessionId) return null

	const stmt = db.prepare(`
		SELECT id, branch, path, created_at as createdAt
		FROM sessions
		WHERE id = $id
	`)

	const row = stmt.get({ $id: sessionId }) as Record<string, string> | null
	if (!row) return null

	return {
		id: row.id,
		branch: row.branch,
		path: row.path,
		createdAt: row.createdAt,
	}
}

/**
 * Remove a session by branch name.
 * Deletes all sessions matching the branch.
 *
 * @param db - Database instance from initStateDb
 * @param branch - Branch name to remove
 */
export function removeSession(db: Database, branch: string): void {
	// Guard: empty branch
	if (!branch) return

	const stmt = db.prepare(`DELETE FROM sessions WHERE branch = $branch`)
	stmt.run({ $branch: branch })
}

/**
 * Get all active sessions.
 *
 * @param db - Database instance from initStateDb
 * @returns Array of all sessions, empty if none
 */
export function getAllSessions(db: Database): Session[] {
	const stmt = db.prepare(`
		SELECT id, branch, path, created_at as createdAt
		FROM sessions
		ORDER BY created_at ASC
	`)

	const rows = stmt.all() as Array<Record<string, string>>
	return rows.map((row) => ({
		id: row.id,
		branch: row.branch,
		path: row.path,
		createdAt: row.createdAt,
	}))
}

// =============================================================================
// PENDING SPAWN OPERATIONS
// =============================================================================

/**
 * Set a pending spawn operation. Uses singleton pattern (last-write-wins).
 *
 * If a pending spawn already exists, it will be REPLACED and a warning logged.
 * This is intentional: only the most recent spawn request should be processed.
 *
 * @param db - Database instance from initStateDb
 * @param spawn - Spawn operation data
 */
export function setPendingSpawn(db: Database, spawn: PendingSpawn, client?: OpencodeClient): void {
	// Parse at boundary for type safety
	const parsed = pendingSpawnSchema.parse(spawn)

	// Check for existing operations and warn about replacement
	const existingSpawn = getPendingSpawn(db)
	const existingDelete = getPendingDelete(db)

	if (existingSpawn) {
		logWarn(
			client,
			"worktree",
			`Replacing pending spawn: "${existingSpawn.branch}" → "${parsed.branch}"`,
		)
	} else if (existingDelete) {
		logWarn(
			client,
			"worktree",
			`Pending spawn replacing pending delete for: "${existingDelete.branch}"`,
		)
	}

	// Atomic: replace any existing pending operation
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO pending_operations (id, type, branch, path, session_id)
		VALUES (1, 'spawn', $branch, $path, $sessionId)
	`)

	stmt.run({
		$branch: parsed.branch,
		$path: parsed.path,
		$sessionId: parsed.sessionId,
	})
}

/**
 * Get the pending spawn operation if one exists.
 *
 * @param db - Database instance from initStateDb
 * @returns PendingSpawn if exists and type is 'spawn', null otherwise
 */
export function getPendingSpawn(db: Database): PendingSpawn | null {
	const stmt = db.prepare(`
		SELECT type, branch, path, session_id as sessionId
		FROM pending_operations
		WHERE id = 1 AND type = 'spawn'
	`)

	const row = stmt.get() as Record<string, string> | null
	if (!row) return null

	return {
		branch: row.branch,
		path: row.path,
		sessionId: row.sessionId,
	}
}

/**
 * Clear any pending spawn operation.
 * Removes the row if it's a spawn type, leaves deletes untouched.
 *
 * @param db - Database instance from initStateDb
 */
export function clearPendingSpawn(db: Database): void {
	const stmt = db.prepare(`DELETE FROM pending_operations WHERE id = 1 AND type = 'spawn'`)
	stmt.run()
}

// =============================================================================
// PENDING DELETE OPERATIONS
// =============================================================================

/**
 * Set a pending delete operation. Uses singleton pattern (last-write-wins).
 *
 * If a pending delete already exists, it will be REPLACED and a warning logged.
 * This is intentional: only the most recent delete request should be processed.
 *
 * @param db - Database instance from initStateDb
 * @param del - Delete operation data
 */
export function setPendingDelete(db: Database, del: PendingDelete, client?: OpencodeClient): void {
	// Parse at boundary for type safety
	const parsed = pendingDeleteSchema.parse(del)

	// Check for existing operations and warn about replacement
	const existingDelete = getPendingDelete(db)
	const existingSpawn = getPendingSpawn(db)

	if (existingDelete) {
		logWarn(
			client,
			"worktree",
			`Replacing pending delete: "${existingDelete.branch}" → "${parsed.branch}"`,
		)
	} else if (existingSpawn) {
		logWarn(
			client,
			"worktree",
			`Pending delete replacing pending spawn for: "${existingSpawn.branch}"`,
		)
	}

	// Atomic: replace any existing pending operation
	const stmt = db.prepare(`
		INSERT OR REPLACE INTO pending_operations (id, type, branch, path, session_id)
		VALUES (1, 'delete', $branch, $path, NULL)
	`)

	stmt.run({
		$branch: parsed.branch,
		$path: parsed.path,
	})
}

/**
 * Get the pending delete operation if one exists.
 *
 * @param db - Database instance from initStateDb
 * @returns PendingDelete if exists and type is 'delete', null otherwise
 */
export function getPendingDelete(db: Database): PendingDelete | null {
	const stmt = db.prepare(`
		SELECT type, branch, path
		FROM pending_operations
		WHERE id = 1 AND type = 'delete'
	`)

	const row = stmt.get() as Record<string, string> | null
	if (!row) return null

	return {
		branch: row.branch,
		path: row.path,
	}
}

/**
 * Clear any pending delete operation.
 * Removes the row if it's a delete type, leaves spawns untouched.
 *
 * @param db - Database instance from initStateDb
 */
export function clearPendingDelete(db: Database): void {
	const stmt = db.prepare(`DELETE FROM pending_operations WHERE id = 1 AND type = 'delete'`)
	stmt.run()
}

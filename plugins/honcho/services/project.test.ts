// @ts-nocheck
import { afterEach, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { getLocalStateFilePath, resolveProjectIdentity } from "./project.js";

const tempDirs: string[] = [];

function createTempDir() {
  const directory = mkdtempSync(join(tmpdir(), "honcho-project-"));
  tempDirs.push(directory);
  return directory;
}

function expectedLocalSessionName(directory: string) {
  const slug = directory
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `local-${slug || "root"}`;
}

function commitGitRepo(directory: string) {
  writeFileSync(join(directory, "README.md"), "test repo\n", "utf8");
  execFileSync("git", ["init", "-q"], { cwd: directory });
  execFileSync("git", ["add", "README.md"], { cwd: directory });
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Honcho Tests",
      "-c",
      "user.email=honcho-tests@example.com",
      "commit",
      "-q",
      "-m",
      "initial",
    ],
    { cwd: directory },
  );

  return execFileSync("git", ["rev-list", "--max-parents=0", "--all"], {
    cwd: directory,
    encoding: "utf8",
  }).trim();
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe("resolveProjectIdentity", () => {
  it("creates a local state file for non-git directories", async () => {
    const directory = createTempDir();

    const identity = await resolveProjectIdentity(directory);
    const statePath = getLocalStateFilePath(directory);

    expect(identity.kind).toBe("local");
    expect(identity.sessionName).toBe(expectedLocalSessionName(directory));
    expect(identity.localStateFile).toBe(statePath);
    expect(existsSync(statePath)).toBe(true);

    const state = JSON.parse(readFileSync(statePath, "utf8")) as {
      sessionName: string;
      directory: string;
    };

    expect(state.sessionName).toBe(identity.sessionName);
    expect(state.directory).toBe(directory);
  });

  it("uses a git-derived session name and does not create local state in repos with history", async () => {
    const directory = createTempDir();
    const firstCommitHash = commitGitRepo(directory);

    const identity = await resolveProjectIdentity(directory);

    expect(identity.kind).toBe("git");
    expect(identity.sessionName).toBe(`git-${firstCommitHash}`);
    expect(identity.localStateFile).toBeUndefined();
    expect(existsSync(getLocalStateFilePath(directory))).toBe(false);
  });

  it("reports migration metadata when a local state file exists before git history appears", async () => {
    const directory = createTempDir();
    const localIdentity = await resolveProjectIdentity(directory);
    const statePath = getLocalStateFilePath(directory);

    const firstCommitHash = commitGitRepo(directory);

    const identity = await resolveProjectIdentity(directory);

    expect(localIdentity.kind).toBe("local");
    expect(identity.kind).toBe("git");
    expect(identity.sessionName).toBe(`git-${firstCommitHash}`);
    expect(identity.migrationSource).toBe(localIdentity.sessionName);
    expect(identity.localStateFile).toBe(statePath);
    expect(existsSync(statePath)).toBe(true);
  });
});

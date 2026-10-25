import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { fileURLToPath } from "node:url";

const ARCHIVE = "data/published-puzzles.json";

// This is an append-only union, never a conflict-resolution policy. Any
// disagreement or removal of an existing puzzle requires explicit review.
export function reconcileArchives(base, local, remote) {
  for (const [date, puzzle] of Object.entries(base)) {
    if (!isDeepStrictEqual(local[date], puzzle) || !isDeepStrictEqual(remote[date], puzzle)) {
      throw new Error(`Published puzzle changed or removed: ${date}`);
    }
  }
  for (const [date, puzzle] of Object.entries(local)) {
    if (Object.hasOwn(remote, date) && !isDeepStrictEqual(remote[date], puzzle)) {
      throw new Error(`Conflicting puzzle snapshots: ${date}`);
    }
  }
  return Object.fromEntries(Object.entries({ ...remote, ...local }).sort());
}

export function syncEditorialCheckout({ cwd = process.cwd(), fetch = true } = {}) {
  const git = (...args) => execFileSync("git", args, {
    cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (git("branch", "--show-current").trim() !== "main") throw new Error("Editorial sync requires main");
  if (git("diff", "--cached", "--name-only").trim()) throw new Error("Preserve staged work before editorial sync");
  if (fetch) git("fetch", "origin");
  git("merge-base", "--is-ancestor", "HEAD", "origin/main");
  const target = git("rev-parse", "origin/main").trim();
  const changed = git("diff", "--name-only", "-z", "HEAD", target).split("\0").filter(Boolean);
  const dirty = git("diff", "--name-only", "-z").split("\0").filter(Boolean);
  const overlap = changed.filter(path => dirty.includes(path));
  if (overlap.some(path => path !== ARCHIVE)) {
    throw new Error(`Overlapping edits need review: ${overlap.join(", ")}`);
  }
  if (!overlap.length) {
    git("merge", "--ff-only", target);
    return { target, reconciled: false };
  }

  const archivePath = join(cwd, ARCHIVE);
  const original = readFileSync(archivePath, "utf8");
  const merged = reconcileArchives(
    JSON.parse(git("show", `HEAD:${ARCHIVE}`)),
    JSON.parse(original),
    JSON.parse(git("show", `${target}:${ARCHIVE}`)),
  );
  const backup = join(mkdtempSync(join(tmpdir(), "trumple-editorial-sync-")), "published-puzzles.json");
  writeFileSync(backup, original);
  git("restore", "--source=HEAD", "--worktree", "--", ARCHIVE);
  try {
    git("merge", "--ff-only", target);
  } catch (error) {
    writeFileSync(archivePath, original);
    throw new Error(`Fast-forward failed; local archive restored. Backup: ${backup}`, { cause: error });
  }
  try {
    writeFileSync(archivePath, JSON.stringify(merged) + "\n");
  } catch (error) {
    throw new Error(`Fast-forward succeeded; restore the append-only union using backup: ${backup}`, { cause: error });
  }
  return { target, reconciled: true, snapshots: Object.keys(merged).length, backup };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(syncEditorialCheckout(), null, 2));
}

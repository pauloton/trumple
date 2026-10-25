import assert from "node:assert/strict";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { reconcileArchives, syncEditorialCheckout } from "../scripts/sync-editorial-checkout.mjs";

const saved = { "2026-10-07": { cards: ["original"], answerOrder: [1] } };
const oct8 = { "2026-10-08": { cards: ["eight"], answerOrder: [2] } };
const oct9 = { "2026-10-09": { cards: ["nine"], answerOrder: [3] } };

test("archive union preserves all snapshots and refuses replacements or deletions", () => {
  assert.deepEqual(reconcileArchives(saved, { ...saved, ...oct8 }, { ...saved, ...oct9 }), { ...saved, ...oct8, ...oct9 });
  assert.deepEqual(reconcileArchives(saved, { ...saved, ...oct8 }, { ...saved, ...oct8, ...oct9 }), { ...saved, ...oct8, ...oct9 });
  assert.throws(() => reconcileArchives(saved, {}, saved), /changed or removed/);
  assert.throws(() => reconcileArchives(saved, saved, {}), /changed or removed/);
  assert.throws(() => reconcileArchives({}, oct8, { "2026-10-08": {} }), /Conflicting/);
});

function fixture(t, { remoteCopy = { ...saved, ...oct8 }, remoteEditorial = false, collision = false } = {}) {
  const cwd = mkdtempSync(join(tmpdir(), "trumple-sync-test-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const write = (name, value) => writeFileSync(join(cwd, name), value);
  const read = name => readFileSync(join(cwd, name), "utf8");
  git("init", "-b", "main");
  git("config", "user.email", "test@example.invalid");
  git("config", "user.name", "Trumple test");
  mkdirSync(join(cwd, "data"));
  write("data/published-puzzles.json", JSON.stringify(saved) + "\n");
  write("editorial.js", "base\n");
  git("add", "."); git("commit", "-m", "baseline");
  const base = git("rev-parse", "HEAD");
  git("switch", "-c", "remote-progress");
  write("data/published-puzzles.json", JSON.stringify(remoteCopy) + "\n");
  if (remoteEditorial) write("editorial.js", "remote\n");
  if (collision) write("collision.txt", "remote file\n");
  git("add", "."); git("commit", "-m", "remote additions");
  const remote = git("rev-parse", "HEAD");
  git("update-ref", "refs/remotes/origin/main", remote);
  git("switch", "main");
  write("data/published-puzzles.json", JSON.stringify({ ...saved, ...oct8, ...oct9 }) + "\n");
  write("editorial.js", "pending researched story\n");
  write("artwork.png", "untouched draft\n");
  if (collision) write("collision.txt", "local draft\n");
  return { cwd, git, write, read, base, remote };
}

test("fast-forward reconciles archive overlap and preserves pending content and artwork", t => {
  const f = fixture(t);
  const result = syncEditorialCheckout({ cwd: f.cwd, fetch: false });
  t.after(() => rmSync(dirname(result.backup), { recursive: true, force: true }));
  assert.equal(f.git("rev-parse", "HEAD"), f.remote);
  assert.deepEqual(JSON.parse(f.read("data/published-puzzles.json")), { ...saved, ...oct8, ...oct9 });
  assert.equal(f.read("editorial.js"), "pending researched story\n");
  assert.equal(f.read("artwork.png"), "untouched draft\n");
  assert.equal(f.git("diff", "--cached", "--name-only"), "");
});

test("real snapshot disagreement stops before any checkout mutation", t => {
  const f = fixture(t, { remoteCopy: { ...saved, "2026-10-08": { cards: ["different"] } } });
  const original = f.read("data/published-puzzles.json");
  assert.throws(() => syncEditorialCheckout({ cwd: f.cwd, fetch: false }), /Conflicting/);
  assert.equal(f.git("rev-parse", "HEAD"), f.base);
  assert.equal(f.read("data/published-puzzles.json"), original);
});

test("non-archive overlap and staged work stop without overwriting anything", t => {
  const f = fixture(t, { remoteEditorial: true });
  assert.throws(() => syncEditorialCheckout({ cwd: f.cwd, fetch: false }), /Overlapping edits/);
  assert.equal(f.git("rev-parse", "HEAD"), f.base);
  assert.equal(f.read("editorial.js"), "pending researched story\n");
  f.git("add", "editorial.js");
  assert.throws(() => syncEditorialCheckout({ cwd: f.cwd, fetch: false }), /staged work/);
});

test("a failed fast-forward restores the local archive and preserves untracked files", t => {
  const f = fixture(t, { collision: true });
  const original = f.read("data/published-puzzles.json");
  assert.throws(() => syncEditorialCheckout({ cwd: f.cwd, fetch: false }), /local archive restored/);
  assert.equal(f.git("rev-parse", "HEAD"), f.base);
  assert.equal(f.read("data/published-puzzles.json"), original);
  assert.equal(f.read("collision.txt"), "local draft\n");
});

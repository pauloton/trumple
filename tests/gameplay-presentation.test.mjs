import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");

test("correct cards use gold without a visible checkmark and retain accessible state", () => {
  const cards = source.slice(source.indexOf("function DraggableList"), source.indexOf("function GameOverScreen"));
  assert.ok(!/[✓✔☑]/u.test(cards));
  assert.ok(cards.includes("Correct and locked."));
  assert.ok(cards.includes("background: isLocked ? C.locked"));
});

test("game-over and result headers do not repeat edition labels", () => {
  const gameOver = source.slice(source.indexOf("function GameOverScreen"), source.indexOf("function PlayingScreen"));
  assert.ok(!gameOver.includes("editionLabel("));
  const results = source.slice(source.indexOf("function CompleteScreen"), source.indexOf("export default"));
  const header = results.slice(0, results.indexOf("records.history.length > 0"));
  assert.ok(!header.includes("editionLabel("));
  // Comparing times still distinguishes editions and card counts.
  assert.ok(results.includes("editionTimeStats(stats.results, meta?.key, eventCount)"));
});

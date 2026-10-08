import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");

test("every winning tier congratulates the player without backhanded praise", () => {
  for (const stars of [1, 2, 3]) {
    const match = source.match(new RegExp(`const WORDS_${stars} = (\\[[^;]+\\]);`));
    assert.ok(match, `Missing congratulations for ${stars} stars`);
    const messages = JSON.parse(match[1]);
    assert.equal(messages.length, 4);
    for (const message of messages) {
      assert.match(message, /perfect|nailed|victory|tremendous|won|win|congratulations/i);
      assert.doesNotMatch(message, /barely|eventually|mostly|nearly|close|survived|put up a fight|—/i);
      assert.ok(message.length <= 50, `Keep congratulations compact: ${message}`);
      if (stars < 3) assert.doesNotMatch(message, /perfect|flawless|first try/i);
    }
  }
});

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

test("all Game Over editions reveal copy with portrait then bubble after one second", () => {
  const gameOver = source.slice(source.indexOf("function GameOverScreen"), source.indexOf("function PlayingScreen"));
  assert.ok(gameOver.includes("if (!portraitReady) return"));
  assert.ok(gameOver.includes("setTimeout(() => setBubbleVisible(true), 1000)"));
  assert.ok(gameOver.includes("clearTimeout(timer)"));
  assert.ok(gameOver.includes("data-ready={portraitReady}"));
  assert.ok(gameOver.includes("{bubbleVisible &&"));
  assert.ok(source.includes(".game-over-screen[data-ready=false]>.loser-artwork,.game-over-screen[data-ready=false]>.game-over-copy{visibility:hidden;}"));
  assert.ok(!source.includes("loserStamp .48s .18s"));
});

test("timeline adapts rows to actual card count and lets them shrink before hiding controls", () => {
  assert.ok(source.includes("repeat(var(--event-count),minmax(0,1fr))"));
  assert.ok(source.includes('"--event-count": events.length'));
  assert.ok(source.includes("flex:0 1 auto;min-height:0;max-height:100%"));
  assert.ok(source.includes(".lock-in-button{min-height:44px;}"));
  assert.ok(!source.includes("grid-auto-rows:clamp(64px"));
  assert.ok(source.includes("env(safe-area-inset-bottom)"));
});

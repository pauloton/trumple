import assert from "node:assert/strict";
import test from "node:test";

import { challengeUrl, losingShareText, winningShareText } from "../lib/share-score.js";

test("shared challenge links open the exact playable puzzle", () => {
  const url = new URL(challengeUrl("2026-08-23"));
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("date"), "2026-08-23");
  assert.equal(url.searchParams.get("challenge"), "1");
});

test("score shares use one short performance challenge sentence", () => {
  const win = winningShareText({ display: "0:15.08", stars: 3, puzzleDate: "2026-08-23" });
  const loss = losingShareText({ puzzleDate: "2026-08-23" });
  assert.equal(win.split("\n")[0], "I sorted Trump's chaos in 0:15.08 with ★★★; think you can beat my score?");
  assert.equal(loss.split("\n")[0], "Trump's chaos beat me in three tries; think you can do better?");
  assert.equal(win.split("\n").length, 2);
  assert.equal(loss.split("\n").length, 2);
});

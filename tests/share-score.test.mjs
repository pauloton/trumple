import assert from "node:assert/strict";
import test from "node:test";

import { challengeUrl, losingShareText, winningShareText } from "../lib/share-score.js";

test("assisted results disclose the nudge without adding another sentence", () => {
  const text = winningShareText({display:"0:25.00",stars:2,puzzleDate:"2026-09-26",hintUsed:true});
  assert.match(text, /★★ and a nudge; think you can beat my score\?/);
  assert.equal(text.split("\n").length, 2);
});

test("shared challenge links open the exact playable puzzle", () => {
  const url = new URL(challengeUrl("2026-08-23"));
  assert.equal(url.pathname, "/");
  assert.equal(url.searchParams.get("date"), "2026-08-23");
  assert.equal(url.searchParams.get("challenge"), "1");
});

test("October Legacy shares distinguish original five-card and revised seven-card games", () => {
  for (const share of [winningShareText, losingShareText]) {
    const args = { display: "0:25.00", stars: 2, puzzleDate: "2026-10-03" };
    const oldUrl = new URL(share({ ...args, eventCount: 5 }).split("\n")[1]);
    const newUrl = new URL(share({ ...args, eventCount: 7 }).split("\n")[1]);
    assert.equal(oldUrl.searchParams.get("format"), "legacy-5");
    assert.equal(newUrl.searchParams.has("format"), false);
    assert.equal(oldUrl.searchParams.get("challenge"), "1");
  }
  assert.equal(new URL(challengeUrl("2026-10-02", undefined, 5)).searchParams.has("format"), false);
});

test("score shares use one short performance challenge sentence", () => {
  const win = winningShareText({ display: "0:15.08", stars: 3, puzzleDate: "2026-08-23" });
  const loss = losingShareText({ puzzleDate: "2026-08-23" });
  assert.equal(win.split("\n")[0], "I sorted Trump's chaos in 0:15.08 with ★★★; think you can beat my score?");
  assert.equal(loss.split("\n")[0], "Trump's chaos beat me in three tries; think you can do better?");
  assert.equal(win.split("\n").length, 2);
  assert.equal(loss.split("\n").length, 2);
});

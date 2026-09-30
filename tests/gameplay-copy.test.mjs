import assert from "node:assert/strict";
import test from "node:test";
import { gameplayHeadline, SORT_INSTRUCTIONS } from "../lib/gameplay-copy.js";

test("daily gameplay headline makes the second-term scope explicit", () => {
  assert.equal(gameplayHeadline("second-term"), "Another set of 2nd term shenanigans. Put them in order.");
  assert.equal(gameplayHeadline(), gameplayHeadline("second-term"));
});

test("special editions describe their actual event window", () => {
  assert.equal(gameplayHeadline("weekly"), "Last week's shenanigans. Put them in order.");
  assert.equal(gameplayHeadline("legacy"), "Shenanigans since 2016. Put them in order.");
});

test("sorting instructions contain only the requested direction", () => {
  assert.equal(SORT_INSTRUCTIONS, "Oldest at the top. Newest at the bottom.");
});

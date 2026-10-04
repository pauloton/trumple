import assert from "node:assert/strict";
import test from "node:test";
import { gameplayHeadline, SORT_INSTRUCTIONS } from "../lib/gameplay-copy.js";

test("every edition uses one short headline without repeating its edition", () => {
  for (const edition of [undefined, "second-term", "weekly", "legacy"]) {
    assert.equal(gameplayHeadline(edition), "Put the chaos in order.");
  }
});

test("sorting instructions contain only the requested direction", () => {
  assert.equal(SORT_INSTRUCTIONS, "Oldest at the top. Newest at the bottom.");
});

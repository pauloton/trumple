import assert from "node:assert/strict";
import test from "node:test";
import { isCorrectPosition } from "../lib/answer-check.js";

test("weekly cards from the same day are interchangeable, not different days", () => {
  const dates = { 1: "2026-09-14", 2: "2026-09-14", 3: "2026-09-16", 4: null, 5: null };
  assert.equal(isCorrectPosition(2, 1, dates, true), true);
  assert.equal(isCorrectPosition(1, 2, dates, true), true);
  assert.equal(isCorrectPosition(3, 2, dates, true), false);
  assert.equal(isCorrectPosition(4, 5, dates, true), false);
  assert.equal(isCorrectPosition(2, 1, dates, false), false);
  assert.equal(isCorrectPosition(4, 4, dates, false), true);
});

test("partial locks still permit both tied cards to finish correctly", () => {
  const dates = { 1: "2026-09-14", 2: "2026-09-14", 3: "2026-09-16" };
  const answer = [1, 2, 3];
  const first = [2, 3, 1].map((id, i) => isCorrectPosition(id, answer[i], dates, true));
  assert.deepEqual(first, [true, false, false]);
  assert.ok([2, 1, 3].every((id, i) => isCorrectPosition(id, answer[i], dates, true)));
});

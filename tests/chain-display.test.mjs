import assert from "node:assert/strict";
import test from "node:test";

import { compactEventHint, formatMonthYear } from "../lib/chain-display.js";

test("chain dates show month and year", () => {
  assert.equal(formatMonthYear("2025-10-18", 2025), "October 2025");
  assert.equal(formatMonthYear("2026-01-15", 2026), "January 2026");
  assert.equal(formatMonthYear(null, 2019), "2019");
});

test("chain explanations stay compact without cutting through a word", () => {
  const original = "The president-king flew over demonstrators in a fighter jet and released a payload no civics textbook anticipated.";
  const compact = compactEventHint(original, 60);
  assert.ok(compact.length <= 60);
  assert.match(compact, /…$/);
  assert.equal(compact.includes("  "), false);
});

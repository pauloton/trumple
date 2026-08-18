import assert from "node:assert/strict";
import test from "node:test";

import { calculateCurrentStreak, dailyResultForDate, recordDailyResult } from "../lib/player-stats.js";

test("streak counts consecutive winning puzzle dates", () => {
  const results = [
    { date: "2026-08-16", won: true },
    { date: "2026-08-17", won: true },
    { date: "2026-08-18", won: true },
  ];
  assert.equal(calculateCurrentStreak(results), 3);
});

test("a missed date starts the next streak over", () => {
  const results = [
    { date: "2026-08-15", won: true },
    { date: "2026-08-17", won: true },
  ];
  assert.equal(calculateCurrentStreak(results), 1);
});

test("a loss resets the current streak", () => {
  const results = [
    { date: "2026-08-17", won: true },
    { date: "2026-08-18", won: false },
  ];
  assert.equal(calculateCurrentStreak(results), 0);
});

test("replaying one date cannot inflate a streak", () => {
  let results = recordDailyResult([], "2026-08-17", true);
  results = recordDailyResult(results, "2026-08-17", true);
  results = recordDailyResult(results, "2026-08-18", true);

  assert.equal(results.length, 2);
  assert.equal(calculateCurrentStreak(results), 2);
});

test("a later win on the same date preserves that date as won", () => {
  let results = recordDailyResult([], "2026-08-17", false);
  results = recordDailyResult(results, "2026-08-17", true);

  assert.deepEqual(results, [{ date: "2026-08-17", won: true }]);
  assert.equal(calculateCurrentStreak(results), 1);
});

test("invalid calendar dates are ignored", () => {
  const results = recordDailyResult([], "2026-02-30", true);
  assert.deepEqual(results, []);
  assert.equal(calculateCurrentStreak(results), 0);
});

test("a streak expires after a missed day", () => {
  const results = [
    { date: "2026-08-15", won: true },
    { date: "2026-08-16", won: true },
  ];
  assert.equal(calculateCurrentStreak(results, "2026-08-18"), 0);
  assert.equal(calculateCurrentStreak(results, "2026-08-17"), 2);
});

test("daily results remember the score needed to restore the result screen", () => {
  const results = recordDailyResult([], "2026-08-18", true, {
    timeMs: 15080,
    stars: 2,
    edition: "second-term",
  });

  assert.deepEqual(dailyResultForDate(results, "2026-08-18"), {
    date: "2026-08-18",
    won: true,
    timeMs: 15080,
    stars: 2,
    edition: "second-term",
  });
});

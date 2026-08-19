import assert from "node:assert/strict";
import test from "node:test";

import { DAILY_ROTATION_RULES, createDailyRotationSelector } from "../lib/daily-rotation.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const dateFrom = (start, offset) => new Date(Date.parse(`${start}T12:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);

function fixtureEvents() {
  return Array.from({ length: 260 }, (_, index) => ({
    id: index % 2 === 0 ? `event-${index}` : `fr-event-${index}`,
    date: dateFrom("2024-06-01", index),
    title: `Event ${index}`,
    hint: `Hint ${index}`,
    significance: index % 5 + 1,
  }));
}

test("daily rotation is deterministic and uses seven orderable dates", () => {
  const first = createDailyRotationSelector(fixtureEvents(), { startDate: "2025-01-20" });
  const second = createDailyRotationSelector(fixtureEvents(), { startDate: "2025-01-20" });
  const puzzle = first("2025-03-01");

  assert.deepEqual(puzzle, second("2025-03-01"));
  assert.equal(puzzle.length, 7);
  assert.equal(new Set(puzzle.map((event) => event.date)).size, 7);
});

test("daily rotation balances fresh and recurring cards without a rigid cooldown", () => {
  const select = createDailyRotationSelector(fixtureEvents(), { startDate: "2025-01-20" });
  const puzzles = Array.from({ length: 60 }, (_, index) => select(dateFrom("2025-01-20", index)));

  for (let day = 1; day < puzzles.length; day += 1) {
    const yesterday = new Set(puzzles[day - 1].map((event) => event.id));
    assert.equal(puzzles[day].some((event) => yesterday.has(event.id)), false, `consecutive repeat on day ${day}`);
  }

  for (let day = DAILY_ROTATION_RULES.lookbackDays; day < puzzles.length; day += 1) {
    const priorIds = new Set(puzzles.slice(day - DAILY_ROTATION_RULES.lookbackDays, day).flat().map((event) => event.id));
    const fresh = puzzles[day].filter((event) => !priorIds.has(event.id));
    assert.ok(fresh.length >= DAILY_ROTATION_RULES.freshPerPuzzle, `only ${fresh.length} fresh cards on day ${day}`);
    assert.ok(puzzles[day].filter((event) => !event.id.startsWith("fr-")).length >= DAILY_ROTATION_RULES.editorialPerPuzzle);
    const puzzleDate = Date.parse(`${dateFrom("2025-01-20", day)}T12:00:00Z`);
    assert.ok(puzzles[day].filter((event) => (puzzleDate - Date.parse(`${event.date}T12:00:00Z`)) / DAY_MS <= DAILY_ROTATION_RULES.recentWindowDays).length >= DAILY_ROTATION_RULES.recentPerPuzzle);
  }

  for (let start = 0; start <= puzzles.length - 7; start += 1) {
    const counts = new Map();
    for (const event of puzzles.slice(start, start + 7).flat()) counts.set(event.id, (counts.get(event.id) || 0) + 1);
    assert.ok(Math.max(...counts.values()) <= DAILY_ROTATION_RULES.maxAppearancesPerWeek, `weekly cap exceeded at ${start}`);
  }
});

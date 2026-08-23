import assert from "node:assert/strict";
import test from "node:test";

import { DAILY_ROTATION_RULES, createDailyRotationSelector, storyKey } from "../lib/daily-rotation.js";

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
    const puzzleDate = Date.parse(`${dateFrom("2025-01-20", day)}T12:00:00Z`);
    assert.ok(puzzles[day].filter((event) => (puzzleDate - Date.parse(`${event.date}T12:00:00Z`)) / DAY_MS <= DAILY_ROTATION_RULES.recentWindowDays).length >= DAILY_ROTATION_RULES.recentPerPuzzle);
  }

  for (let start = 0; start <= puzzles.length - 7; start += 1) {
    const counts = new Map();
    for (const event of puzzles.slice(start, start + 7).flat()) counts.set(event.id, (counts.get(event.id) || 0) + 1);
    assert.ok(Math.max(...counts.values()) <= DAILY_ROTATION_RULES.maxAppearancesPerWeek, `weekly cap exceeded at ${start}`);
  }
});

test("one puzzle cannot stack several cards from the same story", () => {
  const events = Array.from({ length: 28 }, (_, index) => ({
    id: `topic-${index}`,
    date: dateFrom("2025-01-01", index),
    title: index < 5 ? `White House UFC moment ${index}` : `Distinct event ${index}`,
    hint: `Hint ${index}`,
    significance: 4,
    storyKey: index < 5 ? "white-house-ufc" : undefined,
  }));
  const select = createDailyRotationSelector(events, { startDate: "2025-01-20" });
  const puzzle = select("2025-02-01");

  assert.ok(puzzle.filter((event) => storyKey(event) === "white-house-ufc").length <= 1);
});

test("daily games work through the deep library before leaning on repeats", () => {
  const editorialEvents = fixtureEvents().map((event, index) => ({ ...event, id: `editorial-${index}` }));
  const select = createDailyRotationSelector(editorialEvents, { startDate: "2025-01-20" });
  const seen = new Set();

  for (let day = 0; day < 40; day += 1) {
    const puzzle = select(dateFrom("2025-01-20", day));
    const neverSeen = puzzle.filter((event) => !seen.has(event.id));
    assert.ok(neverSeen.length >= DAILY_ROTATION_RULES.newPerPuzzle, `only ${neverSeen.length} globally new cards on day ${day}`);
    puzzle.forEach((event) => seen.add(event.id));
  }
});

test("the final fresh batch uses every remaining unseen card", () => {
  const editorialEvents = Array.from({ length: 53 }, (_, index) => ({
    id: `finite-editorial-${index}`,
    date: dateFrom("2024-01-01", index),
    title: `Finite event ${index}`,
    hint: `Hint ${index}`,
    significance: index % 5 + 1,
  }));
  const select = createDailyRotationSelector(editorialEvents, { startDate: "2025-01-20" });
  const seen = new Set();

  for (let day = 0; day < 11; day += 1) {
    const remainingBeforePuzzle = editorialEvents.length - seen.size;
    const puzzle = select(dateFrom("2025-01-20", day));
    const neverSeen = puzzle.filter((event) => !seen.has(event.id));
    const required = Math.min(DAILY_ROTATION_RULES.newPerPuzzle, remainingBeforePuzzle);
    assert.ok(neverSeen.length >= required, `only ${neverSeen.length} of ${required} required new cards on day ${day}`);
    puzzle.forEach((event) => seen.add(event.id));
  }

  assert.equal(seen.size, editorialEvents.length);
});

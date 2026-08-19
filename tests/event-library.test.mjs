import assert from "node:assert/strict";
import test from "node:test";

import {
  EVENT_LIBRARY,
  LEGACY_EVENTS,
  SECOND_TERM_EVENTS,
  isFirstSaturday,
  mergeLibrary,
  previousWeekRange,
  validateLibraryEvent,
  weeklyEventsForSunday,
} from "../lib/event-library.js";
import { CURATED_NEWS_EVENTS } from "../data/curated-news-events.js";

test("playable libraries contain only curated, dated, unique, game-safe events", () => {
  assert.ok(EVENT_LIBRARY.length >= 100);
  assert.ok(LEGACY_EVENTS.length >= 50);
  assert.equal(EVENT_LIBRARY.length, SECOND_TERM_EVENTS.length);
  assert.equal(new Set(EVENT_LIBRARY.map((event) => event.id)).size, EVENT_LIBRARY.length);
  for (const event of EVENT_LIBRARY) {
    assert.deepEqual(validateLibraryEvent(event), [], event.id);
    assert.ok(event.date >= "2025-01-20");
    assert.ok(!event.id.startsWith("fr-"), `${event.id} is an uncurated Federal Register record`);
    assert.ok(!/^(?:Authorizes|Imposes|Keeps the .+ emergency|Signs off on)\b/i.test(event.title), `${event.id} reads like raw government paperwork`);
  }
  for (const event of LEGACY_EVENTS) assert.deepEqual(validateLibraryEvent(event), [], event.id);
});

test("the rebuilt news library is sourced and editorially classified", () => {
  assert.ok(CURATED_NEWS_EVENTS.length >= 40);
  for (const event of CURATED_NEWS_EVENTS) {
    assert.deepEqual(validateLibraryEvent(event, { requireSources: true }), [], event.id);
    assert.ok(event.trumpleScore >= 3, `${event.id} lacks a strong Trumple score`);
    assert.ok(event.category, `${event.id} lacks an editorial category`);
    assert.equal(event.status, "approved");
  }
});

test("weekly range is the seven completed days before Sunday", () => {
  assert.deepEqual(previousWeekRange(new Date("2026-08-16T12:00:00Z")), {
    start: "2026-08-09",
    end: "2026-08-15",
  });
});

test("weekly selection chooses one strong event per day in order", () => {
  const events = Array.from({ length: 7 }, (_, index) => ({
    id: `event-${index}`,
    date: `2026-08-${String(index + 9).padStart(2, "0")}`,
    title: `Event ${index}`,
    hint: "Hint",
    significance: index === 3 ? 5 : 3,
  }));
  events.push({ ...events[3], id: "weaker-duplicate-day", significance: 1 });

  const selected = weeklyEventsForSunday(new Date("2026-08-16T12:00:00Z"), events);
  assert.equal(selected.length, 7);
  assert.deepEqual(selected.map((event) => event.date), events.slice(0, 7).map((event) => event.date));
  assert.equal(selected[3].id, "event-3");
});

test("weekly selection can backfill a quiet day without making tied dates unfair", () => {
  const events = Array.from({ length: 7 }, (_, index) => ({
    id: `backfill-${index}`,
    date: `2026-08-${String(index + 6).padStart(2, "0")}`,
    title: `Event ${index}`,
    hint: "Hint",
    significance: 3,
  }));
  const selected = weeklyEventsForSunday(new Date("2026-08-16T12:00:00Z"), events, { backfillDays: 3 });
  assert.equal(selected.length, 7);
  assert.equal(selected[0].date, "2026-08-06");
  assert.equal(new Set(selected.map((event) => event.date)).size, 7);
});

test("legacy edition trigger means only the first Saturday", () => {
  assert.equal(isFirstSaturday(new Date("2026-08-01T12:00:00Z")), true);
  assert.equal(isFirstSaturday(new Date("2026-08-08T12:00:00Z")), false);
  assert.equal(isFirstSaturday(new Date("2026-08-02T12:00:00Z")), false);
});

test("unapproved automated candidates cannot enter the game", () => {
  const candidate = {
    id: "2026-08-10-candidate",
    date: "2026-08-10",
    title: "A sourced but unapproved candidate",
    hint: "Editorial review is still required.",
    significance: 3,
    status: "candidate",
  };
  assert.deepEqual(mergeLibrary([], [candidate]), []);
  assert.equal(mergeLibrary([], [{ ...candidate, status: "approved" }]).length, 1);
});

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { EVENT_LIBRARY } from "../lib/event-library.js";
import { VERIFIED_LEGACY_EVENTS } from "../data/verified-legacy-events.js";
import { EVENT_WRITEUPS, eventWriteup } from "../lib/event-writeups.js";

test("edited writeups match real cards and stay short without em dashes", () => {
  const titles = new Set([...EVENT_LIBRARY, ...VERIFIED_LEGACY_EVENTS].map(event => event.title));
  assert.equal(Object.keys(EVENT_WRITEUPS).length, titles.size);
  for (const title of titles) assert.ok(EVENT_WRITEUPS[title], `Missing edited copy: ${title}`);
  for (const [title, text] of Object.entries(EVENT_WRITEUPS)) {
    assert.ok(titles.has(title), `Unknown card: ${title}`);
    assert.ok(text.length > 0 && text.length <= 180, `Overlong copy: ${title}`);
    assert.ok(!text.includes("—"), title);
  }
});

test("daily and Sunday published games both get the revised display copy", () => {
  const archive = JSON.parse(readFileSync(new URL("../data/published-puzzles.json", import.meta.url), "utf8"));
  for (const [date, count] of [["2026-10-04", 7], ["2026-10-05", 5]]) {
    const events = archive[date].puzzle.events;
    assert.equal(events.length, count);
    for (const event of events) {
      assert.ok(EVENT_WRITEUPS[event.title]);
      assert.notEqual(eventWriteup(event), event.hint);
    }
  }
});

test("display copy does not change archived events or their answers", () => {
  const original = Object.freeze({ id: 3, title: "Launches a chatbot that says he lost in 2020", hint: "Original archived hint", date: "2026-09-29" });
  const before = JSON.stringify(original);
  assert.equal(eventWriteup(original), EVENT_WRITEUPS[original.title]);
  assert.equal(JSON.stringify(original), before);
  assert.equal(eventWriteup({ id: "unpolished-card", hint: "Its original story." }), "Its original story.");
});

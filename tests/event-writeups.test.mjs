import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { EVENT_LIBRARY } from "../lib/event-library.js";
import { EVENT_WRITEUPS, eventWriteup } from "../lib/event-writeups.js";

test("edited writeups match real cards and stay short without em dashes", () => {
  const titles = new Set(EVENT_LIBRARY.map(event => event.title));
  assert.equal(Object.keys(EVENT_WRITEUPS).length, 50);
  for (const [title, text] of Object.entries(EVENT_WRITEUPS)) {
    assert.ok(titles.has(title), `Unknown card: ${title}`);
    assert.ok(text.length > 0 && text.length <= 180, `Overlong copy: ${title}`);
    assert.ok(!text.includes("—"), title);
  }
});

test("every card in the published October 4 game gets the revised display copy", () => {
  const archive = JSON.parse(readFileSync(new URL("../data/published-puzzles.json", import.meta.url), "utf8"));
  const events = archive["2026-10-04"].puzzle.events;
  assert.equal(events.length, 7);
  for (const event of events) {
    assert.ok(EVENT_WRITEUPS[event.title]);
    assert.notEqual(eventWriteup(event), event.hint);
  }
});

test("display copy does not change archived events or their answers", () => {
  const original = Object.freeze({ id: 3, title: "Launches a chatbot that says he lost in 2020", hint: "Original archived hint", date: "2026-09-29" });
  const before = JSON.stringify(original);
  assert.equal(eventWriteup(original), EVENT_WRITEUPS[original.title]);
  assert.equal(JSON.stringify(original), before);
  assert.equal(eventWriteup({ id: "unpolished-card", hint: "Its original story." }), "Its original story.");
});

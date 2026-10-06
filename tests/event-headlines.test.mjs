import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { EVENT_LIBRARY } from "../lib/event-library.js";
import { VERIFIED_LEGACY_EVENTS } from "../data/verified-legacy-events.js";
import { EVENT_HEADLINES, eventHeadline } from "../lib/event-headlines.js";
import { eventWriteup } from "../lib/event-writeups.js";

test("display headlines match curated events and fit compact cards", () => {
  const events = [...EVENT_LIBRARY, ...VERIFIED_LEGACY_EVENTS];
  const titles = new Set(events.map(event => event.title));
  for (const [title, headline] of Object.entries(EVENT_HEADLINES)) {
    assert.ok(titles.has(title), `Unknown card: ${title}`);
    assert.ok(headline.length > 0 && headline.length <= 50, `Overlong headline (${headline.length}): ${headline}`);
    assert.ok(!headline.includes("—"), title);
  }
  const displayed = [...titles].map(title => eventHeadline({ title }));
  assert.equal(new Set(displayed).size, titles.size, "Different stories must not share a display headline");
});

test("headline edits leave stored cards, writeup lookups and answers intact", () => {
  const archive = JSON.parse(readFileSync(new URL("../data/published-puzzles.json", import.meta.url), "utf8"));
  const before = JSON.stringify(archive);
  for (const entry of Object.values(archive)) {
    for (const event of entry.puzzle.events) {
      assert.ok(eventHeadline(Object.freeze(event)));
      assert.ok(eventWriteup(event));
    }
  }
  assert.equal(JSON.stringify(archive), before);
  assert.equal(eventHeadline({ title: "A new event" }), "A new event");
});

test("today's five cards get the sharper headlines", () => {
  const archive = JSON.parse(readFileSync(new URL("../data/published-puzzles.json", import.meta.url), "utf8"));
  const events = archive["2026-10-06"].puzzle.events;
  assert.equal(events.length, 5);
  for (const event of events) assert.notEqual(eventHeadline(event), event.title);
});

test("reveal, sorting, accessible labels and answer details use display headlines", () => {
  const page = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
  assert.equal((page.match(/eventHeadline\(event\)/g) ?? []).length, 4);
  assert.ok(page.includes("eventHeadline(detail)"));
  assert.ok(!page.includes("{event.title}"));
  assert.ok(!page.includes("{detail.title}"));
});

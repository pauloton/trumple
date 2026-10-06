import assert from "node:assert/strict";
import test from "node:test";
import { SECOND_TERM_EVENTS, weeklyEventsForSunday, validateLibraryEvent } from "../lib/event-library.js";
import { WEEKLY_CURATED_EVENTS } from "../data/weekly-curated-events.js";
import { eventWriteup } from "../lib/event-writeups.js";

const batchIds = [
  "2025-02-10-paper-straw-order",
  "2025-03-04-transgender-mice-congress",
  "2025-03-11-white-house-tesla-showroom",
  "2025-03-17-biden-pardons-autopen",
  "2025-03-27-nikola-milton-pardon",
  "2025-04-09-beautiful-hair-showerheads",
  "2025-04-14-bukele-homegrown-prisoners",
  "2025-04-29-bezos-tariff-price-tags",
  "2025-04-30-two-dolls-tariffs",
  "2025-05-16-springsteen-swift-rant",
  "2025-05-17-walmart-eat-tariffs",
  "2025-06-16-trump-mobile-gold-phone",
  "2025-06-30-victory-perfume-pitch",
  "2025-07-09-liberia-english-surprise",
  "2025-07-13-chelsea-trophy-lift",
  "2025-07-18-journal-epstein-letter-suit",
  "2025-10-21-binance-zhao-pardon",
  "2026-10-03-mail-votes-for-supporters",
  "2026-10-05-empty-seats-migration",
  "2026-10-05-iran-la-san-diego-hypothetical"
];
const batch = batchIds.map(id => WEEKLY_CURATED_EVENTS.find(event => event.id === id));

test("October 6 expansion adds 20 distinct sourced, reviewed stories", () => {
  assert.equal(batch.length, 20);
  assert.equal(new Set(batch.map(event => event?.id)).size, 20);
  for (const event of batch) {
    assert.ok(event, "Every reviewed addition must be present");
    assert.deepEqual(validateLibraryEvent(event, { requireSources: true }), []);
    assert.equal(event.dateBasis, "editorial-review");
    assert.equal(event.status, "approved");
    assert.ok(event.date <= "2026-10-05", "No future or unfinished-day news");
    assert.ok(eventWriteup(event).length <= 180);
    assert.equal(SECOND_TERM_EVENTS.filter(item => item.title === event.title).length, 1);
  }
  assert.equal(batch.filter(event => event.date < "2026-09-29").length, 17);
  assert.equal(batch.filter(event => event.date >= "2026-09-29").length, 3);
});

test("backfills and Saturday's mail-ballot video cannot pad the following Sunday", () => {
  const sunday = new Date("2026-10-11T12:00:00Z");
  const eligible = weeklyEventsForSunday(sunday, batch);
  assert.deepEqual(eligible.map(event => event.id).sort(), [
    "2026-10-05-empty-seats-migration",
    "2026-10-05-iran-la-san-diego-hypothetical",
  ].sort());
});

test("pardon cards use signature dates, not announcement dates", () => {
  assert.equal(batch.find(event => event.id.endsWith("binance-zhao-pardon")).date, "2025-10-21");
  assert.equal(batch.find(event => event.id.endsWith("nikola-milton-pardon")).date, "2025-03-27");
});

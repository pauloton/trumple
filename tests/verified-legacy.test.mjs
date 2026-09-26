import test from "node:test";
import assert from "node:assert/strict";
import { VERIFIED_LEGACY_EVENTS } from "../data/verified-legacy-events.js";
import { isRealDate, weeklyEventsForSunday } from "../lib/event-library.js";
import { GET } from "../app/api/trump-puzzle/route.js";

test("new legacy selections use reviewed dates and sources only", () => {
  assert.ok(VERIFIED_LEGACY_EVENTS.length >= 6);
  for (const event of VERIFIED_LEGACY_EVENTS) {
    assert.ok(isRealDate(event.date));
    assert.equal(event.year,Number(event.date.slice(0,4)));
    assert.ok(event.title.length <= 50);
    assert.ok(!`${event.title}${event.hint}`.includes("—"));
    assert.ok(event.sources[0].url.startsWith("https://"));
  }
});
test("September Legacy now has five exact dates without changing its order", async () => {
  const body=await (await GET(new Request("https://trumple.app/api/trump-puzzle?date=2026-09-05"))).json();
  assert.equal(Object.values(body.dateMap).filter(isRealDate).length,5);
  const dates=body.answerOrder.map(id=>body.dateMap[id]);
  assert.deepEqual(dates,[...dates].sort());
});
test("September 27 has seven verified past-week stories ready", () => {
  const events=weeklyEventsForSunday(new Date("2026-09-27T12:00:00Z"));
  assert.equal(events.length,7);
  assert.ok(events.every(event=>event.date >= "2026-09-20" && event.date <= "2026-09-26" && event.dateBasis === "editorial-review"));
});

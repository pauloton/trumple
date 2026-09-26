import assert from "node:assert/strict";
import test from "node:test";
import { pacificDate, nextPacificMidnight, upcomingSunday } from "../lib/puzzle-clock.js";

test("all devices use the Pacific puzzle date", () => {
  assert.equal(pacificDate(new Date("2026-09-27T06:59:59Z")),"2026-09-26");
  assert.equal(pacificDate(new Date("2026-09-27T07:00:00Z")),"2026-09-27");
});
test("midnight handles both daylight-saving transitions", () => {
  for (const [now,next] of [
    ["2026-03-08T08:00:00Z","2026-03-09T07:00:00Z"],
    ["2026-11-01T07:00:00Z","2026-11-02T08:00:00Z"],
    ["2026-09-26T12:00:00Z","2026-09-27T07:00:00Z"],
  ]) assert.equal(new Date(nextPacificMidnight(new Date(now))).toISOString(),new Date(next).toISOString());
  assert.equal(upcomingSunday("2026-09-26"),"2026-09-27");
  assert.equal(upcomingSunday("2026-09-27"),"2026-09-27");
});

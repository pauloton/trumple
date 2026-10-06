import assert from "node:assert/strict";
import test from "node:test";
import { shouldRunRefresh } from "../lib/refresh-schedule.js";

for (const [day, expected] of [
  ["2026-10-05", 7], ["2026-01-05", 8],
  ["2026-03-08", 8], ["2026-03-09", 7],
  ["2026-11-01", 7], ["2026-11-02", 8],
]) {
  test(`exactly one midnight trigger runs on ${day}, even when delayed`, () => {
    for (const actualHour of [7, 8, 15, 23]) {
      for (const scheduledHour of [7, 8]) {
        assert.equal(shouldRunRefresh({
          eventName: "schedule", schedule: `0 ${scheduledHour} * * *`,
          now: new Date(`${day}T${String(actualHour).padStart(2, "0")}:38:47Z`),
        }), scheduledHour === expected);
      }
    }
  });
}

test("manual refreshes run at any hour, unknown events and schedules do not", () => {
  assert.equal(shouldRunRefresh({ eventName: "workflow_dispatch" }), true);
  assert.equal(shouldRunRefresh({ eventName: "push" }), false);
  assert.equal(shouldRunRefresh({ eventName: "schedule", schedule: "unknown" }), false);
  assert.equal(shouldRunRefresh({ eventName: "schedule", now: new Date("bad") }), false);
});

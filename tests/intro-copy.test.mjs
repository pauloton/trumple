import assert from "node:assert/strict";
import test from "node:test";
import { dailyIntroCopy, DAILY_INTRO_LINES } from "../lib/intro-copy.js";

test("daily intro uses the approved human, cheeky copy", () => {
  const copy = dailyIntroCopy(new Date("2026-10-03T20:00:00Z"));
  assert.deepEqual(copy.lines, ["Midterms are coming.", "So much chaos. Such short memories.", "How good is yours?"]);
  assert.equal(copy.countdown, "31 days until Election Day · Nov 3");
  assert.equal(copy.stamp, true);
  assert.ok(!DAILY_INTRO_LINES.join("").includes("—"));
});

test("election countdown uses today's Pacific date, including DST", () => {
  assert.equal(dailyIntroCopy(new Date("2026-10-04T06:59:59Z")).countdown, "31 days until Election Day · Nov 3");
  assert.equal(dailyIntroCopy(new Date("2026-10-04T07:00:00Z")).countdown, "30 days until Election Day · Nov 3");
  assert.equal(dailyIntroCopy(new Date("2026-11-02T07:59:59Z")).countdown, "2 days until Election Day · Nov 3");
  assert.equal(dailyIntroCopy(new Date("2026-11-02T08:00:00Z")).countdown, "1 day until Election Day · Nov 3");
});

test("intro handles Election Day and retires election urgency afterward", () => {
  const electionDay = dailyIntroCopy(new Date("2026-11-03T08:00:00Z"));
  assert.equal(electionDay.lines[0], "Midterms are today.");
  assert.equal(electionDay.countdown, "Election Day · November 3");
  const after = dailyIntroCopy(new Date("2026-11-04T08:00:00Z"));
  assert.equal(after.lines[0], "Still more chaos.");
  assert.equal(after.countdown, null);
  assert.equal(after.stamp, false);
});

import assert from "node:assert/strict";
import test from "node:test";
import { weeklyCoverage } from "../scripts/check-weekly-coverage.mjs";

test("weekly readiness measures playable events, not collected news or days", () => {
  assert.equal(weeklyCoverage("2026-09-20").ready, true);
  assert.equal(weeklyCoverage("2026-09-20", []).ready, false);
  const events = Array.from({ length: 7 }, (_, i) => ({ id: `event-${i}`, date: "2026-09-16", significance: 4 }));
  assert.equal(weeklyCoverage("2026-09-20", events).ready, true);
  assert.equal(weeklyCoverage("2026-09-27", events).ready, false);
  assert.throws(() => weeklyCoverage("2026-09-21"), /Sunday/);
  assert.throws(() => weeklyCoverage("2026-02-30"), /real/);
});

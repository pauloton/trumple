import assert from "node:assert/strict";
import test from "node:test";

import { refreshLibrary } from "../scripts/refresh-event-library.mjs";

test("weekly refresh maps trusted sources and rejects bad candidates", async () => {
  const result = await refreshLibrary({
    today: "2026-08-16",
    fixture: "tests/fixtures/refresh.json",
    dryRun: true,
  });

  assert.deepEqual(result.window.start, "2026-08-09");
  assert.deepEqual(result.window.end, "2026-08-15");
  assert.equal(result.articleCount, 2);
  assert.equal(result.additions.length, 1);
  assert.equal(result.additions[0].date, "2026-08-10");
  assert.equal(result.additions[0].status, "candidate");
  assert.deepEqual(result.additions[0].sources.map((source) => source.name), [
    "Associated Press",
    "Reuters",
  ]);
});

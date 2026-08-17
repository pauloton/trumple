import assert from "node:assert/strict";
import test from "node:test";

import { GET, OPTIONS } from "../app/api/trump-puzzle/route.js";

const requestFor = (date) =>
  new Request(`http://localhost/api/trump-puzzle?date=${encodeURIComponent(date)}`);

async function getPuzzle(date) {
  const response = await GET(requestFor(date));
  return { response, body: await response.json() };
}

function assertPuzzleShape(body, expectedEdition) {
  assert.equal(body.edition, expectedEdition);
  assert.equal(body.puzzle.events.length, 7);
  assert.equal(new Set(body.puzzle.events.map((event) => event.id)).size, 7);
  assert.equal(body.answerOrder.length, 7);
  assert.equal(Object.keys(body.yearMap).length, 7);
  assert.deepEqual(
    Object.keys(body.editionMeta).sort(),
    [
      "badgeStyle",
      "bgImageUrl",
      "bgOverlayOpacity",
      "buttonColor",
      "label",
      "layoutVariant",
      "taglines",
    ].sort()
  );
}

test("second-term daily edition is complete and deterministic", async () => {
  const first = await getPuzzle("2026-08-17");
  const second = await getPuzzle("2026-08-17");

  assert.equal(first.response.status, 200);
  assert.equal(first.response.headers.get("access-control-allow-origin"), "*");
  assertPuzzleShape(first.body, "second-term");
  assert.equal(first.body.isWeekly, false);
  assert.equal(first.body.isSecondTerm, true);
  assert.equal(first.body.isLegacy, false);
  assert.ok(Object.values(first.body.yearMap).every((year) => year >= 2025));
  assert.deepEqual(first.body, second.body);
});

test("Sunday safely falls back to second-term daily without seven dated events", async () => {
  const { response, body } = await getPuzzle("2026-08-16");

  assert.equal(response.status, 200);
  assertPuzzleShape(body, "second-term");
  assert.equal(body.isWeekly, false);
  assert.equal(body.isSecondTerm, true);
});

test("first Saturday of the month is the 2016-present legacy edition", async () => {
  const { response, body } = await getPuzzle("2026-08-01");

  assert.equal(response.status, 200);
  assertPuzzleShape(body, "legacy");
  assert.equal(body.isLegacy, true);
  assert.equal(body.isWeekly, false);
  assert.ok(Math.min(...Object.values(body.yearMap)) >= 2016);
  assert.ok(Math.max(...Object.values(body.yearMap)) >= 2025);
});

test("other Saturdays remain second-term daily editions", async () => {
  const { body } = await getPuzzle("2026-08-08");
  assertPuzzleShape(body, "second-term");
});

test("invalid dates fail cleanly", async () => {
  for (const date of ["August 17", "2026-02-30", "2026-8-17", ""]) {
    const response = await GET(requestFor(date));
    assert.equal(response.status, 400, date);
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
  }
});

test("dates before launch return not found", async () => {
  const { response, body } = await getPuzzle("2025-01-19");
  assert.equal(response.status, 404);
  assert.equal(body.error, "No puzzle before launch");
});

test("preflight response exposes the API to the native client", async () => {
  const response = await OPTIONS();
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, OPTIONS");
});

test("every 2026 puzzle satisfies the game contract and schedule", async () => {
  const start = Date.UTC(2026, 0, 1);
  const end = Date.UTC(2027, 0, 1);

  for (let time = start; time < end; time += 24 * 60 * 60 * 1000) {
    const current = new Date(time);
    const date = current.toISOString().slice(0, 10);
    const { response, body } = await getPuzzle(date);
    assert.equal(response.status, 200, date);

    const firstSaturday = current.getUTCDay() === 6 && current.getUTCDate() <= 7;
    assertPuzzleShape(body, firstSaturday ? "legacy" : "second-term");

    for (const event of body.puzzle.events) {
      assert.ok(event.title.length <= 50, `${date}: ${event.title}`);
      assert.ok(!event.title.includes("—"), `${date}: ${event.title}`);
    }
  }
});

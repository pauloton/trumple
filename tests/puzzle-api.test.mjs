import assert from "node:assert/strict";
import test from "node:test";

import { GET, OPTIONS } from "../app/api/trump-puzzle/route.js";
import { previousWeekRange, weeklyEventsForSunday } from "../lib/event-library.js";
import { pacificDate, addDays } from "../lib/puzzle-clock.js";
import published from "../data/published-puzzles.json" with { type: "json" };

const requestFor = (date) =>
  new Request(`http://localhost/api/trump-puzzle?date=${encodeURIComponent(date)}`);

async function getPuzzle(date) {
  const response = await GET(requestFor(date));
  return { response, body: await response.json() };
}

function assertPuzzleShape(body, expectedEdition) {
  const expectedCards = expectedEdition === "weekly" || (expectedEdition === "legacy" && body.puzzle.date >= "2026-10-03") ? 7 : 5;
  assert.equal(body.edition, expectedEdition);
  assert.equal(body.puzzle.events.length, expectedCards);
  assert.equal(new Set(body.puzzle.events.map((event) => event.id)).size, expectedCards);
  assert.equal(body.answerOrder.length, expectedCards);
  assert.equal(Object.keys(body.yearMap).length, expectedCards);
  assert.equal(Object.keys(body.dateMap).length, expectedCards);
  assert.ok(Object.values(body.dateMap).every((date) => date === null || /^\d{4}-\d{2}-\d{2}$/.test(date)));
  assert.deepEqual(
    Object.keys(body.editionMeta).sort(),
    [
      "badgeStyle",
      "bgImageUrl",
      "bgOverlayOpacity",
      "buttonColor",
      "key",
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

test("Sunday serves seven events strictly from the preceding week", async () => {
  const { response, body } = await getPuzzle("2026-09-20");

  assert.equal(response.status, 200);
  assertPuzzleShape(body, "weekly");
  assert.equal(body.isWeekly, true);
  assert.equal(body.isSecondTerm, false);
  assert.ok(Object.values(body.dateMap).every(date => date >= "2026-09-13" && date <= "2026-09-19"));
  assert.deepEqual(body, (await getPuzzle("2026-09-20")).body);
});

test("an unprepared Sunday never silently serves an older daily puzzle", async () => {
  const { response, body } = await getPuzzle("2026-09-13");
  assert.equal(response.status, 503);
  assert.equal(body.code, "WEEKLY_NOT_READY");
  assert.equal(body.puzzle, undefined);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
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
    if (date > pacificDate()) {
      assert.equal(response.status, 404, date);
      assert.equal(body.code, "NOT_RELEASED");
      continue;
    }
    if (current.getUTCDay() === 0 && weeklyEventsForSunday(current).length < 7) {
      assert.equal(response.status, 503, date);
      assert.equal(body.code, "WEEKLY_NOT_READY");
      continue;
    }
    assert.equal(response.status, 200, date);

    const firstSaturday = current.getUTCDay() === 6 && current.getUTCDate() <= 7;
    const expectedEdition = firstSaturday
      ? "legacy"
      : current.getUTCDay() === 0
        ? "weekly"
        : "second-term";
    assertPuzzleShape(body, expectedEdition);
    if (expectedEdition === "legacy") {
      assert.ok(Object.values(body.dateMap).every(eventDate => eventDate === null || eventDate <= date), date);
      const dated = Object.values(body.dateMap).filter(Boolean);
      assert.equal(new Set(dated).size, dated.length);
    }
    if (expectedEdition === "weekly") {
      const { start, end } = previousWeekRange(current);
      assert.ok(Object.values(body.dateMap).every(date => date >= start && date <= end));
    }

    for (const event of body.puzzle.events) {
      assert.ok(event.title.length <= 50, `${date}: ${event.title}`);
      assert.ok(!event.title.includes("—"), `${date}: ${event.title}`);
    }
  }
});

test("all frozen puzzles keep their card identities and answer order", async () => {
  for (const [date, original] of Object.entries(published)) {
    // October's explicit seven-card revision leaves its original available.
    const body = await (await GET(new Request(`${requestFor(date).url}&format=legacy-5`))).json();
    assert.deepEqual(body.answerOrder, original.answerOrder, date);
    assert.deepEqual(body.puzzle.events.map(({ id,title }) => ({ id,title })), original.puzzle.events.map(({ id,title }) => ({ id,title })), date);
    for (const [id, exactDate] of Object.entries(original.dateMap)) if (exactDate) assert.equal(body.dateMap[id],exactDate,date);
  }
});

test("October Legacy expands to seven without replacing its original five cards", async () => {
  const original = published["2026-10-03"];
  const { body } = await getPuzzle("2026-10-03");
  assertPuzzleShape(body, "legacy");
  assert.equal(body.puzzle.id, `${original.puzzle.id}-7`);
  for (const event of original.puzzle.events) {
    assert.equal(body.puzzle.events.find(item => item.id === event.id).title, event.title);
    assert.equal(body.dateMap[event.id], original.dateMap[event.id]);
  }
  assert.deepEqual(body, (await getPuzzle("2026-10-03")).body);
  const dates = body.answerOrder.map(id => body.dateMap[id]);
  assert.equal(new Set(dates).size, 7);
  assert.deepEqual(dates, [...dates].sort());
  assert.ok(body.puzzle.events.every(event => event.sources.length > 0));
});

test("future Legacy generators use seven cards while daily stays five", async t => {
  t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-11-07T20:00:00Z") });
  const { body } = await getPuzzle("2026-11-07");
  assertPuzzleShape(body, "legacy");
  assert.equal(new Set(Object.values(body.dateMap)).size, 7);
  assert.ok(Object.values(body.dateMap).every(date => date <= "2026-11-07"));
  assert.equal(Object.values(body.yearMap).filter(year => year < 2025).length, 4);
  assert.equal(Object.values(body.yearMap).filter(year => year >= 2025).length, 3);
  assert.deepEqual(body, (await getPuzzle("2026-11-07")).body);
  assertPuzzleShape((await getPuzzle("2026-11-06")).body, "second-term");
});

test("future puzzles cannot leak or become accidental published challenges", async () => {
  const {response,body} = await getPuzzle(addDays(pacificDate(),1));
  assert.equal(response.status,404);
  assert.equal(body.code,"NOT_RELEASED");
});

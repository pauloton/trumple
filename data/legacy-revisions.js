import published from "./published-puzzles.json" with { type: "json" };
import { VERIFIED_LEGACY_EVENTS } from "./verified-legacy-events.js";
import { LEGACY_SEVEN_START } from "../lib/legacy-format.js";

// Explicit, owner-requested format revision. Never rewrite the original archive.
// Retain all five original card IDs and add two previously reviewed events.
const original = published[LEGACY_SEVEN_START];
const additions = ["2020-09-23", "2023-08-24"].map((date, index) => {
  const event = VERIFIED_LEGACY_EVENTS.find(event => event.date === date);
  return { ...event, id: index + 6 };
});
const dateMap = { ...original.dateMap, ...Object.fromEntries(additions.map(e => [e.id, e.date])) };
const events = [...original.puzzle.events, ...additions.map(({ id, title, hint, sources }) => ({ id, title, hint, sources }))];

export const LEGACY_REVISIONS = {
  [LEGACY_SEVEN_START]: {
    ...original,
    puzzle: { ...original.puzzle, id: `${original.puzzle.id}-7`, events },
    answerOrder: events.map(e => e.id).sort((a, b) => dateMap[a].localeCompare(dateMap[b])),
    dateMap,
    yearMap: { ...original.yearMap, ...Object.fromEntries(additions.map(e => [e.id, e.year])) },
  },
};

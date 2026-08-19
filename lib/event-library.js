import { GENERATED_EVENTS } from "../data/generated-events.js";
import { CURATED_NEWS_EVENTS } from "../data/curated-news-events.js";
import { PRESIDENTIAL_EVENTS } from "../data/presidential-events.js";
import { SEED_EVENTS } from "../data/seed-events.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const SECOND_TERM_START = "2025-01-20";

export function isRealDate(value) {
  if (!DATE_RE.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateLibraryEvent(event, { requireSources = false } = {}) {
  const errors = [];
  if (!event || typeof event !== "object") return ["event must be an object"];
  if (!/^[a-z0-9][a-z0-9-]+$/.test(event.id || "")) errors.push("id must be a lowercase slug");
  if (!isRealDate(event.date || "")) errors.push("date must be a real YYYY-MM-DD date");
  if (!event.title || event.title.length > 50) errors.push("title must be 1-50 characters");
  if (event.title?.includes("—")) errors.push("title cannot contain an em dash");
  if (event.title?.includes("...")) errors.push("title cannot end in headline ellipses");
  if (!event.hint || typeof event.hint !== "string") errors.push("hint is required");
  if (event.hint?.includes("—")) errors.push("hint cannot contain an em dash");
  if (event.hint?.includes("...")) errors.push("hint cannot contain headline ellipses");
  if (!Number.isInteger(event.significance) || event.significance < 1 || event.significance > 5) {
    errors.push("significance must be an integer from 1 to 5");
  }
  if (requireSources && (!Array.isArray(event.sources) || event.sources.length === 0)) {
    errors.push("at least one source is required");
  }
  for (const source of event.sources || []) {
    if (!source?.name || !/^https:\/\//.test(source?.url || "")) errors.push("each source needs a name and HTTPS URL");
  }
  return errors;
}

export function mergeLibrary(seed, generated) {
  const byId = new Map();
  for (const event of [...seed, ...generated]) {
    if (event.status === "candidate") continue;
    if (validateLibraryEvent(event).length === 0) byId.set(event.id, Object.freeze({ ...event }));
  }
  return [...byId.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

// The Federal Register feed is a source archive, not an editorially curated
// game library. Official documents are useful for discovery and fact-checking,
// but most are ordinary policy and their legal titles do not make good cards.
// Keep the archive available to tooling without ever serving it automatically.
export const PRESIDENTIAL_SOURCE_ARCHIVE = Object.freeze(PRESIDENTIAL_EVENTS);
const PRE_EXPANSION_GENERATED = GENERATED_EVENTS.filter((event) =>
  !event.addedAt || event.addedAt < "2026-08-19T00:00:00.000Z"
);

export const CLASSIC_SECOND_TERM_EVENTS = Object.freeze(
  mergeLibrary(SEED_EVENTS, PRE_EXPANSION_GENERATED)
);
export const FEATURED_SECOND_TERM_EVENTS = Object.freeze(
  mergeLibrary(SEED_EVENTS, [...CURATED_NEWS_EVENTS, ...GENERATED_EVENTS])
);
export const EVENT_LIBRARY = Object.freeze(
  mergeLibrary([], FEATURED_SECOND_TERM_EVENTS)
);
export const SECOND_TERM_EVENTS = Object.freeze(EVENT_LIBRARY.filter((event) => event.date >= SECOND_TERM_START));
export const LEGACY_EVENTS = Object.freeze(
  mergeLibrary([], FEATURED_SECOND_TERM_EVENTS)
);

export function isFirstSaturday(date) {
  return date.getUTCDay() === 6 && date.getUTCDate() <= 7;
}

export function previousWeekRange(sunday) {
  const end = new Date(sunday);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function weeklyEventsForSunday(sunday, events = SECOND_TERM_EVENTS, { backfillDays = 0 } = {}) {
  if (sunday.getUTCDay() !== 0) return [];
  const { start, end } = previousWeekRange(sunday);
  const earliest = new Date(`${start}T12:00:00Z`);
  earliest.setUTCDate(earliest.getUTCDate() - backfillDays);
  const earliestText = earliest.toISOString().slice(0, 10);
  const candidates = events
    .filter((event) => event.date >= earliestText && event.date <= end)
    .sort((a, b) => b.significance - a.significance || b.date.localeCompare(a.date));

  // A timeline cannot fairly order two cards with the same date, so prefer one
  // event per calendar day. The weekly edition only runs when all 7 are present.
  const byDate = new Map();
  for (const event of candidates) if (!byDate.has(event.date)) byDate.set(event.date, event);
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
}

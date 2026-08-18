import { GENERATED_EVENTS } from "../data/generated-events.js";
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

export const EVENT_LIBRARY = Object.freeze(mergeLibrary(SEED_EVENTS, GENERATED_EVENTS));
export const SECOND_TERM_EVENTS = Object.freeze(EVENT_LIBRARY.filter((event) => event.date >= SECOND_TERM_START));

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

export function weeklyEventsForSunday(sunday, events = SECOND_TERM_EVENTS) {
  if (sunday.getUTCDay() !== 0) return [];
  const { start, end } = previousWeekRange(sunday);
  const candidates = events
    .filter((event) => event.date >= start && event.date <= end)
    .sort((a, b) => b.significance - a.significance || b.date.localeCompare(a.date));

  // A timeline cannot fairly order two cards with the same date, so prefer one
  // event per calendar day. The weekly edition only runs when all 7 are present.
  const byDate = new Map();
  for (const event of candidates) if (!byDate.has(event.date)) byDate.set(event.date, event);
  return [...byDate.values()].slice(0, 7).sort((a, b) => a.date.localeCompare(b.date));
}

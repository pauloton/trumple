import { pacificDate } from "./puzzle-clock.js";

// General election date: https://www.fec.gov/documents/5910/2026pdates.pdf
export const MIDTERM_DATE = "2026-11-03";
export const DAILY_INTRO_LINES = [
  "Midterms are coming.",
  "So much chaos. Such short memories.",
  "How good is yours?",
];

export function dailyIntroCopy(now = new Date()) {
  // Calendar-day arithmetic avoids the November daylight-saving transition.
  const days = Math.round((Date.parse(`${MIDTERM_DATE}T12:00:00Z`) - Date.parse(`${pacificDate(now)}T12:00:00Z`)) / 86400000);
  return {
    lines: [days > 0 ? DAILY_INTRO_LINES[0] : days === 0 ? "Midterms are today." : "Still more chaos.", ...DAILY_INTRO_LINES.slice(1)],
    countdown: days > 0 ? `${days} ${days === 1 ? "day" : "days"} until Election Day · Nov 3` : days === 0 ? "Election Day · November 3" : null,
    stamp: days >= 0,
  };
}

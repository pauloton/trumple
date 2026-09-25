import { fileURLToPath } from "node:url";
import { isRealDate, previousWeekRange, weeklyEventsForSunday } from "../lib/event-library.js";

export function weeklyCoverage(dateText, events) {
  if (!isRealDate(dateText)) throw new Error("Use a real YYYY-MM-DD Sunday date");
  const sunday = new Date(`${dateText}T12:00:00Z`);
  if (sunday.getUTCDay() !== 0) throw new Error("Coverage must be checked for a Sunday");
  const selected = weeklyEventsForSunday(sunday, events);
  return {
    sunday: dateText, week: previousWeekRange(sunday),
    ready: selected.length === 7, count: selected.length,
    events: selected.map(({ id, date, title }) => ({ id, date, title })),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--date")) throw new Error("Usage: --date YYYY-MM-DD");
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + (7 - date.getUTCDay()) % 7);
  const result = weeklyCoverage(args[1] || date.toISOString().slice(0, 10));
  console.log(JSON.stringify(result, null, 2));
  if (!result.ready) {
    console.error(`Sunday ${result.sunday} needs ${7 - result.count} more verified stories from ${result.week.start} through ${result.week.end}. Older events are not a substitute.`);
    process.exitCode = 1;
  }
}

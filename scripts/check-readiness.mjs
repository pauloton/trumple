import { pacificDate, upcomingSunday } from "../lib/puzzle-clock.js";
import { weeklyCoverage } from "./check-weekly-coverage.mjs";

const today = pacificDate();
const coverage = weeklyCoverage(upcomingSunday(today));
console.log(JSON.stringify({today,...coverage},null,2));
if (!coverage.ready) {
  const message = `Sunday ${coverage.sunday} needs ${7-coverage.count} more verified stories from ${coverage.week.start} through ${coverage.week.end}.`;
  // Only the completed week's Sunday is a failure. Midweek is a warning,
  // never an instruction to pad the library with ordinary policy or old news.
  if (coverage.sunday === today) { console.error(`::error::${message}`); process.exitCode=1; }
  else console.warn(`::warning::${message}`);
}

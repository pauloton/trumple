import { appendFileSync } from "node:fs";
import { shouldRunRefresh } from "../lib/refresh-schedule.js";

const run = shouldRunRefresh({
  eventName: process.env.EVENT_NAME,
  schedule: process.env.EVENT_SCHEDULE,
});
if (!process.env.GITHUB_OUTPUT) throw new Error("Missing GitHub output file");
appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
console.log(run ? "Running Pacific midnight refresh (late starts allowed)." : "Skipping the other seasonal trigger.");

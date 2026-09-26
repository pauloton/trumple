import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { GET } from "../app/api/trump-puzzle/route.js";
import { pacificDate } from "../lib/puzzle-clock.js";

const today = pacificDate();
const dates = [...new Set([today,"2026-09-20","2026-09-05"])];
const expected = await Promise.all(dates.map(async date => {
  const response = await GET(new Request(`https://trumple.app/api/trump-puzzle?date=${date}`));
  assert.equal(response.status,200,`Local ${date} must be playable`);
  return response.json();
}));
let lastError;
for (let attempt=0; attempt<20; attempt++) {
  try {
    for (let index=0;index<dates.length;index++) {
      const response=await fetch(`https://www.trumple.app/api/trump-puzzle?date=${dates[index]}`, {cache:"no-store",signal:AbortSignal.timeout(15000)});
      assert.equal(response.status,200,`Live ${dates[index]} HTTP ${response.status}`);
      assert.deepEqual(await response.json(),expected[index],`Live ${dates[index]} differs from checked release`);
    }
    console.log(`Live release verified: ${dates.join(", ")}`);
    process.exit(0);
  } catch (error) { lastError=error; }
  if (attempt<19) await setTimeout(15000);
}
throw lastError;

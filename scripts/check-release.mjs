import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { pacificDate } from "../lib/puzzle-clock.js";
import { GET } from "../app/api/trump-puzzle/route.js";

const path = "data/published-puzzles.json";
const published = JSON.parse(await readFile(new URL(`../${path}`,import.meta.url),"utf8"));
// Existing snapshots are append-only. A correction needs a separate, explicit
// migration, never a silent content refresh that overwrites a shared puzzle.
let baseline = {};
try { baseline=JSON.parse(execFileSync("git",["show",`HEAD:${path}`],{encoding:"utf8",stdio:["ignore","pipe","pipe"]})); }
catch (error) { if (!/does not exist|exists on disk, but not in/.test(String(error.stderr))) throw error; }
for (const [date,body] of Object.entries(baseline)) assert.deepEqual(published[date],body,`Published puzzle changed: ${date}`);
const today=pacificDate();
const current=await GET(new Request(`https://trumple.app/api/trump-puzzle?date=${today}`));
assert.equal(current.status,200,`Today's puzzle (${today}) must be playable before release`);
assert.ok(published[today],`Run library:freeze before editing content; ${today} is not preserved`);
console.log(`Release guard passed: ${Object.keys(published).length} saved puzzles; ${today} is playable.`);

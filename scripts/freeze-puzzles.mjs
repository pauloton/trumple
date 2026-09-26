import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pacificDate, addDays } from "../lib/puzzle-clock.js";

// Run BEFORE editing playable content. Live responses are the authority.
// --local also captures newly ready puzzles AFTER live preservation and curation.
// It never replaces a saved game. Never use it instead of preserving live first.
export async function freezePuzzles({ through = pacificDate(), local = false } = {}) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(through) || Number.isNaN(Date.parse(`${through}T12:00:00Z`)) || new Date(`${through}T12:00:00Z`).toISOString().slice(0,10) !== through || through > pacificDate()) throw new Error("Cannot freeze invalid or future puzzles");
  const path = new URL("../data/published-puzzles.json", import.meta.url);
  const published = JSON.parse(await readFile(path, "utf8"));
  const { GET } = local ? await import("../app/api/trump-puzzle/route.js") : {};
  let added = 0;
  const unavailable = [];
  for (let date = "2025-01-20"; date <= through; date = addDays(date, 1)) {
    if (published[date]) continue;
    const request = new Request(`https://www.trumple.app/api/trump-puzzle?date=${date}`);
    const response = local ? await GET(request) : await fetch(request, { signal: AbortSignal.timeout(20000) });
    const body = await response.json();
    if (response.status === 503 && body.code === "WEEKLY_NOT_READY") { unavailable.push(date); continue; }
    if (!response.ok || body.puzzle?.date !== date || !body.answerOrder?.length) throw new Error(`Cannot preserve ${date}: HTTP ${response.status}`);
    published[date] = body;
    added++;
  }
  if (added) await writeFile(path, JSON.stringify(Object.fromEntries(Object.entries(published).sort()), null, 0) + "\n");
  return { through, added, total: Object.keys(published).length, unavailable };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--local")) throw new Error("Usage: npm run library:freeze [-- --local]");
  console.log(JSON.stringify(await freezePuzzles({ local: args.includes("--local") }), null, 2));
}

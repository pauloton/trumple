import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { GENERATED_EVENTS } from "../data/generated-events.js";
import { SEED_EVENTS } from "../data/seed-events.js";
import { isRealDate, validateLibraryEvent } from "../lib/event-library.js";

const OUTPUT_PATH = fileURLToPath(new URL("../data/presidential-events.js", import.meta.url));
const API_URL = "https://www.federalregister.gov/api/v1/documents.json";
const TERM_WINDOWS = [
  ["2017-01-20", "2018-12-31"],
  ["2019-01-01", "2021-01-20"],
  ["2025-01-20", null],
];
const ROUTINE_PROCLAMATION = /\b(day|week|month|weekend|anniversary|birthday|memorial|heritage month|awareness month)\b|^Death of |^Honoring the (?:Victims|Memory)/i;
const DAY_MS = 24 * 60 * 60 * 1000;

function parseArgs(argv) {
  const options = { today: new Date().toISOString().slice(0, 10), dryRun: false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--today") options.today = argv[++index];
    else if (argv[index] === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  if (!isRealDate(options.today)) throw new Error("--today must use YYYY-MM-DD");
  return options;
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWindow(start, end) {
  const url = new URL(API_URL);
  url.searchParams.append("conditions[type][]", "PRESDOCU");
  url.searchParams.set("conditions[president]", "donald-trump");
  url.searchParams.set("conditions[correction]", "0");
  url.searchParams.set("conditions[publication_date][gte]", start);
  url.searchParams.set("conditions[publication_date][lte]", end);
  url.searchParams.set("order", "oldest");
  url.searchParams.set("per_page", "1000");

  let lastError;
  for (const delay of [0, 3000, 9000]) {
    if (delay) await wait(delay);
    try {
      const response = await fetch(url, { headers: { "User-Agent": "TrumpleEditorialBot/1.0" } });
      if (response.ok) {
        const body = await response.json();
        if ((body.results || []).length < body.count) {
          throw new Error(`Federal Register window ${start} to ${end} exceeded 1000 documents`);
        }
        return body.results || [];
      }
      lastError = new Error(`Federal Register returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function canonicalTitle(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|a|an|and|of|to|in|on|for|trump|donald|presidential|order)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function nearDuplicate(event, knownEvents) {
  const words = new Set(canonicalTitle(event.title).split(" ").filter(Boolean));
  return knownEvents.some((known) => {
    const distance = Math.abs(
      new Date(`${known.date}T12:00:00Z`) - new Date(`${event.date}T12:00:00Z`)
    ) / DAY_MS;
    if (distance > 3) return false;
    const knownWords = new Set(canonicalTitle(known.title).split(" ").filter(Boolean));
    const overlap = [...words].filter((word) => knownWords.has(word)).length;
    return overlap >= Math.min(3, words.size, knownWords.size);
  });
}

function cleanOfficialTitle(value) {
  return String(value || "")
    .replaceAll("—", "-")
    .replace(/^Notice of [^-]+-\s*/i, "")
    .replace(/\bUnited States of America\b/gi, "US")
    .replace(/\bUnited States\b/gi, "US")
    .replace(/([A-Za-z])-\s+([A-Za-z])/g, "$1-$2")
    .replace(/\s+/g, " ")
    .trim();
}

function fitText(value, maximum) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= maximum) return clean;
  const clipped = clean
    .slice(0, maximum + 1)
    .replace(/\s+\S*$/, "")
    .replace(/\s+(the|and|of|to|for|with|from|in|on)$/i, "")
    .replace(/[,:;.-]+$/, "");
  return clipped.length >= 12 ? clipped : clean.slice(0, maximum).trim();
}

function compactTopic(value) {
  return value
    .replace(/^the\s+/i, "")
    .replace(/\s+(?:Pursuant to|Under)\s+.+$/i, "")
    .replace(/\s+and\s+Ensuring\s+.+$/i, "")
    .replace(/\s+and\s+Providing\s+.+$/i, "")
    .trim();
}

export function gameTitleForDocument(document) {
  const official = cleanOfficialTitle(document.title);
  const rules = [
    [/^Continuation of the National Emergency With Respect to (.+)$/i, (topic) => `Keeps the ${topic} emergency running`],
    [/^Continuation of the National Emergencies With Respect to (.+)$/i, (topic) => `Keeps the ${topic} emergencies running`],
    [/^Continuation of (.+)$/i, (topic) => `Keeps ${topic} running`],
    [/^Further Continuance of (.+)$/i, (topic) => `Keeps ${topic} alive`],
    [/^Adjusting Imports of (.+?)(?: Into the US)?$/i, (topic) => `Tweaks imports of ${topic}`],
    [/^Establishing (.+)$/i, (topic) => `Creates ${topic}`],
    [/^Ending (.+)$/i, (topic) => `Orders an end to ${topic}`],
    [/^Restoring (.+)$/i, (topic) => `Orders ${topic} restored`],
    [/^Protecting (.+)$/i, (topic) => `Orders protections for ${topic}`],
    [/^Strengthening (.+)$/i, (topic) => `Orders ${topic} strengthened`],
    [/^Revocation of (.+)$/i, (topic) => `Revokes ${topic}`],
    [/^Revoking (.+)$/i, (topic) => `Revokes ${topic}`],
    [/^Amending (.+)$/i, (topic) => `Rewrites ${topic}`],
    [/^Modifying (.+)$/i, (topic) => `Reworks ${topic}`],
    [/^Imposing (.+)$/i, (topic) => `Imposes ${topic}`],
    [/^Addressing (.+)$/i, (topic) => `Takes aim at ${topic}`],
    [/^Designating (.+)$/i, (topic) => `Designates ${topic}`],
    [/^Authorizing (.+)$/i, (topic) => `Authorizes ${topic}`],
    [/^Promoting (.+)$/i, (topic) => `Orders a push for ${topic}`],
    [/^Ensuring (.+)$/i, (topic) => `Orders ${topic}`],
    [/^Making (.+)$/i, (topic) => `Orders ${topic}`],
    [/^Delegation of Authority Under (.+)$/i, (topic) => `Delegates authority under ${topic}`],
    [/^Presidential Determination(?: and Certification)?(?:.+?\bon| with Respect to) (.+)$/i, (topic) => `Signs off on ${topic}`],
    [/^Presidential Determination.+\bon (.+)$/i, (topic) => `Signs off on ${topic}`],
  ];

  for (const [pattern, build] of rules) {
    const match = official.match(pattern);
    if (match) return fitText(build(compactTopic(match[1])), 50);
  }
  return fitText(`Signs off on ${compactTopic(official)}`, 50);
}

function significanceFor(title) {
  if (/war|military|nuclear|emergency|tariff|sanction|border|immigration|deport|pardon|citizenship|election|court|crime|drug|cyber|intelligence|withdraw/i.test(title)) return 4;
  if (/trade|energy|government|agency|commission|security|education|health|defense|foreign|federal/i.test(title)) return 3;
  return 2;
}

function hintFor(document) {
  const official = cleanOfficialTitle(document.title);
  const shortOfficial = fitText(official, 108);
  const templates = [
    `The Federal Register made it official: "${shortOfficial}." The fine print joined the plot.`,
    `The presidential record calls it "${shortOfficial}." The paperwork arrived with consequences.`,
    `Official paperwork followed under "${shortOfficial}." Yes, it came with a presidential seal.`,
  ];
  const index = [...String(document.document_number)].reduce((sum, char) => sum + char.charCodeAt(0), 0) % templates.length;
  return templates[index];
}

export function archiveEventForDocument(document) {
  if (!isRealDate(document?.publication_date) || !document?.document_number || !document?.html_url) return null;
  if (!document.title || ROUTINE_PROCLAMATION.test(document.title)) return null;
  const event = {
    id: `fr-${String(document.document_number).toLowerCase()}`,
    date: document.publication_date,
    title: gameTitleForDocument(document),
    hint: hintFor(document),
    significance: significanceFor(document.title),
    sources: [{ name: "Federal Register", url: document.html_url }],
    status: "approved",
  };
  return validateLibraryEvent(event, { requireSources: true }).length === 0 ? event : null;
}

function generatedModule(events) {
  return `// This file is generated from official Federal Register presidential documents.\n// Run npm run library:archive to refresh it.\nexport const PRESIDENTIAL_EVENTS = ${JSON.stringify(events, null, 2)};\n`;
}

export async function buildArchive({ today, dryRun = false }) {
  const documents = [];
  for (const [start, fixedEnd] of TERM_WINDOWS) {
    const end = fixedEnd || today;
    if (start <= end) documents.push(...await fetchWindow(start, end));
  }

  const known = [...SEED_EVENTS, ...GENERATED_EVENTS];
  const accepted = [];
  for (const document of documents) {
    const event = archiveEventForDocument(document);
    if (!event || nearDuplicate(event, [...known, ...accepted])) continue;
    accepted.push(event);
  }
  accepted.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  const nextModule = generatedModule(accepted);
  const previous = await readFile(OUTPUT_PATH, "utf8").catch(() => "");
  if (!dryRun && nextModule !== previous) await writeFile(OUTPUT_PATH, nextModule);
  return {
    documents: documents.length,
    accepted: accepted.length,
    secondTerm: accepted.filter((event) => event.date >= "2025-01-20").length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await buildArchive(parseArgs(process.argv.slice(2))), null, 2));
}

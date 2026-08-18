import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { GENERATED_EVENTS } from "../data/generated-events.js";
import { SEED_EVENTS } from "../data/seed-events.js";
import { EVENT_LIBRARY, isRealDate, validateLibraryEvent } from "../lib/event-library.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../data/generated-events.js", import.meta.url));
const TRUSTED_DOMAINS = new Set([
  "apnews.com", "reuters.com", "bbc.com", "bbc.co.uk", "npr.org",
  "politico.com", "axios.com", "abcnews.go.com", "cbsnews.com",
  "nbcnews.com", "cnn.com", "foxnews.com", "theguardian.com",
  "nytimes.com", "washingtonpost.com", "wsj.com", "usatoday.com",
  "pbs.org", "time.com", "thehill.com", "whitehouse.gov",
  "congress.gov", "justice.gov", "defense.gov", "state.gov",
  "supremecourt.gov", "federalregister.gov",
]);

function parseArgs(argv) {
  const options = { today: new Date().toISOString().slice(0, 10), dryRun: false, fixture: null };
  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === "--today") options.today = argv[++index];
    else if (argv[index] === "--fixture") options.fixture = argv[++index];
    else if (argv[index] === "--dry-run") options.dryRun = true;
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  if (!isRealDate(options.today)) throw new Error("--today must use YYYY-MM-DD");
  return options;
}

function dateWindow(todayText) {
  const today = new Date(`${todayText}T12:00:00Z`);
  const end = new Date(today);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    startStamp: `${start.toISOString().slice(0, 10).replaceAll("-", "")}000000`,
    endStamp: `${end.toISOString().slice(0, 10).replaceAll("-", "")}235959`,
  };
}

function normalizeDomain(value) {
  return (value || "").toLowerCase().replace(/^www\./, "");
}

function trustedDomain(value) {
  const domain = normalizeDomain(value);
  return [...TRUSTED_DOMAINS].some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}

function canonicalTitle(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(the|a|an|and|of|to|in|on|for|trump|donald)\b/g, " ")
    .replace(/\b([a-z]{4,})s\b/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 38).replace(/-$/, "");
}

function dedupeArticles(articles) {
  const seen = new Set();
  return articles.filter((article) => {
    if (!article?.url || !article?.title || !trustedDomain(article.domain)) return false;
    const key = `${normalizeDomain(article.domain)}:${canonicalTitle(article.title)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 140);
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchWithRetry(url, options) {
  const delays = [0, 3000, 9000];
  let lastResponse;
  let lastError;
  for (const delay of delays) {
    if (delay) await wait(delay);
    try {
      lastResponse = await fetch(url, options);
    } catch (error) {
      lastError = error;
      continue;
    }
    if (lastResponse.ok) return lastResponse;
    if (lastResponse.status !== 429 && lastResponse.status < 500) return lastResponse;
  }
  if (lastResponse) return lastResponse;
  throw lastError;
}

function decodeXml(value) {
  return (value || "")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function tagValue(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]?.trim());
}

function sourceDomain(item) {
  const sourceUrl = item.match(/<source[^>]+url="([^"]+)"/i)?.[1];
  try {
    return new URL(decodeXml(sourceUrl)).hostname;
  } catch {
    return "";
  }
}

async function fetchGoogleNews(window) {
  const after = new Date(`${window.start}T12:00:00Z`);
  after.setUTCDate(after.getUTCDate() - 1);
  const before = new Date(`${window.end}T12:00:00Z`);
  before.setUTCDate(before.getUTCDate() + 1);
  const query = `Donald Trump after:${after.toISOString().slice(0, 10)} before:${before.toISOString().slice(0, 10)}`;
  const url = new URL("https://news.google.com/rss/search");
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");

  const response = await fetch(url, { headers: { "User-Agent": "TrumpleEditorialBot/1.0" } });
  if (!response.ok) throw new Error(`Google News returned ${response.status}`);
  const xml = await response.text();
  const articles = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const item = match[1];
    const published = new Date(tagValue(item, "pubDate"));
    return {
      title: tagValue(item, "title").replace(/\s+-\s+[^-]+$/, ""),
      url: tagValue(item, "link"),
      domain: sourceDomain(item),
      seendate: Number.isNaN(published.getTime())
        ? null
        : published.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14),
    };
  });
  return dedupeArticles(articles);
}

async function fetchArticles(window) {
  const query = '("Donald Trump" OR "President Trump") sourcelang:english';
  const url = new URL("https://api.gdeltproject.org/api/v2/doc/doc");
  url.searchParams.set("query", query);
  url.searchParams.set("mode", "artlist");
  url.searchParams.set("format", "json");
  url.searchParams.set("sort", "datedesc");
  url.searchParams.set("maxrecords", "250");
  url.searchParams.set("startdatetime", window.startStamp);
  url.searchParams.set("enddatetime", window.endStamp);

  try {
    const response = await fetchWithRetry(url, { headers: { "User-Agent": "TrumpleEditorialBot/1.0" } });
    if (response.ok) {
      const body = await response.json();
      const articles = dedupeArticles(body.articles || []);
      if (articles.length >= 20) return articles;
      const supplemental = await fetchGoogleNews(window);
      return dedupeArticles([...articles, ...supplemental]);
    }
    console.warn(`GDELT unavailable (${response.status}); using Google News RSS.`);
  } catch (error) {
    console.warn(`GDELT unavailable (${error.cause?.code || error.message}); using Google News RSS.`);
  }
  return fetchGoogleNews(window);
}

function sourceName(article) {
  const domain = normalizeDomain(article.domain);
  if (domain === "apnews.com") return "Associated Press";
  if (domain === "reuters.com") return "Reuters";
  if (domain === "bbc.com") return "BBC";
  if (domain === "nbcnews.com") return "NBC News";
  if (domain === "pbs.org") return "PBS";
  if (domain === "politico.com") return "Politico";
  if (domain === "theguardian.com") return "The Guardian";
  if (domain === "washingtonpost.com") return "The Washington Post";
  return domain;
}

function articleDate(article) {
  const stamp = String(article.seendate || "").replace(/\D/g, "");
  if (stamp.length < 8) return null;
  const date = `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`;
  return isRealDate(date) ? date : null;
}

function candidateTitle(headline) {
  let title = headline
    .replaceAll("—", "-")
    .replace(/^(?:President\s+|Donald\s+)?Trump(?:'s|’s)?\s*[:,-]?\s*/i, "")
    .trim();
  title = title ? title[0].toUpperCase() + title.slice(1) : title;
  if (title.length > 50) title = `${title.slice(0, 47).replace(/\s+\S*$/, "")}...`;
  return title;
}

const DIRECT_ACTION = /^(announces?|appoints?|approves?|backs?|bans?|calls?|cancels?|claims?|confirms?|cuts?|demands?|deploys?|dismisses?|empowers?|extends?|fires?|grants?|heads?|hosts?|launches?|orders?|pardons?|pulls?|refuses?|scales?|says?|shows?|signs?|stumps?|sues?|threatens?|travels?|unveils?|visits?|vows?|wears?)\b/i;
const NON_EVENT_HEADLINE = /^(analysis|fact[- ]?check|how |inside |opinion|photos?|poll|preview|what |why )/i;

function shortText(value, maxLength) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}.`;
}

function automaticTitle(headline) {
  const cleaned = headline
    .replaceAll("—", "-")
    .replace(/^(?:the latest|news wrap|watch|video):\s*/i, "")
    .trim();
  if (NON_EVENT_HEADLINE.test(cleaned)) return null;

  const match = cleaned.match(/^(?:President\s+|Donald\s+)?Trump\s+(.+)$/i);
  if (!match) return null;
  let action = match[1]
    .replace(/\bexecutive order\b/gi, "order")
    .replace(/\bUnited States\b/g, "US")
    .replace(/\bU\.S\.\b/g, "US")
    .replace(/\bjoint military exercises with South Korea\b/gi, "Korea military drills")
    .replace(/\bmilitary exercises\b/gi, "military drills")
    .split(/[,;]\s/)[0]
    .trim();
  action = action.split(/\s+(?:because|that|while|which|who)\s+/i)[0].trim();
  if (!DIRECT_ACTION.test(action) || action.includes("?")) return null;
  if (action.length > 50) return null;
  return action[0].toUpperCase() + action.slice(1);
}

function candidateSignificance(title) {
  const strong = /war|strike|tariff|pardon|fire[sd]?|order|deploy|ban|court|indict|arrest|ceasefire|emergency|military/i;
  const medium = /announce|threat|claim|sign|meeting|deal|speech|visit|appoint/i;
  return strong.test(title) ? 4 : medium.test(title) ? 3 : 2;
}

export function curateArticles(articles, window) {
  const byDate = new Map();
  articles.forEach((article, sourceIndex) => {
    const date = articleDate(article);
    if (!date || date < window.start || date > window.end) return;
    const approvedTitle = automaticTitle(article.title);
    const title = approvedTitle || candidateTitle(article.title);
    if (!title) return;
    const candidates = byDate.get(date) || [];
    candidates.push({
      date,
      title,
      hint: approvedTitle
        ? shortText(`${sourceName(article)} had to report it: ${article.title.replaceAll("—", "-")}. Yes, really.`, 180)
        : `${sourceName(article)} reported this candidate. It did not pass automatic publication checks.`,
      significance: candidateSignificance(title),
      source_indexes: [sourceIndex],
      status: approvedTitle ? "approved" : "candidate",
    });
    byDate.set(date, candidates);
  });

  return [...byDate.values()].flatMap((candidates) =>
    candidates.sort((a, b) =>
      Number(b.status === "approved") - Number(a.status === "approved") ||
      b.significance - a.significance ||
      a.title.localeCompare(b.title)
    ).slice(0, 4)
  ).slice(0, 28);
}

function isNearDuplicate(event, existing) {
  const candidateWords = new Set(canonicalTitle(event.title).split(" ").filter(Boolean));
  return existing.some((known) => {
    if (known.id === event.id) return true;
    const dayDistance = Math.abs(
      new Date(`${known.date}T12:00:00Z`) - new Date(`${event.date}T12:00:00Z`)
    ) / (24 * 60 * 60 * 1000);
    if (dayDistance > 2) return false;
    const knownWords = new Set(canonicalTitle(known.title).split(" ").filter(Boolean));
    const overlap = [...candidateWords].filter((word) => knownWords.has(word)).length;
    return overlap >= Math.min(3, candidateWords.size, knownWords.size);
  });
}

function materializeEvents(rawEvents, articles, window) {
  const accepted = [];
  const approvedDates = new Set();
  const rankedRawEvents = [...rawEvents].sort((a, b) =>
    a.date.localeCompare(b.date) ||
    Number(b.status === "approved") - Number(a.status === "approved") ||
    b.significance - a.significance
  );
  for (const raw of rankedRawEvents) {
    if (!isRealDate(raw.date) || raw.date < window.start || raw.date > window.end) continue;
    const sources = [...new Set(raw.source_indexes)]
      .map((index) => articles[index])
      .filter(Boolean)
      .map((article) => ({ name: sourceName(article), url: article.url }));
    const event = {
      id: `${raw.date}-${slugify(raw.title)}`,
      date: raw.date,
      title: raw.title.replaceAll("—", "-").trim(),
      hint: raw.hint.replaceAll("—", "-").trim(),
      significance: raw.significance,
      sources,
      status: raw.status === "approved" ? "approved" : "candidate",
      addedAt: new Date().toISOString(),
    };
    if (validateLibraryEvent(event, { requireSources: true }).length > 0) continue;
    const acceptedApproved = accepted.filter((known) => known.status === "approved");
    if (isNearDuplicate(event, [...EVENT_LIBRARY, ...acceptedApproved])) continue;
    if (event.status === "approved" && approvedDates.has(event.date)) {
      event.status = "candidate";
    }
    if (event.status === "approved") approvedDates.add(event.date);
    accepted.push(event);
  }
  return accepted.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

function generatedModule(events) {
  return `// This file is maintained by scripts/refresh-event-library.mjs.\n// Only events that pass automatic publication checks are written here.\nexport const GENERATED_EVENTS = ${JSON.stringify(events, null, 2)};\n`;
}

export function mergeApprovedGenerated(existing, additions) {
  const merged = [];
  const dates = new Set(SEED_EVENTS.map((event) => event.date));
  for (const event of [...existing, ...additions].sort((a, b) =>
    a.date.localeCompare(b.date) || b.significance - a.significance || a.id.localeCompare(b.id)
  )) {
    if (dates.has(event.date)) continue;
    if (isNearDuplicate(event, [...SEED_EVENTS, ...merged])) continue;
    dates.add(event.date);
    merged.push(event);
  }
  return merged;
}

export async function refreshLibrary(options) {
  const window = dateWindow(options.today);
  let articles;
  let rawEvents;

  if (options.fixture) {
    const fixturePath = new URL(options.fixture, `file://${ROOT}/`);
    const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
    articles = dedupeArticles(fixture.articles || []);
    rawEvents = Array.isArray(fixture.events)
      ? fixture.events
      : curateArticles(articles, window);
  } else {
    articles = await fetchArticles(window);
    rawEvents = curateArticles(articles, window);
  }

  const additions = materializeEvents(rawEvents, articles, window);
  const approvedAdditions = additions.filter((event) => event.status === "approved");
  const merged = mergeApprovedGenerated(GENERATED_EVENTS, approvedAdditions);
  const nextModule = generatedModule(merged);
  if (!options.dryRun && nextModule !== await readFile(OUTPUT_PATH, "utf8")) {
    await writeFile(OUTPUT_PATH, nextModule);
  }
  return {
    window,
    articleCount: articles.length,
    approvedCount: approvedAdditions.length,
    rejectedCount: additions.length - approvedAdditions.length,
    additions,
    total: SEED_EVENTS.length + merged.length,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await refreshLibrary(parseArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}

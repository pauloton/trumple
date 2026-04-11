#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

const API_KEY = process.env.ANTHROPIC_API_KEY;
const EDITION = process.env.EDITION || 'both';
const ROUTE_PATH = 'app/api/trump-puzzle/route.js';

if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set.');
  process.exit(1);
}

const BRAND_RULES = `
TRUMPLE EVENT RULES — follow every rule, no exceptions:
- Trump only. No other politicians, cabinet members, or policy announcements.
- Every event must trigger either ridicule or outrage. No dry policy moments.
- Max 50 characters per title — count carefully. This is a HARD LIMIT.
- No em dashes. Use commas or colons instead.
- Sardonic voice throughout.
- Events must be real and verifiable.
`;

function buildWeeklyPrompt() {
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  const dateRange = `${weekAgo.toDateString()} to ${today.toDateString()}`;
  return `You are writing content for Trumple, a daily timeline-sorting game for a liberal/anti-Trump audience.

${BRAND_RULES}

Generate exactly 7 Trump events from the past week (${dateRange}).
Players sort them chronologically so they must be from clearly different moments.
The hint field should include the day (e.g. "Apr 8.") and a short sardonic note.

Return ONLY a valid JSON array, no preamble, no markdown fences.
Format exactly like this:
[
  { "title": "Short sardonic title here", "hint": "Apr 8. One sardonic sentence." }
]

Return exactly 7 objects, sorted oldest to newest.`;
}

function buildSecondTermPrompt() {
  return `You are writing content for Trumple, a daily timeline-sorting game for a liberal/anti-Trump audience.

${BRAND_RULES}

Generate exactly 10 NEW Trump events from his second term (January 20, 2025 to present).
These will be added to a standing pool. Choose events that are real, specific, spread across different months, and either absurd or alarming.
The hint field should be 1-2 short sardonic sentences of context.

Return ONLY a valid JSON array, no preamble, no markdown fences.
Format exactly like this:
[
  { "date": "2025-01-25", "title": "Short sardonic title here", "hint": "One sardonic sentence." }
]

Return exactly 10 objects, sorted oldest to newest by date.`;
}

async function callClaude(prompt) {
  console.log('Calling Claude API...');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  const text = data.content?.[0]?.text?.trim();
  if (!text) throw new Error('Empty response from Claude API');
  return text;
}

function parseEvents(raw, label) {
  let events;
  try {
    const cleaned = raw.replace(/^```[a-z]*\n?/m, '').replace(/```$/m, '').trim();
    events = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse JSON for ${label}:\n${raw}`);
  }
  if (!Array.isArray(events)) throw new Error(`${label} response is not an array`);
  for (const ev of events) {
    if (!ev.title?.trim()) throw new Error(`Missing title: ${JSON.stringify(ev)}`);
    ev.title = ev.title.trim().substring(0, 50);
    ev.hint = ev.hint?.trim() || '';
  }
  return events;
}

function patchWeeklyEvents(source, events) {
  const lines = events.map((ev, i) => {
    const title = ev.title.replace(/"/g, '\\"');
    const hint = ev.hint.replace(/"/g, '\\"');
    return `  { id: ${i + 1}, title: "${title}", hint: "${hint}" }`;
  });
  const newArray = `[\n${lines.join(',\n')}\n]`;
  const pattern = /(const WEEKLY_EVENTS\s*=\s*)\[[\s\S]*?\](\s*;)/;
  const patched = source.replace(pattern, `$1${newArray}$2`);
  if (patched === source) throw new Error('Could not find WEEKLY_EVENTS in route.js');
  return patched;
}

function appendSecondTermEvents(source, newEvents) {
  const idMatches = [...source.matchAll(/id:\s*"st(\d+)"/g)];
  const maxId = idMatches.reduce((max, m) => Math.max(max, parseInt(m[1])), 0);
  console.log(`Highest existing st ID: st${maxId}`);
  let nextId = maxId + 1;
  const newLines = [];
  for (const ev of newEvents) {
    const escaped = ev.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`title:\\s*"${escaped}"`).test(source)) {
      console.warn(`DUPLICATE skipped: "${ev.title}"`);
      continue;
    }
    const title = ev.title.replace(/"/g, '\\"');
    const hint = ev.hint.replace(/"/g, '\\"');
    newLines.push(`  { id: "st${nextId++}",  title: "${title}",  hint: "${hint}" }`);
  }
  const pattern = /(const SECOND_TERM_EVENTS\s*=\s*\[[\s\S]*?)(\]\s*;)/;
  if (!pattern.test(source)) throw new Error('Could not find SECOND_TERM_EVENTS in route.js');
  return source.replace(pattern, `$1,\n${newLines.join(',\n')}\n$2`);
}

async function main() {
  console.log(`Running generate-events.mjs | edition=${EDITION}`);
  let source;
  try {
    source = readFileSync(ROUTE_PATH, 'utf8');
    console.log(`Read route.js (${source.length} chars)`);
  } catch (e) {
    throw new Error(`Cannot read route.js at ${ROUTE_PATH}: ${e.message}`);
  }

  if (EDITION === 'both' || EDITION === 'weekly') {
    console.log('\n=== WEEKLY EDITION ===');
    const raw = await callClaude(buildWeeklyPrompt());
    console.log('Raw response:\n', raw);
    const events = parseEvents(raw, 'WEEKLY');
    events.forEach((e, i) => console.log(`  [${i+1}] ${e.title} (${e.title.length}c)`));
    source = patchWeeklyEvents(source, events);
    console.log('✓ WEEKLY_EVENTS patched');
  }

  if (EDITION === 'both' || EDITION === 'second-term') {
    console.log('\n=== 2ND TERM EDITION ===');
    const raw = await callClaude(buildSecondTermPrompt());
    console.log('Raw response:\n', raw);
    const events = parseEvents(raw, 'SECOND_TERM');
    events.forEach(e => console.log(`  [${e.date}] ${e.title} (${e.title.length}c)`));
    source = appendSecondTermEvents(source, events);
    console.log('✓ SECOND_TERM_EVENTS appended');
  }

  writeFileSync(ROUTE_PATH, source, 'utf8');
  console.log('\n✓ route.js written. Done.');
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});

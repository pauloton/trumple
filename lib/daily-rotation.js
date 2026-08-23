const DAY_MS = 24 * 60 * 60 * 1000;

const STORY_PATTERNS = [
  ["white-house-ufc", /\b(?:ufc|octagon|fight arena)\b/i],
  ["white-house-ballroom", /\b(?:ballroom|east wing)\b/i],
  ["kennedy-center", /\bkennedy\b/i],
  ["epstein", /\bepstein\b/i],
  ["greenland", /\bgreenland\b/i],
  ["iran-conflict", /\b(?:iran|hormuz)\b/i],
  ["trump-musk", /\b(?:musk|doge)\b/i],
  ["harvard", /\bharvard\b/i],
  ["e-jean-carroll", /\b(?:e\. jean|carroll)\b/i],
  ["irs-settlement", /\b(?:irs|tax shield)\b/i],
  ["gaza", /\bgaza\b/i],
  ["los-angeles", /\b(?:los angeles|\bla\b)\b/i],
  ["tariffs", /\btariffs?\b/i],
  ["2020-election", /\b(?:2020 election|2020 fraud|relitigate 2020)\b/i],
  ["sombrero-memes", /\bsombrero\b/i],
];

export function storyKey(event) {
  if (event.storyKey) return event.storyKey;
  const searchable = `${event.id || ""} ${event.title || ""}`;
  return STORY_PATTERNS.find(([, pattern]) => pattern.test(searchable))?.[0] || null;
}

export const DAILY_ROTATION_RULES = Object.freeze({
  cardsPerPuzzle: 7,
  newPerPuzzle: 5,
  freshPerPuzzle: 4,
  recentPerPuzzle: 2,
  recentWindowDays: 120,
  lookbackDays: 7,
  maxAppearancesPerWeek: 2,
  allowConsecutiveDays: false,
});

function ordinal(dateText) {
  return Math.floor(Date.parse(`${dateText}T12:00:00Z`) / DAY_MS);
}

function dateForOrdinal(day) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

function hashText(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ranked(events, dateText, season) {
  const today = ordinal(dateText);
  return [...events].sort((a, b) => {
    const ageA = Math.max(0, today - ordinal(a.date));
    const ageB = Math.max(0, today - ordinal(b.date));
    const freshnessA = ageA <= 120 ? 0.12 : ageA <= 365 ? 0.06 : 0;
    const freshnessB = ageB <= 120 ? 0.12 : ageB <= 365 ? 0.06 : 0;
    const scoreA = hashText(`${season}:${dateText}:${a.id}`) / 0xffffffff + freshnessA + (a.significance || 2) * 0.018;
    const scoreB = hashText(`${season}:${dateText}:${b.id}`) / 0xffffffff + freshnessB + (b.significance || 2) * 0.018;
    return scoreB - scoreA || a.id.localeCompare(b.id);
  });
}

export function createDailyRotationSelector(events, {
  startDate = "2025-01-20",
  season = 2026,
  rules = DAILY_ROTATION_RULES,
} = {}) {
  const pool = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
  const startDay = ordinal(startDate);
  const puzzles = new Map();
  const history = [];
  let builtThrough = startDay - 1;

  const buildDay = (day) => {
    const dateText = dateForOrdinal(day);
    let available = pool.filter((event) => event.date <= dateText);
    if (new Set(available.map((event) => event.date)).size < rules.cardsPerPuzzle) available = pool;

    const previousWeek = history.slice(-rules.lookbackDays);
    const previousSix = history.slice(-(rules.lookbackDays - 1));
    const yesterday = new Set((history.at(-1) || []).map((event) => event.id));
    const recentlySeen = new Set(previousWeek.flat().map((event) => event.id));
    const everSeen = new Set(history.flat().map((event) => event.id));
    const weeklyCounts = new Map();
    for (const event of previousSix.flat()) {
      weeklyCounts.set(event.id, (weeklyCounts.get(event.id) || 0) + 1);
    }

    const eligible = available.filter((event) =>
      (rules.allowConsecutiveDays || !yesterday.has(event.id)) &&
      (weeklyCounts.get(event.id) || 0) < rules.maxAppearancesPerWeek
    );
    const ordered = ranked(eligible, dateText, season);
    const selected = [];
    const selectedDates = new Set();
    const selectedStories = new Set();

    const canAdd = (event) => {
      const key = storyKey(event);
      return !selectedDates.has(event.date) &&
        !selected.some((known) => known.id === event.id) &&
        (!key || !selectedStories.has(key));
    };

    const remember = (event) => {
      selected.push(event);
      selectedDates.add(event.date);
      const key = storyKey(event);
      if (key) selectedStories.add(key);
    };

    const add = (candidates, target) => {
      for (const event of candidates) {
        if (selected.length >= target) break;
        if (!canAdd(event)) continue;
        remember(event);
      }
    };
    const addUntil = (candidates, predicate, minimum) => {
      for (const event of candidates) {
        if (selected.length >= rules.cardsPerPuzzle) break;
        if (selected.filter(predicate).length >= minimum) break;
        if (!canAdd(event)) continue;
        remember(event);
      }
    };
    const addRelaxed = (candidates, target) => {
      for (const event of candidates) {
        if (selected.length >= target) break;
        if (selectedDates.has(event.date) || selected.some((known) => known.id === event.id)) continue;
        selected.push(event);
        selectedDates.add(event.date);
      }
    };

    const fresh = ordered.filter((event) => !recentlySeen.has(event.id));
    const globallyNew = ordered.filter((event) => !everSeen.has(event.id));
    const globallyNewRecent = globallyNew.filter((event) => day - ordinal(event.date) <= rules.recentWindowDays);
    const recentFresh = fresh.filter((event) => day - ordinal(event.date) <= rules.recentWindowDays);
    const isRecent = (event) => day - ordinal(event.date) <= rules.recentWindowDays;
    const isGloballyNew = (event) => !everSeen.has(event.id);
    addUntil(globallyNewRecent, isRecent, rules.recentPerPuzzle);
    addUntil(globallyNew, isGloballyNew, rules.newPerPuzzle);
    addUntil(recentFresh, isRecent, rules.recentPerPuzzle);
    add(fresh, rules.freshPerPuzzle);
    add(ordered, rules.cardsPerPuzzle);

    // This only matters during the tiny launch-period pool. Once the archive
    // has seven distinct dates, the stronger rules above always satisfy a day.
    if (selected.length < rules.cardsPerPuzzle) {
      addRelaxed(ranked(available.filter((event) => !yesterday.has(event.id)), dateText, season), rules.cardsPerPuzzle);
      addRelaxed(ranked(available, dateText, season), rules.cardsPerPuzzle);
    }

    if (selected.length !== rules.cardsPerPuzzle) {
      throw new Error(`Unable to build a ${rules.cardsPerPuzzle}-card puzzle for ${dateText}`);
    }

    const puzzle = selected.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    puzzles.set(dateText, puzzle);
    history.push(puzzle);
    builtThrough = day;
  };

  return (dateText) => {
    const targetDay = ordinal(dateText);
    if (!Number.isFinite(targetDay) || targetDay < startDay) return [];
    while (builtThrough < targetDay) buildDay(builtThrough + 1);
    return puzzles.get(dateText) || [];
  };
}

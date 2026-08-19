const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_ROTATION_RULES = Object.freeze({
  cardsPerPuzzle: 7,
  freshPerPuzzle: 4,
  editorialPerPuzzle: 3,
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

    const add = (candidates, target) => {
      for (const event of candidates) {
        if (selected.length >= target) break;
        if (selectedDates.has(event.date) || selected.some((known) => known.id === event.id)) continue;
        selected.push(event);
        selectedDates.add(event.date);
      }
    };
    const addUntil = (candidates, predicate, minimum) => {
      for (const event of candidates) {
        if (selected.filter(predicate).length >= minimum) break;
        if (selectedDates.has(event.date) || selected.some((known) => known.id === event.id)) continue;
        selected.push(event);
        selectedDates.add(event.date);
      }
    };

    const fresh = ordered.filter((event) => !recentlySeen.has(event.id));
    const recentFresh = fresh.filter((event) => day - ordinal(event.date) <= rules.recentWindowDays);
    const isEditorial = (event) => !event.id.startsWith("fr-");
    const isRecent = (event) => day - ordinal(event.date) <= rules.recentWindowDays;
    addUntil(fresh.filter(isEditorial), isEditorial, rules.editorialPerPuzzle);
    addUntil(recentFresh, isRecent, rules.recentPerPuzzle);
    add(fresh, rules.freshPerPuzzle);
    add(ordered, rules.cardsPerPuzzle);

    // This only matters during the tiny launch-period pool. Once the archive
    // has seven distinct dates, the stronger rules above always satisfy a day.
    if (selected.length < rules.cardsPerPuzzle) {
      add(ranked(available.filter((event) => !yesterday.has(event.id)), dateText, season), rules.cardsPerPuzzle);
      add(ranked(available, dateText, season), rules.cardsPerPuzzle);
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

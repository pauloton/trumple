const DAY_MS = 24 * 60 * 60 * 1000;

function dayNumber(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null;
  const time = Date.parse(`${date}T12:00:00Z`);
  if (Number.isNaN(time) || new Date(time).toISOString().slice(0, 10) !== date) return null;
  return Math.floor(time / DAY_MS);
}

function normalizedResults(results) {
  const byDate = new Map();
  for (const result of Array.isArray(results) ? results : []) {
    if (dayNumber(result?.date) === null) continue;
    const previous = byDate.get(result.date);
    const normalized = {
      ...previous,
      ...result,
      date: result.date,
      won: Boolean(result.won || previous?.won),
    };
    if (!Number.isFinite(normalized.timeMs) || normalized.timeMs <= 0) delete normalized.timeMs;
    if (!Number.isInteger(normalized.stars) || normalized.stars < 0 || normalized.stars > 3) delete normalized.stars;
    byDate.set(result.date, normalized);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function recordDailyResult(results, date, won, details = {}) {
  if (dayNumber(date) === null) return normalizedResults(results).slice(-400);
  return normalizedResults([...(Array.isArray(results) ? results : []), { ...details, date, won }]).slice(-400);
}

export function dailyResultForDate(results, date) {
  if (dayNumber(date) === null) return null;
  return normalizedResults(results).find(result => result.date === date) || null;
}

export function calculateCurrentStreak(results, asOfDate = null) {
  const days = normalizedResults(results);
  if (days.length === 0 || !days.at(-1).won) return 0;

  if (asOfDate && dayNumber(asOfDate) !== null) {
    const gap = dayNumber(asOfDate) - dayNumber(days.at(-1).date);
    if (gap > 1) return 0;
  }

  let streak = 1;
  for (let index = days.length - 1; index > 0; index -= 1) {
    const current = days[index];
    const previous = days[index - 1];
    if (!previous.won || dayNumber(current.date) - dayNumber(previous.date) !== 1) break;
    streak += 1;
  }
  return streak;
}

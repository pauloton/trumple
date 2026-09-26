export const PUZZLE_TIME_ZONE = "America/Los_Angeles";

export function pacificDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: PUZZLE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

// Find the next Pacific date boundary rather than assuming every day is 24h.
export function nextPacificMidnight(now = new Date()) {
  const today = pacificDate(now);
  let low = now.getTime();
  let high = low + 26 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (pacificDate(new Date(middle)) === today) low = middle;
    else high = middle;
  }
  return high;
}

export function addDays(date, days) {
  return new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
}

export function upcomingSunday(date = pacificDate()) {
  return addDays(date, (7 - new Date(`${date}T12:00:00Z`).getUTCDay()) % 7);
}

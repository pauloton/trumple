const DEFAULT_ORIGIN = "https://trumple.app";

export function challengeUrl(puzzleDate, origin = DEFAULT_ORIGIN) {
  const url = new URL("/", origin);
  if (/^\d{4}-\d{2}-\d{2}$/.test(puzzleDate || "")) url.searchParams.set("date", puzzleDate);
  url.searchParams.set("challenge", "1");
  return url.toString();
}

export function winningShareText({ display, stars, puzzleDate, hintUsed = false }) {
  const starsText = "★".repeat(Math.max(1, Math.min(3, stars || 1)));
  return `I sorted Trump's chaos in ${display} with ${starsText}${hintUsed ? " and a nudge" : ""}; think you can beat my score?\n${challengeUrl(puzzleDate)}`;
}

export function losingShareText({ puzzleDate }) {
  return `Trump's chaos beat me in three tries; think you can do better?\n${challengeUrl(puzzleDate)}`;
}

// The owner expanded the already-published October Legacy game on this date.
// Keep its original five-card version addressable for saved results and shares.
export const LEGACY_SEVEN_START = "2026-10-03";

export function legacyFormatForScore(date, eventCount) {
  return date === LEGACY_SEVEN_START && eventCount === 5 ? "legacy-5" : null;
}

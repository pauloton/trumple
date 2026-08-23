const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonthYear(dateText, fallbackYear = null) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText || "")) {
    const month = Number(dateText.slice(5, 7));
    if (month >= 1 && month <= 12) return `${MONTHS[month - 1]} ${dateText.slice(0, 4)}`;
  }
  return fallbackYear == null ? "" : String(fallbackYear);
}

export function compactEventHint(hint, maxLength = 76) {
  const clean = String(hint || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const candidate = clean.slice(0, maxLength - 1);
  const lastSpace = candidate.lastIndexOf(" ");
  const cutAt = lastSpace >= Math.floor(maxLength * 0.65) ? lastSpace : candidate.length;
  return `${candidate.slice(0, cutAt).replace(/[,:;.!?]+$/, "")}…`;
}

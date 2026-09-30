export const SORT_INSTRUCTIONS = "Oldest at the top. Newest at the bottom.";

export function gameplayHeadline(edition) {
  if (edition === "weekly") return "Last week's shenanigans. Put them in order.";
  if (edition === "legacy") return "Shenanigans since 2016. Put them in order.";
  return "Another set of 2nd term shenanigans. Put them in order.";
}

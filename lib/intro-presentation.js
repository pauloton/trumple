export const BLUE_SCREEN_BACKGROUND = "#0b1628";

// Presentation is independent of archived puzzle content and answer order.
export function introPresentation(meta) {
  if (!meta || !["second-term", "legacy", "weekly"].includes(meta.key)) return meta;
  const legacy = meta.key === "legacy";
  return {
    ...meta,
    ...(legacy ? { taglines: ["2016 To Today."] } : {}),
    ...(meta.key === "weekly" ? { taglines: (meta.taglines || []).filter(line => !/^one week\.?$/i.test(line.trim())), bgColor: BLUE_SCREEN_BACKGROUND } : {}),
    bgImageUrl: meta.key === "weekly" ? "/bg/sunday-toy-transparent.png" : legacy ? "/bg/legacy-toy.png" : "/bg/daily-toy.png",
    bgOverlayOpacity: meta.key === "weekly" ? 0 : 0.12,
    layoutVariant: "toy",
  };
}

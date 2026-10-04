// Presentation is independent of archived puzzle content and answer order.
export function introPresentation(meta) {
  if (!meta || !["second-term", "legacy", "weekly"].includes(meta.key)) return meta;
  const legacy = meta.key === "legacy";
  return {
    ...meta,
    ...(legacy ? { taglines: ["2016 To Today."] } : {}),
    bgImageUrl: meta.key === "weekly" ? "/bg/sunday-toy.png" : legacy ? "/bg/legacy-toy.png" : "/bg/daily-toy.png",
    bgOverlayOpacity: 0.12,
    layoutVariant: "toy",
  };
}

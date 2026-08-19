import assert from "node:assert/strict";
import test from "node:test";

import {
  curateArticles,
  mergeApprovedGenerated,
  refreshLibrary,
} from "../scripts/refresh-event-library.mjs";

test("weekly refresh maps trusted sources and rejects bad candidates", async () => {
  const result = await refreshLibrary({
    today: "2026-08-16",
    fixture: "tests/fixtures/refresh.json",
    dryRun: true,
  });

  assert.deepEqual(result.window.start, "2026-08-09");
  assert.deepEqual(result.window.end, "2026-08-15");
  assert.equal(result.articleCount, 2);
  assert.equal(result.additions.length, 1);
  assert.equal(result.additions[0].date, "2026-08-10");
  assert.equal(result.additions[0].status, "candidate");
  assert.deepEqual(result.additions[0].sources.map((source) => source.name), [
    "Associated Press",
    "Reuters",
  ]);
});

test("automatic curation marks direct Trump actions as publishable", () => {
  const articles = [
    {
      title: "Trump orders a giant gold statue for the Rose Garden",
      domain: "apnews.com",
      url: "https://apnews.com/article/one",
      seendate: "20260810120000",
    },
    {
      title: "Trump signs a second order on the same day",
      domain: "reuters.com",
      url: "https://reuters.com/world/us/two",
      seendate: "20260810150000",
    },
    {
      title: "Analysis: Why Trump's week matters",
      domain: "bbc.com",
      url: "https://bbc.com/news/three",
      seendate: "20260811120000",
    },
    {
      title: "Trump empowers US companies to conduct private missions",
      domain: "theguardian.com",
      url: "https://theguardian.com/us-news/four",
      seendate: "20260811150000",
    },
  ];
  const events = curateArticles(articles, { start: "2026-08-09", end: "2026-08-15" });

  assert.equal(events.filter((event) => event.status === "approved").length, 3);
  assert.equal(events.find((event) => event.date === "2026-08-10" && event.status === "approved").title, "Orders a giant gold statue for the Rose Garden");
  assert.ok(events.every((event) => event.title.length <= 50));
});

test("automatic refresh can select multiple distinct events per day", async () => {
  const result = await refreshLibrary({
    today: "2026-09-04",
    fixture: "tests/fixtures/automatic-refresh.json",
    dryRun: true,
  });
  const approved = result.additions.filter((event) => event.status === "approved");

  assert.deepEqual(approved.map((event) => event.date), [
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
  ]);
  assert.equal(approved[1].title, "Refuses to back down as court blocks plan");
});

test("generated library removes near-duplicate stories", () => {
  const shared = {
    significance: 3,
    difficulty: "medium",
    category: "Policy",
    sources: [{ name: "Reuters", url: "https://reuters.com/example" }],
    status: "approved",
    addedAt: "2026-09-04T00:00:00.000Z",
  };
  const merged = mergeApprovedGenerated([], [
    { ...shared, id: "sep-1-vaccine", date: "2026-09-01", title: "Signs order limiting childhood vaccines" },
    { ...shared, id: "sep-2-vaccine", date: "2026-09-02", title: "Signs orders to limit childhood vaccine" },
  ]);

  assert.equal(merged.length, 1);
});

test("a distinct generated event may share a date with a hand-curated event", () => {
  const merged = mergeApprovedGenerated([], [{
    id: "generated-aug-16",
    date: "2026-08-16",
    title: "Orders Pentagon to reduce military drills",
    significance: 4,
    sources: [{ name: "Reuters", url: "https://reuters.com/example" }],
    status: "approved",
    addedAt: "2026-08-17T00:00:00.000Z",
  }]);

  assert.equal(merged.length, 1);
});

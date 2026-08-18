import assert from "node:assert/strict";
import test from "node:test";

import { curateArticles, refreshLibrary } from "../scripts/refresh-event-library.mjs";

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

test("automatic curation publishes one direct Trump action per day", () => {
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

  assert.equal(events.filter((event) => event.status === "approved").length, 2);
  assert.equal(events.find((event) => event.date === "2026-08-10" && event.status === "approved").title, "Orders a giant gold statue for the Rose Garden");
  assert.ok(events.filter((event) => event.date === "2026-08-10").slice(1).every((event) => event.status === "candidate"));
  assert.ok(events.every((event) => event.title.length <= 50));
});

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { BLUE_SCREEN_BACKGROUND, introPresentation } from "../lib/intro-presentation.js";

test("all editions use approved art without preview parameters", () => {
  for (const [key, image] of [["second-term", "daily-toy.png"], ["legacy", "legacy-toy.png"], ["weekly", "sunday-toy-transparent.png"]]) {
    const original = { key, taglines: ["Old copy"], bgImageUrl: "/bg/red.jpg" };
    const result = introPresentation(original);
    assert.equal(result.bgImageUrl, `/bg/${image}`);
    assert.equal(result.layoutVariant, "toy");
    assert.ok(existsSync(new URL(`../public${result.bgImageUrl}`, import.meta.url)));
    assert.deepEqual(original.taglines, ["Old copy"]);
    assert.equal(original.bgImageUrl, "/bg/red.jpg");
  }
});

test("blue opening uses the plain Game Over color and drops One Week only", () => {
  const original = { key: "weekly", taglines: ["One Week.", "Seven Fresh Disasters.", "Fix The Timeline."] };
  const result = introPresentation(original);
  assert.deepEqual(result.taglines, ["Seven Fresh Disasters.", "Fix The Timeline."]);
  assert.equal(result.bgColor, BLUE_SCREEN_BACKGROUND);
  assert.equal(result.bgOverlayOpacity, 0);
  assert.equal(original.taglines.length, 3);
});

test("Legacy only shows its date-range tagline; Sunday keeps its copy", () => {
  assert.deepEqual(introPresentation({ key: "legacy" }).taglines, ["2016 To Today."]);
  const weekly = { key: "weekly", bgImageUrl: "/weekly-war.png", taglines: ["Last week's chaos."] };
  assert.deepEqual(introPresentation(weekly).taglines, weekly.taglines);
  assert.equal(weekly.bgImageUrl, "/weekly-war.png");
  const other = { key: "other" };
  assert.equal(introPresentation(other), other);
  assert.equal(introPresentation(null), null);
});

test("opening screens do not render the election countdown", () => {
  const source = readFileSync(new URL("../app/page.js", import.meta.url), "utf8");
  assert.ok(!source.includes("dailyCopy.countdown"));
  assert.ok(!source.includes("intro-toy-preview"));
});

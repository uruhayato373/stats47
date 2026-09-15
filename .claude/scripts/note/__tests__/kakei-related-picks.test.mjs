import assert from "node:assert/strict";
import test from "node:test";

import {
  choosePick,
  parseCatalogEntries,
  patchCatalog,
  pickDominant,
} from "../build-kakei-related-picks.mjs";

test("pickDominant picks the max |ratio-1|, first wins ties", () => {
  const breakdown = [
    { catName: "食料", ratio: 1.05 },
    { catName: "教育", ratio: 1.44 },
  ];
  assert.equal(pickDominant(breakdown).catName, "教育");
});

test("choosePick: same catName + same side, nearest ratio wins (not the most extreme)", () => {
  const records = [
    { key: "a-kakei-a", catName: "住居", ratio: 1.1, side: "above" },
    { key: "a-kakei-b", catName: "住居", ratio: 0.5, side: "below" },
    { key: "a-kakei-c", catName: "住居", ratio: 1.2, side: "above" },
    { key: "a-kakei-d", catName: "住居", ratio: 1.9, side: "above" },
    { key: "a-kakei-e", catName: "教育", ratio: 2.0, side: "above" },
  ];
  // self=a: same catName+side are c(|1.2-1.1|=0.1) and d(0.8); c is nearest. b is other side, e other cat.
  assert.equal(choosePick(records[0], records), "a-kakei-c");
});

test("choosePick: same catName but no same side -> nearest ratio among same catName", () => {
  const records = [
    { key: "a-kakei-a", catName: "住居", ratio: 1.1, side: "above" },
    { key: "a-kakei-b", catName: "住居", ratio: 0.5, side: "below" },
    { key: "a-kakei-c", catName: "住居", ratio: 0.9, side: "below" },
  ];
  assert.equal(choosePick(records[0], records), "a-kakei-c");
});

test("choosePick: tie on nearest ratio breaks by key ascending", () => {
  const records = [
    { key: "a-kakei-z", catName: "住居", ratio: 1.5, side: "above" },
    { key: "a-kakei-m", catName: "住居", ratio: 1.1, side: "above" },
    { key: "a-kakei-a", catName: "住居", ratio: 1.3, side: "above" },
  ];
  // self=a(1.3): z(0.2) and m(0.2) tie -> key ascending -> m
  assert.equal(choosePick(records[2], records), "a-kakei-m");
});

test("choosePick: falls back to same-direction closest ratio when no same catName exists", () => {
  const self = { key: "a-kakei-self", catName: "教育", ratio: 1.2, side: "above" };
  const records = [
    self,
    { key: "a-kakei-close", catName: "住居", ratio: 1.25, side: "above" },
    { key: "a-kakei-far", catName: "交通・通信", ratio: 2.0, side: "above" },
    { key: "a-kakei-oppositeSide", catName: "光熱・水道", ratio: 0.9, side: "below" },
  ];
  assert.equal(choosePick(self, records), "a-kakei-close");
});

test("choosePick: final fallback is key order, excluding self", () => {
  const self = { key: "a-kakei-b", catName: "教育", ratio: 1.0, side: "above" };
  const records = [
    self,
    { key: "a-kakei-c", catName: "住居", ratio: 0.5, side: "below" },
    { key: "a-kakei-a", catName: "交通・通信", ratio: 0.3, side: "below" },
  ];
  assert.equal(choosePick(self, records), "a-kakei-a");
});

test("choosePick never returns self, and returns null when there is nothing else", () => {
  const self = { key: "a-kakei-only", catName: "教育", ratio: 1.0, side: "above" };
  assert.equal(choosePick(self, [self]), null);
});

const CATALOG_FIXTURE = `export const NOTE_ARTICLES = [
  {
    key: "a-kakei-aichi",
    vertical: "stats47-note",
    series: "A",
    title: "愛知県の家計は何にお金が偏っているか",
    magazine: "s47-kakei-reading",
    isPaid: false,
    status: "published",
    noteUrl: "https://note.com/stats47/n/na1",
    publishedAt: "2026-09-06",
    r2Path: "note/stats47-note/a-kakei-aichi",
    stats47Targets: ["/blog/aichi-food-culture", "/areas/23000"],
  },
  {
    key: "a-kakei-akita",
    vertical: "stats47-note",
    series: "A",
    title: "秋田県の家計は何にお金が偏っているか",
    magazine: "s47-kakei-reading",
    isPaid: false,
    status: "draft",
    r2Path: "note/stats47-note/a-kakei-akita",
    stats47Targets: [],
  },
];
`;

test("parseCatalogEntries extracts only published a-kakei-* blocks", () => {
  const entries = parseCatalogEntries(CATALOG_FIXTURE);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, "a-kakei-aichi");
  assert.equal(entries[0].r2Path, "note/stats47-note/a-kakei-aichi");
  assert.equal(entries[0].existingNextBest, null);
});

test("patchCatalog inserts nextBestArticle before the closing brace, idempotently", () => {
  const picks = new Map([["a-kakei-aichi", "a-kakei-akita"]]);
  const once = patchCatalog(CATALOG_FIXTURE, picks);
  assert.match(once, /nextBestArticle: "a-kakei-akita",\n  \},/);

  const twice = patchCatalog(once, picks);
  assert.equal(once, twice, "re-running with the same picks must not change the file again");
});

test("patchCatalog replaces an existing nextBestArticle value in place (no duplicate field)", () => {
  const withExisting = CATALOG_FIXTURE.replace(
    'stats47Targets: ["/blog/aichi-food-culture", "/areas/23000"],',
    'stats47Targets: ["/blog/aichi-food-culture", "/areas/23000"],\n    nextBestArticle: "a-kakei-old",',
  );
  const picks = new Map([["a-kakei-aichi", "a-kakei-new"]]);
  const patched = patchCatalog(withExisting, picks);
  const matches = patched.match(/nextBestArticle: "[^"]+"/g);
  assert.deepEqual(matches, ['nextBestArticle: "a-kakei-new"']);
});

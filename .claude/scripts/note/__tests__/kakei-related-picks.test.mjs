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

const ARTICLES_FIXTURE = [
  {
    key: "a-kakei-aichi", vertical: "stats47-note", series: "A", title: "愛知県の家計は何にお金が偏っているか",
    magazine: "s47-kakei-reading", isPaid: false, status: "published", noteUrl: "https://note.com/stats47/n/na1",
    publishedAt: "2026-09-06", r2Path: "note/stats47-note/a-kakei-aichi", body: { store: "r2-public", manifest: null },
    stats47Targets: ["/blog/aichi-food-culture", "/areas/23000"],
  },
  {
    key: "a-kakei-akita", vertical: "stats47-note", series: "A", title: "秋田県の家計は何にお金が偏っているか",
    magazine: "s47-kakei-reading", isPaid: false, status: "draft", r2Path: "note/stats47-note/a-kakei-akita",
    body: { store: "r2-public", manifest: null }, stats47Targets: [],
  },
];

test("parseCatalogEntries extracts only published a-kakei-* articles", () => {
  const entries = parseCatalogEntries(ARTICLES_FIXTURE);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, "a-kakei-aichi");
  assert.equal(entries[0].r2Path, "note/stats47-note/a-kakei-aichi");
  assert.equal(entries[0].existingNextBest, null);
});

test("patchCatalog sets nextBestArticle on published articles only, idempotently", () => {
  const picks = new Map([["a-kakei-aichi", "a-kakei-akita"], ["a-kakei-akita", "a-kakei-aichi"]]);
  const once = patchCatalog(ARTICLES_FIXTURE, picks);
  assert.equal(once.changed, 1);
  assert.equal(once.articles[0].nextBestArticle, "a-kakei-akita");
  assert.equal(once.articles[1].nextBestArticle, undefined, "drafts are not patched");
  assert.equal(ARTICLES_FIXTURE[0].nextBestArticle, undefined, "input is not mutated");

  const twice = patchCatalog(once.articles, picks);
  assert.equal(twice.changed, 0, "re-running with the same picks must not change the ledger again");
});

test("patchCatalog replaces an existing nextBestArticle value", () => {
  const withExisting = [{ ...ARTICLES_FIXTURE[0], nextBestArticle: "a-kakei-old" }];
  const patched = patchCatalog(withExisting, new Map([["a-kakei-aichi", "a-kakei-new"]]));
  assert.equal(patched.changed, 1);
  assert.equal(patched.articles[0].nextBestArticle, "a-kakei-new");
});

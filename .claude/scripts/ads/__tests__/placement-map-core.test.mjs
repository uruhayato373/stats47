import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyPageUrl,
  resolveVerticalsForPage,
  aggregateDemand,
  buildGapReport,
  buildReverseCandidates,
  suggestTargetRankingKeys,
} from "../lib/placement-map-core.mjs";

const MAPS = {
  rankingKeyToCategory: { "natto-consumption-expenditure": "economy", "vacant-housing-rate": "construction", "retail-store-count": "commercial" },
  categoryMap: { economy: "economy", construction: "housing", laborwage: "labor" }, // commercial は意図的に未写像
  tagMap: { 家計調査: "economy", 住宅: "housing" },
  themeMap: { "living-housing": "housing" },
  articleTags: { "natto-map": ["家計調査"], "orphan-article": ["未知タグ"] },
};

// ── URL 分類 ────────────────────────────────────────────────────────────────

test("ページ種別を URL から決定的に分類する", () => {
  assert.deepEqual(classifyPageUrl("https://stats47.jp/ranking/natto-consumption-expenditure"), { type: "ranking", key: "natto-consumption-expenditure" });
  assert.deepEqual(classifyPageUrl("https://stats47.jp/blog/natto-map"), { type: "blog", key: "natto-map" });
  assert.deepEqual(classifyPageUrl("https://stats47.jp/areas/01000"), { type: "areas", key: "01000" });
  assert.deepEqual(classifyPageUrl("https://stats47.jp/"), { type: "home", key: null });
  assert.deepEqual(classifyPageUrl("https://stats47.jp"), { type: "home", key: null });
});

test("クエリとハッシュを落とす (GSC は #anchor 付き URL を別行で出す)", () => {
  assert.deepEqual(classifyPageUrl("https://stats47.jp/blog/bonito#%E9%83%BD"), { type: "blog", key: "bonito" });
  assert.deepEqual(classifyPageUrl("https://stats47.jp/ranking/x?utm_source=a"), { type: "ranking", key: "x" });
});

test("compare は category より優先して分類する (/category/<key>/compare)", () => {
  assert.equal(classifyPageUrl("https://stats47.jp/category/economy/compare").type, "compare");
});

// ── vertical 解決 (広告解決の実装と同じ経路であること) ──────────────────────

test("ranking は categoryKey 経由で vertical を解決する", () => {
  const r = resolveVerticalsForPage({ type: "ranking", key: "natto-consumption-expenditure" }, MAPS);
  assert.deepEqual(r.verticals, ["economy"]);
});

test("★写像なし category は verticals 空 = 広告が出ない (AdSense 落ち) と分かる", () => {
  const r = resolveVerticalsForPage({ type: "ranking", key: "retail-store-count" }, MAPS);
  assert.deepEqual(r.verticals, []);
  assert.equal(r.reason, "category-unmapped:commercial");
});

test("blog はタグ解決し、未写像タグを economy と推測しない", () => {
  assert.deepEqual(resolveVerticalsForPage({ type: "blog", key: "natto-map" }, MAPS).verticals, ["economy"]);
  const orphan = resolveVerticalsForPage({ type: "blog", key: "orphan-article" }, MAPS);
  assert.deepEqual(orphan.verticals, []);
  assert.equal(orphan.reason, "tags-unmapped");
});

test("areas は vertical 解決を経由せず furusato 枠として扱う", () => {
  assert.deepEqual(resolveVerticalsForPage({ type: "areas", key: "01000" }, MAPS).verticals, ["furusato"]);
});

// ── 集計 ────────────────────────────────────────────────────────────────────

test("ページ種別 × vertical に集計し、未解決を別リストで返す", () => {
  const rows = [
    { url: "https://stats47.jp/ranking/natto-consumption-expenditure", imp: 2030, clicks: 100 },
    { url: "https://stats47.jp/ranking/retail-store-count", imp: 411, clicks: 18 },
    { url: "https://stats47.jp/blog/natto-map", imp: 500, clicks: 10 },
  ];
  const a = aggregateDemand(rows, MAPS);
  assert.equal(a.byType.ranking.imp, 2441);
  assert.equal(a.byType.blog.imp, 500);
  assert.equal(a.byVertical.economy.imp, 2530, "ranking 2030 + blog 500");
  assert.equal(a.unmapped.length, 1);
  assert.equal(a.unmapped[0].key, "retail-store-count");
});

test("未解決は imp 降順 (手当ての優先順で読めるように)", () => {
  const rows = [
    { url: "https://stats47.jp/ranking/retail-store-count", imp: 10, clicks: 0 },
    { url: "https://stats47.jp/tag/未知", imp: 900, clicks: 0 },
  ];
  const a = aggregateDemand(rows, MAPS);
  assert.equal(a.unmapped[0].imp, 900);
});

// ── ギャップ判定 ────────────────────────────────────────────────────────────

test("在庫ゼロの種別を kinds で名指しする", () => {
  const r = buildGapReport({
    byVertical: { housing: { imp: 1519, clicks: 39 }, furusato: { imp: 974, clicks: 40 } },
    unmapped: [],
    inventoryByVertical: { housing: 16, furusato: 2 },
    bannerByVertical: { housing: 11, furusato: 2 },
    textByVertical: { housing: 5, furusato: 0 },
  });
  const furusato = r.gaps.find((g) => g.vertical === "furusato");
  assert.ok(furusato.kinds.includes("text-zero"));
  const housing = r.gaps.find((g) => g.vertical === "housing");
  assert.deepEqual(housing.kinds, [], "banner/text とも在庫があり imp も十分なら指摘なし");
});

test("未写像を理由別に束ね、何を足せば効くかが読める形にする", () => {
  const r = buildGapReport({
    byVertical: {},
    unmapped: [
      { url: "/ranking/a", key: "a", imp: 400, reason: "category-unmapped:commercial" },
      { url: "/ranking/b", key: "b", imp: 300, reason: "category-unmapped:commercial" },
      { url: "/ranking/c", key: "c", imp: 100, reason: "category-unmapped:agriculture" },
    ],
    inventoryByVertical: {},
  });
  assert.equal(r.unmappedImp, 800);
  assert.equal(r.unmappedByReason[0].reason, "category-unmapped:commercial");
  assert.equal(r.unmappedByReason[0].imp, 700);
  assert.deepEqual(r.unmappedByReason[0].examples, ["a", "b"]);
});

// ── reverse (高EPC → 当て先) ────────────────────────────────────────────────

test("共用案件は shared:true で明示し stats47 単独の実力と混同しない", () => {
  const out = buildReverseCandidates({
    catalogEntries: [
      { programId: "s1", name: "ビルドジョブ", vertical: "labor", status: "registered" },
      { programId: "s2", name: "訳アリ買取", vertical: "housing", status: "candidate" },
    ],
    confirmedEpcOf: (e) => (e.programId === "s1" ? 461 : 2455),
    registeredProgramIds: ["s1"],
    sharedProgramIds: ["s1"],
  });
  assert.equal(out[0].programId, "s2", "確定EPC 降順");
  assert.equal(out[0].shared, false);
  const buildjob = out.find((o) => o.programId === "s1");
  assert.equal(buildjob.shared, true);
  assert.equal(buildjob.registered, true);
});

test("minEpc 未満は候補にしない", () => {
  const out = buildReverseCandidates({
    catalogEntries: [{ programId: "s3", name: "低EPC" }],
    confirmedEpcOf: () => 3,
    registeredProgramIds: [],
  });
  assert.deepEqual(out, []);
});

// ── 当て先 suggest ──────────────────────────────────────────────────────────

test("案件名の語からランキングキーを suggest する (適用はしない)", () => {
  const s = suggestTargetRankingKeys("訳アリ不動産買取専門店【ラクウル】", {
    "vacant-housing-rate": "空き家率",
    "used-housing-transaction": "中古住宅の不動産取引件数",
    "natto-consumption": "納豆消費量",
  });
  assert.ok(s.length > 0);
  assert.equal(s[0].key, "used-housing-transaction", "「不動産」が一致");
  assert.ok(!s.some((x) => x.key === "natto-consumption"));
});

test("語が拾えない案件名では空を返す (推測で当て先を作らない)", () => {
  assert.deepEqual(suggestTargetRankingKeys("A8", { x: "何か" }), []);
  assert.deepEqual(suggestTargetRankingKeys("", { x: "何か" }), []);
});

test("blocklist 該当は候補にしない (テスト用プログラムが 1 位に居座るのを防ぐ)", () => {
  const out = buildReverseCandidates({
    catalogEntries: [
      { programId: "s0", name: "【A8.net】成果反映用プログラム" },
      { programId: "s2", name: "訳アリ買取" },
    ],
    confirmedEpcOf: (e) => (e.programId === "s0" ? 66625 : 2455),
    registeredProgramIds: [],
    isExcluded: (e) => /成果反映用/.test(String(e.name)),
  });
  assert.equal(out.length, 1);
  assert.equal(out[0].programId, "s2");
});

test("2 文字一致は採らない (日本語ではノイズが多すぎる)", () => {
  // 「レンタカー」と「訳アリ不動産買取」は 2-gram では偶然繋がりうるが 3 文字では繋がらない
  const s = suggestTargetRankingKeys("訳アリ不動産買取専門店", { "rental-car": "レンタカー利用料" });
  assert.deepEqual(s, []);
});

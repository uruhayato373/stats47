import assert from "node:assert/strict";
import test from "node:test";
import { require as tsxRequire } from "tsx/cjs/api";

import {
  classifyPageUrl,
  resolveVerticalsForPage,
  aggregateDemand,
  buildGapReport,
  buildReverseCandidates,
  suggestTargetRankingKeys,
} from "../lib/placement-map-core.mjs";
import { loadAffiliateMaps, rankingContentFromSnapshot, articleContentFromSnapshot, surveyKeysFromRows } from "../build-placement-map.mjs";

const runtime = tsxRequire("../../../../apps/web/src/features/ads/constants/affiliate-category.ts", import.meta.url);

const MAPS = {
  rankingKeyToCategory: { "natto-consumption-expenditure": "economy", "vacant-housing-rate": "construction", "retail-store-count": "commercial" },
  categoryMap: { economy: "economy", construction: "housing", laborwage: "labor" }, // commercial は意図的に未写像
  tagMap: { 家計調査: "economy", 住宅: "housing" },
  themeMap: { "living-housing": "housing" },
  rankingContent: { "natto-consumption-expenditure": { categoryKey: "economy" }, "vacant-housing-rate": { categoryKey: "construction" }, "retail-store-count": { categoryKey: "unknown-category" } },
  articleContent: { "natto-map": { tagKeys: ["家計調査"] }, "orphan-article": { tagKeys: ["未知タグ"] } },
  resolveContentVertical: runtime.resolveContentVertical,
};

test("survey snapshot取得は一覧・不正slugを除き、重複を除く", () => {
  const rows = ["/survey", "/survey/", "/survey/kakei-chousa", "/survey/kakei-chousa?x=1", "/survey/../", "/ranking/natto"]
    .map(url => ({ url }));
  assert.deepEqual(surveyKeysFromRows(rows), ["kakei-chousa"]);
});

test("実SSOT: 家計調査はrankingのタグ・economyよりfurusatoを優先する", () => {
  const maps = { ...MAPS, rankingContent: { natto: { surveyIds: ["kakei-chousa"], tagKeys: ["家計調査"], categoryKey: "economy" } } };
  assert.deepEqual(resolveVerticalsForPage({ type: "ranking", key: "natto" }, maps), { verticals: ["furusato"], reason: "survey" });
});

test("実SSOT: 学校保健調査のnullはrankingのタグ・カテゴリへ落ちずno-intent", () => {
  const maps = { ...MAPS, rankingContent: { height: { surveyIds: ["school-health-survey"], tagKeys: ["教育"], categoryKey: "educationsports" } } };
  assert.deepEqual(resolveVerticalsForPage({ type: "ranking", key: "height" }, maps), { verticals: [], reason: "no-intent" });
});

test("blogは調査優先、明示null停止、未知調査はタグへ落ちる", () => {
  const cases = [
    [["kakei-chousa"], ["家計調査"], ["furusato"], "survey"],
    [["school-health-survey"], ["教育"], [], "no-intent"],
    [["unmapped-survey"], ["住宅", "人口", "住宅"], ["housing", "population"], "tags"],
  ];
  for (const [surveyIds, tagKeys, verticals, reason] of cases) {
    const maps = { ...MAPS, articleContent: { article: { surveyIds, tagKeys } } };
    assert.deepEqual(resolveVerticalsForPage({ type: "blog", key: "article" }, maps), { verticals, reason });
  }
});

test("最初の写像済み調査で決まり、後ろのnullは先頭の意図を上書きしない", () => {
  const content = { surveyIds: ["unknown", "kakei-chousa", "school-health-survey"], categoryKey: "economy" };
  assert.deepEqual(resolveVerticalsForPage({ type: "ranking", key: "multi" }, { ...MAPS, rankingContent: { multi: content } }).verticals, ["furusato"]);
});

test("surveyは実調査写像を使い、nullをカテゴリで打ち消さない", () => {
  assert.deepEqual(resolveVerticalsForPage({ type: "survey", key: "kakei-chousa" }, MAPS), { verticals: ["furusato"], reason: "survey" });
  assert.deepEqual(resolveVerticalsForPage({ type: "survey", key: "school-health-survey" }, MAPS), { verticals: [], reason: "no-intent" });
});

test("未写像surveyは実snapshotカテゴリの最多vertical、同数は出現順", () => {
  const surveyItems = { x: [{ categoryKey: "construction" }, { categoryKey: "laborwage" }, { categoryKey: "laborwage" }], tie: [{ categoryKey: "construction" }, { categoryKey: "laborwage" }], noMappedCategory: [{ categoryKey: "unknown" }] };
  const maps = { ...MAPS, surveyItems };
  assert.deepEqual(resolveVerticalsForPage({ type: "survey", key: "x" }, maps), { verticals: ["labor"], reason: "survey-category" });
  assert.deepEqual(resolveVerticalsForPage({ type: "survey", key: "tie" }, maps).verticals, ["housing"]);
  assert.deepEqual(resolveVerticalsForPage({ type: "survey", key: "noMappedCategory" }, maps).verticals, ["economy"]);
  assert.equal(resolveVerticalsForPage({ type: "survey", key: "missing" }, maps).reason, "survey-items-unavailable");
});

test("theme・category・tag・area・otherの既存経路は維持する", () => {
  for (const [type, key, verticals] of [["themes", "living-housing", ["housing"]], ["category", "economy", ["economy"]], ["tag", "住宅", ["housing"]], ["areas", "01000", ["furusato"]], ["other", null, []]]) {
    assert.deepEqual(resolveVerticalsForPage({ type, key }, MAPS).verticals, verticals);
  }
});

test("builderは実resolver/mapsを共有し、survey nullを正規表現で取り落とさない", () => {
  const maps = loadAffiliateMaps();
  assert.deepEqual(maps.categoryMap, runtime.CATEGORY_AFFILIATE_MAP);
  assert.deepEqual(maps.tagMap, runtime.TAG_AFFILIATE_MAP);
  assert.deepEqual(maps.themeMap, runtime.THEME_AFFILIATE_MAP);
  assert.deepEqual(maps.resolveContentVertical({ surveyIds: ["school-health-survey"], tagKeys: ["教育"] }), runtime.resolveContentVertical({ surveyIds: ["school-health-survey"], tagKeys: ["教育"] }));
});

test("R2 originalSurveysのobject/string双方とsurveyIdsの明示空配列を保持する", () => {
  const rankingContent = rankingContentFromSnapshot({ items: [
    { rankingKey: "food", areaType: "prefecture", categoryKey: "economy", originalSurveys: [{ id: "kakei-chousa" }], tags: [{ tagKey: "家計調査" }] },
    { rankingKey: "height", originalSurveys: ["school-health-survey"], tags: ["教育"] },
    { rankingKey: "empty", surveyIds: [], originalSurveys: ["kakei-chousa"], categoryKey: "economy" },
    { rankingKey: "legacy", surveyId: "kakei-chousa" },
    { rankingKey: "inactive", isActive: false },
    { rankingKey: "city", areaType: "city" },
  ] });
  const maps = { ...loadAffiliateMaps(), rankingContent };
  assert.deepEqual(resolveVerticalsForPage({ type: "ranking", key: "food" }, maps).verticals, ["furusato"]);
  assert.equal(resolveVerticalsForPage({ type: "ranking", key: "height" }, maps).reason, "no-intent");
  assert.deepEqual(rankingContent.empty.surveyIds, []);
  assert.deepEqual(resolveVerticalsForPage({ type: "ranking", key: "empty" }, maps).verticals, ["economy"]);
  assert.deepEqual(rankingContent.legacy.surveyIds, ["kakei-chousa"]);
  assert.equal(rankingContent.inactive, undefined);
  assert.equal(rankingContent.city, undefined);
});

test("blog snapshotはsurveyIdsを運び、runtimeにないcategory fallbackを足さない", () => {
  const articleContent = articleContentFromSnapshot({ articles: [
    { slug: "food", surveyIds: ["kakei-chousa"], tags: [{ tagKey: "家計調査" }] },
    { slug: "empty", tags: [], categoryKey: "economy" },
    { slug: "draft", published: false, tags: ["住宅"] },
  ] });
  const maps = { ...loadAffiliateMaps(), articleContent };
  assert.deepEqual(resolveVerticalsForPage({ type: "blog", key: "food" }, maps).verticals, ["furusato"]);
  assert.deepEqual(resolveVerticalsForPage({ type: "blog", key: "empty" }, maps).verticals, []);
  assert.equal(articleContent.draft, undefined);
});

test("取得できないrankingメタをcategoryだけで推測しない", () => {
  const r = resolveVerticalsForPage({ type: "ranking", key: "known" }, { ...MAPS, rankingKeyToCategory: { known: "economy" } });
  assert.deepEqual(r, { verticals: [], reason: "ranking-metadata-unavailable" });
});

test("複数意図のGSC需要は複製されるが、no-intentを需要へ混入しない", () => {
  const maps = { ...loadAffiliateMaps(), articleContent: { both: { tagKeys: ["人口", "住宅"] }, stopped: { surveyIds: ["school-health-survey"], tagKeys: ["教育"] } } };
  const result = aggregateDemand([{ url: "/blog/both", imp: 100, clicks: 3 }, { url: "/blog/stopped", imp: 50, clicks: 2 }], maps);
  assert.equal(result.byType.blog.imp, 150);
  assert.equal(result.byVertical.population.imp, 100);
  assert.equal(result.byVertical.housing.imp, 100);
  assert.equal(result.byVertical.education, undefined);
  assert.equal(result.unmapped[0].reason, "no-intent");
});

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
  assert.equal(r.reason, "category-unmapped:unknown-category");
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

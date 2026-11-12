/**
 * adsense-page-types.mjs のテスト — GA4 のページ別の広告の値をページ種別へまとめる形と、要約の表。
 * 2026-11-12 に週次の記録へ加えた (AdSense のページ別レポートはプライバシーの閾値で 0 行のため)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildPageTypeRows,
  markdownPageTypeSection,
  PAGE_TYPE_FIELDS,
} from "../lib/adsense-page-types.mjs";
import { PAGE_TYPES } from "../lib/page-type.mjs";

const row = (pagePath, pv, imp, clk, rev) => ({
  pagePath,
  screenPageViews: String(pv),
  publisherAdImpressions: String(imp),
  publisherAdClicks: String(clk),
  totalAdRevenue: String(rev),
});

test("ページをページ種別にまとめ、1,000 PV あたりの収益を出す", () => {
  const rows = buildPageTypeRows([
    row("/ranking/total-population", 1000, 1500, 3, 40),
    row("/ranking/annual-income?year=2024", 1000, 1400, 2, 30),
    row("/blog/some-article", 500, 600, 1, 10),
  ]);
  const ranking = rows.find((r) => r.page_type === "ranking-detail");
  assert.deepEqual(ranking, {
    page_type: "ranking-detail",
    pages: 2,
    page_views: 2000,
    ad_impressions: 2900,
    ad_clicks: 5,
    revenue_yen: 70,
    revenue_per_1000_pv: 35,
  });
  assert.equal(rows.find((r) => r.page_type === "blog-detail").revenue_per_1000_pv, 20);
  // 収益の多い順
  assert.equal(rows[0].page_type, "ranking-detail");
  assert.deepEqual(Object.keys(ranking), [...PAGE_TYPE_FIELDS]);
});

test("全ページ種別を必ず出し、PV 0 の種別は 1,000 PV あたりを空にする (0 円と取り違えない)", () => {
  const rows = buildPageTypeRows([row("/", 100, 120, 0, 3)]);
  assert.equal(rows.length, PAGE_TYPES.length);
  const search = rows.find((r) => r.page_type === "search");
  assert.equal(search.page_views, 0);
  assert.equal(search.revenue_per_1000_pv, "");
});

test("要約の表: その週の行と前週の 1,000 PV あたりを並べ、PV も収益も 0 の種別は出さない", () => {
  const history = [
    { week: "2026-W44", page_type: "ranking-detail", page_views: "1000", ad_impressions: "1500", ad_clicks: "3", revenue_yen: "30", revenue_per_1000_pv: "30" },
    { week: "2026-W45", page_type: "ranking-detail", page_views: "1000", ad_impressions: "1600", ad_clicks: "4", revenue_yen: "40", revenue_per_1000_pv: "40" },
    { week: "2026-W45", page_type: "search", page_views: "0", ad_impressions: "0", ad_clicks: "0", revenue_yen: "0", revenue_per_1000_pv: "" },
  ];
  const text = markdownPageTypeSection(history, "2026-W45").join("\n");
  assert.match(text, /\| ランキング \| 1000 \| 1600 \| 4 \| ¥40 \| ¥40\.0 \| ¥30\.0 \|/);
  assert.doesNotMatch(text, /\| 検索 \|/);
  assert.match(text, /\| 合計 \| 1000 \| 1600 \| 4 \| ¥40 \| ¥40\.0 \|/);
  assert.deepEqual(markdownPageTypeSection(history, "2026-W46"), []);
});

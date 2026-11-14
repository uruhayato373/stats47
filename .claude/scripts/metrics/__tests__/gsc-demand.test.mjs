/**
 * gsc-demand.mjs のテスト — ページ → カテゴリの写像、重ならない窓の選び方、捕捉率、前週比を出す条件。
 * 意図: 「何にアクセスが集まっているか」に、期間と捕捉率を付けて、重なる窓を混ぜずに答えられること。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  NO_CATEGORY,
  aggregateDemand,
  blogCategoriesFromLedger,
  buildDemandRows,
  classifyGscPage,
  createDemandContext,
  detailCoverage,
  renderDemandLatest,
  selectNonOverlappingWindows,
  snapshotDetailCoverage,
  writeGscDemand,
  BASIS_ROLLING,
} from "../lib/gsc-demand.mjs";
import { renderGscLatest } from "../lib/weekly-summary.mjs";

const metricCategory = new Map([
  ["udon-consumption", "economy"],
  ["hospital-beds", "socialsecurity"],
  ["shipment-amount", "miningindustry"],
]);
const ctx = createDemandContext({
  metricCategory,
  blogCategory: blogCategoriesFromLedger(
    [
      { slug: "noodle-story", rankingKeys: ["udon-consumption", "hospital-beds", "udon-consumption"] },
      { slug: "no-keys", rankingKeys: [] },
    ],
    metricCategory,
  ),
  categoryNames: new Map([
    ["economy", "企業・家計・経済"],
    ["socialsecurity", "社会保障・衛生"],
    ["miningindustry", "鉱工業"],
  ]),
  themeTitles: new Map([["aging-society", "少子高齢化"]]),
  isThemePath: (path) => /^\/areas\/[^/]+\/aging-society$/.test(path),
});

test("classifyGscPage: ランキング・市区町村・旧 URL は指標のカテゴリ、ブログは rankingKeys の多数決", () => {
  assert.deepEqual(classifyGscPage("https://stats47.jp/ranking/udon-consumption", ctx), {
    path: "/ranking/udon-consumption",
    section: "ranking",
    category: "economy",
    theme: null,
  });
  assert.equal(classifyGscPage("https://stats47.jp/municipalities/ranking/shipment-amount/13000", ctx).category, "miningindustry");
  assert.equal(classifyGscPage("https://stats47.jp/municipalities/ranking/shipment-amount", ctx).section, "municipalities");
  const old = classifyGscPage("https://stats47.jp/socialsecurity/medical/ranking/unknown-key", ctx);
  assert.equal(old.section, "ranking");
  assert.equal(old.category, "socialsecurity", "旧 URL で指標が無ければ先頭のカテゴリ");
  assert.equal(classifyGscPage("https://stats47.jp/blog/noodle-story", ctx).category, "economy");
});

test("classifyGscPage: 写像に無いものは推定せずカテゴリなしにする", () => {
  assert.equal(classifyGscPage("https://stats47.jp/blog/no-keys", ctx).category, NO_CATEGORY);
  assert.equal(classifyGscPage("https://stats47.jp/blog?page=3", ctx).section, "blog");
  assert.equal(classifyGscPage("https://stats47.jp/areas/13000/cities", ctx).category, NO_CATEGORY);
  assert.equal(classifyGscPage("https://stats47.jp/ranking/not-a-metric", ctx).category, NO_CATEGORY);
  assert.equal(classifyGscPage("https://stats47.jp/", ctx).section, "home");
  assert.equal(classifyGscPage("https://stats47.jp/unknown-top", ctx).section, "other");
});

test("classifyGscPage: テーマのページは地域の配下でもテーマとして数える", () => {
  const c = classifyGscPage("https://stats47.jp/areas/13000/aging-society", ctx);
  assert.equal(c.section, "themes");
  assert.equal(c.theme, "aging-society");
});

test("selectNonOverlappingWindows: 前の窓と 1 日でも重なる週は採らない", () => {
  const picked = selectNonOverlappingWindows([
    { week: "2026-W29", periodStart: "2026-06-20", periodEnd: "2026-07-17" },
    { week: "2026-W30", periodStart: "2026-06-26", periodEnd: "2026-07-23" },
    { week: "2026-W33", periodStart: "2026-07-17", periodEnd: "2026-08-13" },
    { week: "2026-W34", periodStart: "2026-07-24", periodEnd: "2026-08-20" },
  ]);
  assert.deepEqual(
    picked.map((p) => p.week),
    ["2026-W29", "2026-W34"],
    "W33 は W29 の最終日 07-17 に始まるので重なる",
  );
});

test("detailCoverage: キーワード表の捕捉率はクエリの合計 ÷ サイト全体のクリック", () => {
  const cov = detailCoverage({
    periodStart: "2026-09-18",
    periodEnd: "2026-10-15",
    queryRows: [{ clicks: "3000" }, { clicks: "48" }],
    pageRows: [{ clicks: "13373" }],
    siteClicks: 13207,
  });
  assert.equal(cov.queryClicks, 3048);
  assert.equal(cov.queryCaptureRate, 0.2308);
  assert.equal(cov.pageCaptureRate, 1.0126);
});

function rowsFor(pages, { week = "2026-W44", siteClicks = 100 } = {}) {
  const queryRows = [{ query: "うどん", clicks: 20, impressions: 100, position: 3 }];
  return buildDemandRows({
    week,
    basis: BASIS_ROLLING,
    periodStart: "2026-10-02",
    periodEnd: "2026-10-29",
    daysPresent: 28,
    siteClicks,
    siteImpressions: 1000,
    coverage: detailCoverage({ periodStart: "2026-10-02", periodEnd: "2026-10-29", queryRows, pageRows: pages, siteClicks }),
    aggregate: aggregateDemand(pages, ctx),
    ctx,
  });
}

test("buildDemandRows: サイト全体の行に捕捉率を載せ、カテゴリの割合はページ表の合計に対する割合", () => {
  const rows = rowsFor([
    { page: "https://stats47.jp/ranking/udon-consumption", clicks: 60, impressions: 600, position: 3 },
    { page: "https://stats47.jp/blog/noodle-story", clicks: 20, impressions: 200, position: 5 },
    { page: "https://stats47.jp/areas/13000", clicks: 20, impressions: 200, position: 7 },
  ]);
  const total = rows.find((r) => r.dimension === "total");
  assert.equal(total.query_capture_rate, 0.2);
  assert.equal(total.period_start, "2026-10-02");
  const economy = rows.find((r) => r.dimension === "category" && r.key === "economy");
  assert.equal(economy.clicks, 80);
  assert.equal(economy.click_share, 0.8);
  assert.equal(economy.label, "企業・家計・経済");
  assert.equal(rows.find((r) => r.dimension === "section" && r.key === "areas").click_share, 0.2);
});

function snapFixture({ week, pages7d = null, finalized = null }) {
  return {
    week,
    periodStart: "2026-10-02",
    periodEnd: "2026-10-29",
    daysPresent: 28,
    siteClicks: 100,
    siteImpressions: 1000,
    queries: [
      { query: "うどん ランキング", clicks: "20", impressions: "100", position: "3" },
      { query: "表示だけ多い語", clicks: "1", impressions: "500", position: "9" },
    ],
    pages: [{ page: "https://stats47.jp/ranking/udon-consumption", clicks: "100", impressions: "1000", position: "3" }],
    queries7d: null,
    pages7d,
    summary: finalized,
  };
}

test("renderDemandLatest: 期間・捕捉率・低 CTR の語を書き、確定 7 日が 2 週そろうまでカテゴリの前週比を出さない", () => {
  const snap = snapFixture({ week: "2026-W44" });
  const latestRows = rowsFor(snap.pages);
  const md = renderDemandLatest({ week: "2026-W44", historyRows: latestRows, latestRows, weeklyRows: [], snap, ctx });
  assert.match(md, /期間 2026-10-02 〜 2026-10-29 \(28 日分\)/);
  assert.match(md, /キーワード表の捕捉率 20\.0%/);
  assert.match(md, /表示だけ多い語/);
  assert.match(md, /2 週分そろうまで出さない \(現在 0 週分\)/);
  assert.doesNotMatch(md, /\| カテゴリ \| 今週 \| 前週 \|/);
});

test("renderDemandLatest: 期間が連続する確定 7 日が 2 週あればカテゴリの前週比を出す", () => {
  const snap = snapFixture({ week: "2026-W44" });
  const latestRows = rowsFor(snap.pages);
  const mk = (week, start, end, clicks) =>
    rowsFor([{ page: "https://stats47.jp/ranking/udon-consumption", clicks, impressions: 500, position: 3 }], { week }).map((r) => ({
      ...r,
      period_start: start,
      period_end: end,
    }));
  const weeklyRows = [...mk("2026-W43", "2026-10-16", "2026-10-22", 40), ...mk("2026-W44", "2026-10-23", "2026-10-29", 55)];
  const md = renderDemandLatest({ week: "2026-W44", historyRows: latestRows, latestRows, weeklyRows, snap, ctx });
  assert.match(md, /\| 企業・家計・経済 \| 55 \| 40 \| \+15 \|/);
});

test("renderGscLatest: 明細の期間と捕捉率の節を出す", () => {
  const md = renderGscLatest({
    summary: null,
    rollingRows: [],
    week: "2026-W44",
    detailCoverage: {
      rolling28d: detailCoverage({
        periodStart: "2026-10-02",
        periodEnd: "2026-10-29",
        queryRows: [{ clicks: 3163 }],
        pageRows: [{ clicks: 16912 }],
        siteClicks: 16701,
      }),
      finalized7d: null,
    },
  });
  assert.match(md, /## 明細 \(queries \/ pages\) の期間と捕捉率/);
  assert.match(md, /2026-10-02 〜 2026-10-29/);
  assert.match(md, /18\.9%/);
  assert.match(md, /確定 7 日の明細はこの週の snapshot に無い/);
});

test("writeGscDemand: snapshot から長期 CSV と DEMAND-LATEST.md を作り、確定 7 日の明細が無い週は weekly CSV を書かない", () => {
  const root = mkdtempSync(join(tmpdir(), "gsc-demand-"));
  try {
    const snapRoot = join(root, "data/gsc/snapshots");
    const write = (week, start, days) => {
      const dir = join(snapRoot, week);
      mkdirSync(dir, { recursive: true });
      const lines = ["date,clicks,impressions,ctr,position"];
      for (let i = 0; i < days; i++) {
        const d = new Date(start + "T00:00:00Z");
        d.setUTCDate(d.getUTCDate() + i);
        lines.push(`${d.toISOString().slice(0, 10)},1,10,0.1,5`);
      }
      writeFileSync(join(dir, "daily.csv"), lines.join("\n") + "\n");
      writeFileSync(join(dir, "pages.csv"), "page,clicks,impressions,ctr,position\nhttps://stats47.jp/ranking/udon-consumption,28,280,0.1,5\n");
      writeFileSync(join(dir, "queries.csv"), "query,clicks,impressions,ctr,position\nうどん,7,70,0.1,5\n");
    };
    write("2026-W40", "2026-09-04", 28);
    write("2026-W41", "2026-09-11", 28);
    write("2026-W44", "2026-10-02", 28);
    mkdirSync(join(root, "data/gsc"), { recursive: true });
    const result = writeGscDemand({ root, week: "2026-W44", ctx });
    assert.deepEqual(result.windows, ["2026-W40", "2026-W44"]);
    const csv = readFileSync(join(root, "data/gsc/demand-history.csv"), "utf8");
    assert.match(csv, /^window_week,basis,period_start,period_end/);
    assert.match(csv, /2026-W40,rolling28d-nonoverlap,2026-09-04,2026-10-01,28,total,site/);
    assert.doesNotMatch(csv, /2026-W41/);
    assert.equal(existsSync(join(root, "data/gsc/demand-weekly.csv")), false);
    assert.match(readFileSync(join(root, "data/gsc/DEMAND-LATEST.md"), "utf8"), /キーワード表の捕捉率 25\.0%/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("snapshotDetailCoverage: 確定 7 日の明細があれば summary の確定 7 日のクリックで捕捉率を出す", () => {
  const snap = snapFixture({
    week: "2026-W46",
    pages7d: [{ page: "https://stats47.jp/ranking/udon-consumption", clicks: "50" }],
    finalized: { finalized7d: { periodStart: "2026-11-06", periodEnd: "2026-11-12", kpis: { clicks: 40 } } },
  });
  snap.queries7d = [{ query: "うどん", clicks: "10" }];
  const cov = snapshotDetailCoverage(snap);
  assert.equal(cov.finalized7d.periodStart, "2026-11-06");
  assert.equal(cov.finalized7d.queryCaptureRate, 0.25);
});

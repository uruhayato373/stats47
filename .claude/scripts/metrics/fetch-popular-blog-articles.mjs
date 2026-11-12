/**
 * ブログの「よく読まれている記事」を GA4 の閲覧数から週次で選ぶ (2026-11-12 オーナー決定)。
 *
 * それまでは 2026-08-28 に手で選んだ 3 記事 (apps/web/src/features/blog/config/popular-articles.ts) のままで、
 * 記事ページの右レールに出すには古く少なかった。直近 28 日の日本の閲覧数で、ブログ記事のページ (/blog/<slug>) の
 * 上位 10 件を data/blog/popular-articles.json に書く。ブログ一覧は上位 3 件、記事ページの右レールは
 * 自分を除く上位 5 件を出す。公開をやめた記事はサイトの読み込みが除く (ここでは判定しない)。
 *
 * Usage:
 *   node .claude/scripts/metrics/fetch-popular-blog-articles.mjs [--dry-run]
 * 認証: ../lib/google-client.cjs (GOOGLE_SERVICE_ACCOUNT_KEY_JSON env または stats47-*.json)。Property: env GA4_PROPERTY_ID。
 */
import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";
import { PROJECT_ROOT } from "./lib/auth.mjs";
import { GA4_PROPERTY_ID } from "../lib/site-config.cjs";
import { createGa4DataClient } from "../lib/google-client.cjs";

export const POPULAR_ARTICLES_PATH = `${datasetDir("blog.operations")}/popular-articles.json`;
export const POPULAR_ARTICLES_COUNT = 10;
const WINDOW_DAYS = 28;

/** /blog/<slug> だけを記事として数える (タグ一覧・一覧のページ送りは除く)。クエリは落とす */
export function blogSlugOf(pagePath) {
  const path = String(pagePath ?? "").split("?")[0].split("#")[0];
  const m = path.match(/^\/blog\/([a-z0-9-]+)\/?$/);
  if (!m || m[1] === "tags" || m[1] === "page") return null;
  return m[1];
}

/** GA4 の行 (pagePath・screenPageViews) から、閲覧数の多い記事を上位 count 件返す (同じ slug は合算) */
export function selectPopularArticles(rows, count = POPULAR_ARTICLES_COUNT) {
  const views = new Map();
  for (const r of rows) {
    const slug = blogSlugOf(r.pagePath);
    if (!slug) continue;
    views.set(slug, (views.get(slug) ?? 0) + Number(r.screenPageViews || 0));
  }
  return [...views.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, count)
    .map(([slug, pageViews]) => ({ slug, pageViews }));
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const end = new Date(Date.now() - 24 * 60 * 60 * 1000); // 昨日 (当日は確定していない)
  const start = new Date(end.getTime() - (WINDOW_DAYS - 1) * 24 * 60 * 60 * 1000);
  const period = { start: isoDate(start), end: isoDate(end) };
  const outPath = join(PROJECT_ROOT, POPULAR_ARTICLES_PATH);
  console.log(`[popular-blog-articles] ${period.start} ~ ${period.end} → ${outPath}`);
  if (process.argv.includes("--dry-run")) return;

  const analyticsdata = createGa4DataClient();
  const property = `properties/${process.env.GA4_PROPERTY_ID || GA4_PROPERTY_ID}`;
  const res = await analyticsdata.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: period.start, endDate: period.end }],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            { filter: { fieldName: "country", stringFilter: { matchType: "EXACT", value: "Japan" } } },
            { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/blog/" } } },
          ],
        },
      },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 500,
    },
  });
  const rows = (res.data.rows ?? []).map((r) => ({
    pagePath: r.dimensionValues?.[0]?.value ?? "",
    screenPageViews: r.metricValues?.[0]?.value ?? "0",
  }));
  const articles = selectPopularArticles(rows);
  if (articles.length === 0) {
    // 0 件を書くと一覧と右レールから「よく読まれている記事」が消える。前回の記録を残して止める
    throw new Error("GA4 がブログ記事の行を 1 件も返さなかった。前回の記録を残す");
  }
  const doc = { generatedAt: new Date().toISOString(), source: "ga4", windowDays: WINDOW_DAYS, period, articles };
  writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n");
  console.log(`[popular-blog-articles] 上位 ${articles.length} 件: ${articles.slice(0, 5).map((a) => a.slug).join(", ")} …`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((error) => {
    console.error(`[popular-blog-articles] 失敗: ${error.message || error}`);
    process.exit(1);
  });
}

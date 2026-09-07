#!/usr/bin/env node
/**
 * build-placement-map.mjs — 「検索需要 (GSC検索表示/クリック) × 供給 (広告在庫/EPC)」を突合して
 * `.claude/state/ads/placement-map-latest.json` を生成する (決定的・ネットワーク任意)。
 *
 * ★ なぜ要るか: これまで「次にどの案件を仕入れ、どのページに当てるか」を決める propose は
 *   手順書レベルで、GSC のページ別実測と在庫・EPC を突き合わせる機械が存在しなかった
 *   (2026-07-28 の棚卸しで確定)。毎回モデルが目視で JOIN しており再現性が無い。ここを固定する。
 *
 * 判定ロジックは `lib/placement-map-core.mjs` (純関数・テスト付き)。本ファイルは入出力のみ。
 *
 * 入力 (ローカル設定 + 配信snapshot。欠けたら理由を記録して続行する):
 *   - GSC pages.csv  .claude/skills/analytics/gsc-improvement/reference/snapshots/<最新週>/pages.csv
 *   - metric config   packages/data-configs/src/metrics/*.ts       (rankingKey → category)
 *   - 意図ハブ        apps/web/src/features/ads/constants/affiliate-category.ts (共有resolver/maps)
 *   - 在庫            apps/web/scripts/affiliate-ads-data.ts        (vertical × adType)
 *   - A8 カタログ     .claude/state/ads/a8-catalog.json             (確定EPC)
 *   - ranking/blog/調査メタ R2 snapshots (取得不能は未解決として明示。広告表示回数は推定しない)
 *
 * usage:
 *   node .claude/scripts/ads/build-placement-map.mjs [--week 2026-W30] [--ranking-json <path>] [--blog-json <path>] [--r2-dir <dir>] [--dry-run]
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { require as tsxRequire } from "tsx/cjs/api";

import { isAnchorRow } from "../gsc/analyze-ctr-seesaw.mjs";

const require = createRequire(import.meta.url);
const core = require("./lib/placement-map-core.mjs");
const scoutCore = require("./lib/a8-scout-core.mjs");

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const SNAP_DIR = join(ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");
const OUT = join(ROOT, ".claude/state/ads/placement-map-latest.json");

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const argAfter = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};

/** CSV 1 行を素朴に分割する (GSC export はフィールド内カンマを含まない)。 */
function readCsv(path) {
  const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
  const head = lines[0].split(",");
  return lines.slice(1).map((l) => {
    const p = l.split(",");
    const o = {};
    head.forEach((h, i) => (o[h.trim()] = p[i]));
    return o;
  });
}

/** metrics の git TS から rankingKey → category / title を作る (isActive:false は除く)。 */
function loadMetricMaps() {
  const dir = join(ROOT, "packages/data-configs/src/metrics");
  const keyToCategory = {};
  const keyTitles = {};
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".ts")) continue;
    const s = readFileSync(join(dir, f), "utf8");
    if (/"isActive":\s*false/.test(s)) continue;
    const key = (s.match(/"key":\s*"([a-z0-9-]+)"/) ?? [])[1];
    const cat = (s.match(/"category":\s*"([a-z]+)"/) ?? [])[1];
    const title = (s.match(/"title":\s*"([^"]+)"/) ?? [])[1];
    if (!key) continue;
    if (cat) keyToCategory[key] = cat;
    if (title) keyTitles[key] = title;
  }
  return { keyToCategory, keyTitles };
}

/** TSの純resolverを共有する。写像の正規表現抽出でnullや後続mapを取りこぼさない。 */
export function loadAffiliateMaps() {
  const runtime = tsxRequire(join(ROOT, "apps/web/src/features/ads/constants/affiliate-category.ts"), import.meta.url);
  return {
    categoryMap: runtime.CATEGORY_AFFILIATE_MAP,
    themeMap: runtime.THEME_AFFILIATE_MAP,
    tagMap: runtime.TAG_AFFILIATE_MAP,
    resolveContentVertical: runtime.resolveContentVertical,
  };
}

/** 配信snapshotから広告resolver入力だけを取り出す。観測値は読まない。 */
export function rankingContentFromSnapshot(snapshot) {
  const result = {};
  for (const item of snapshot?.items ?? []) {
    if (!item.rankingKey || item.isActive === false || (item.areaType && item.areaType !== "prefecture")) continue;
    result[item.rankingKey] = {
      surveyIds: item.surveyIds ?? (item.surveyId ? [item.surveyId] : (item.originalSurveys ?? []).map(survey => typeof survey === "string" ? survey : survey.id)),
      tagKeys: (item.tags ?? []).map(tag => typeof tag === "string" ? tag : tag.tagKey),
      categoryKey: item.categoryKey,
    };
  }
  return result;
}

export function articleContentFromSnapshot(snapshot) {
  const result = {};
  const articles = Array.isArray(snapshot) ? snapshot : snapshot?.articles ?? [];
  for (const article of articles) {
    if (!article.slug || article.published === false) continue;
    // blog runtimeはsurveyIds→tags。カテゴリを推測で補わない。
    result[article.slug] = { surveyIds: article.surveyIds ?? [], tagKeys: (article.tags ?? []).map(tag => typeof tag === "string" ? tag : tag.tagKey) };
  }
  return result;
}

/** 調査一覧や不正なキーをsnapshot GET対象にしない。 */
export function surveyKeysFromRows(rows) {
  return [...new Set(rows.map(row => core.classifyPageUrl(row.url))
    .filter(page => page.type === "survey" && typeof page.key === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.key))
    .map(page => page.key))];
}

/** SSOT から vertical × adType の在庫数を数える。 */
function loadInventory() {
  const lines = readFileSync(join(ROOT, "apps/web/scripts/affiliate-ads-data.ts"), "utf8").split("\n");
  const starts = [];
  lines.forEach((l, i) => {
    if (l.includes('"id":') && l.includes('"af_')) starts.push(i);
  });
  const total = {};
  const banner = {};
  const text = {};
  starts.forEach((s, idx) => {
    const end = idx + 1 < starts.length ? starts[idx + 1] : lines.length;
    const b = lines.slice(s, end);
    const v = (k) => {
      const l = b.find((x) => x.includes(`"${k}":`));
      return l ? l.split(":").slice(1).join(":").trim().replace(/,$/, "").replace(/^"|"$/g, "") : null;
    };
    if (v("isActive") !== "true") return;
    const vert = v("vertical");
    if (!vert) return;
    total[vert] = (total[vert] ?? 0) + 1;
    if (v("adType") === "text") text[vert] = (text[vert] ?? 0) + 1;
    else banner[vert] = (banner[vert] ?? 0) + 1;
  });
  return { total, banner, text };
}

/** 明示ローカルsnapshot、無指定なら公開R2。取得不能はsource/errorに残す。 */
async function loadSnapshot(path, key) {
  const base = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
  try {
    if (path) return { data: JSON.parse(readFileSync(path, "utf8")), source: path };
    // 会社ネットワーク (透過型 TLS 傍受) では素の fetch が届かず、
    // 明示 CONNECT プロキシだけが唯一の外向き経路になる。
    // 設定が無い環境では何もしない (undici が無い場合も落とさない)。
    const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
    if (proxy) {
      try {
        const { ProxyAgent, setGlobalDispatcher } = await import("undici");
        setGlobalDispatcher(new ProxyAgent(proxy));
      } catch { /* undici 不在なら素の fetch のまま試す */ }
    }
    const res = await fetch(`${base}/${key}`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { data: await res.json(), source: "r2" };
  } catch (e) {
    return { data: null, source: null, error: String(e?.message ?? e).slice(0, 120) };
  }
}

async function main() {
  // 最新週の GSC snapshot
  const week = argAfter("--week") ?? readdirSync(SNAP_DIR).filter((d) => /^\d{4}-W\d{2}$/.test(d)).sort().pop();
  const pagesCsv = join(SNAP_DIR, week, "pages.csv");
  if (!existsSync(pagesCsv)) {
    console.error(`GSC snapshot がありません: ${pagesCsv}`);
    process.exit(2);
  }
  const rows = readCsv(pagesCsv)
    // 配置需要はページ単位。同じページの #見出し imp は二重加算しない。
    .filter((r) => !isAnchorRow(r.page))
    .map((r) => ({
      url: r.page,
      clicks: Number(r.clicks) || 0,
      imp: Number(r.impressions) || 0,
    }));

  const { keyToCategory, keyTitles } = loadMetricMaps();
  const affiliateMaps = loadAffiliateMaps();
  const inventory = loadInventory();
  const r2Dir = argAfter("--r2-dir");
  const localPath = key => r2Dir ? join(r2Dir, key) : null;
  const surveyKeys = surveyKeysFromRows(rows);
  const [ranking, blog, surveys] = await Promise.all([
    loadSnapshot(argAfter("--ranking-json") ?? localPath("app/ranking-items/all.json"), "app/ranking-items/all.json"),
    loadSnapshot(argAfter("--blog-json") ?? localPath("app/blog/all.json"), "app/blog/all.json"),
    Promise.all(surveyKeys.map(async key => ({ key, ...await loadSnapshot(localPath(`app/survey/${key}/items.json`), `app/survey/${key}/items.json`) }))),
  ]);
  const rankingContent = rankingContentFromSnapshot(ranking.data);
  const articleContent = articleContentFromSnapshot(blog.data);

  const maps = {
    rankingKeyToCategory: keyToCategory,
    ...affiliateMaps,
    rankingContent,
    articleContent,
    surveyItems: Object.fromEntries(surveys.filter(row => Array.isArray(row.data?.items)).map(row => [row.key, row.data.items])),
  };

  const demand = core.aggregateDemand(rows, maps);
  const gap = core.buildGapReport({
    byVertical: demand.byVertical,
    unmapped: demand.unmapped,
    inventoryByVertical: inventory.total,
    bannerByVertical: inventory.banner,
    textByVertical: inventory.text,
  });

  // reverse: 高EPC の案件と当て先 suggest
  const catalog = JSON.parse(readFileSync(join(ROOT, ".claude/state/ads/a8-catalog.json"), "utf8"));
  const entries = Object.values(catalog.entries ?? {});
  // 共用案件 = doboku-note も配信している A8 プログラム。EPC は口座横断で stats47 単独ではない。
  const sharedProgramIds = ["s00000024757004", "s00000023057002", "s00000022176005"];
  const curated = scoutCore.loadCurated();
  const reverse = core
    .buildReverseCandidates({
      catalogEntries: entries,
      confirmedEpcOf: (e) => scoutCore.confirmedEpc(e),
      registeredProgramIds: entries.filter((e) => ["registered", "published"].includes(e.status)).map((e) => e.programId),
      sharedProgramIds,
      minEpc: 50,
      // blocklist (アダルト・テスト用プログラム等) を候補から外す。判定は scout と同じ実装を使う。
      isExcluded: (e) => scoutCore.isBlocked(e, curated),
    })
    .slice(0, 20)
    .map((c) => ({ ...c, suggestedRankingKeys: core.suggestTargetRankingKeys(c.name, keyTitles, { limit: 3 }) }));

  const out = {
    generatedAt: new Date().toISOString(),
    gscWeek: week,
    measurement: { source: "GSC pages", impressions: "search-result impressions", clicks: "organic-search clicks", actualAdImpressions: false, attribution: "content intent before inventory fallback; not actual served ads or revenue" },
    inputs: {
      pages: rows.length,
      rankingKeys: Object.keys(keyToCategory).length,
      rankingMetadata: ranking.data ? Object.keys(rankingContent).length : null,
      rankingMetadataSource: ranking.source,
      ...(ranking.error ? { rankingMetadataError: ranking.error } : {}),
      articleTags: blog.data ? Object.keys(articleContent).length : null,
      articleTagsSource: blog.source,
      ...(blog.error ? { articleTagsError: blog.error } : {}),
      surveys: surveys.map(({ key, source, error, data }) => ({ key, source, items: data?.items?.length ?? null, ...(error ? { error } : {}) })),
    },
    demand: {
      byType: demand.byType,
      byVertical: demand.byVertical,
      byTypeVertical: demand.byTypeVertical.sort((a, b) => b.imp - a.imp),
    },
    supply: inventory,
    gaps: gap.gaps,
    unmapped: { totalImp: gap.unmappedImp, byReason: gap.unmappedByReason, top: demand.unmapped.slice(0, 30) },
    reverseCandidates: reverse,
  };

  if (DRY) {
    console.log(JSON.stringify({ ...out, unmapped: { ...out.unmapped, top: out.unmapped.top.slice(0, 5) } }, null, 2));
    console.log("\n🧪 dry-run: ファイルは書いていません。");
    return;
  }
  writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");

  console.log(`placement-map → ${OUT.replace(ROOT, ".")}  (GSC ${week} / ${rows.length} ページ)`);
  if (!blog.data) console.log(`  ⚠️ 記事メタを取得できず blog は未解決に計上 (${blog.error})`);
  if (!ranking.data) console.log(`  ⚠️ 指標メタを取得できず ranking は未解決に計上 (${ranking.error})`);
  console.log("\n検索需要 × 供給 (検索表示回数順・広告表示回数ではない):");
  console.log("  vertical   GSC imp  GSC clicks  在庫(b/t)  指摘");
  for (const g of gap.gaps) {
    console.log(
      "  " + g.vertical.padEnd(11),
      String(g.imp).padStart(6),
      String(g.clicks).padStart(6),
      `   ${g.banner}/${g.text}`.padStart(9),
      "  " + (g.kinds.join(",") || "-"),
    );
  }
  console.log(`\n意図未解決/no-intent ページの検索表示回数: ${gap.unmappedImp} (広告未表示の実測ではない)`);
  for (const r of gap.unmappedByReason.slice(0, 6)) {
    console.log("  " + String(r.reason).padEnd(34), String(r.imp).padStart(6), `(${r.pages} ページ) 例: ${r.examples.join(", ")}`);
  }
  console.log("\n高EPC 未接続候補 (上位 5):");
  for (const c of reverse.slice(0, 5)) {
    const tag = c.shared ? " [共用=口座横断]" : "";
    console.log(
      "  確定EPC" + String(c.confirmedEpc).padStart(8),
      String(c.status).padEnd(11),
      String(c.name ?? "").slice(0, 34) + tag,
    );
    if (c.suggestedRankingKeys.length) console.log("      当て先候補:", c.suggestedRankingKeys.map((s) => s.key).join(", "));
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch((e) => {
  console.error("Fatal:", e?.message ?? e);
  process.exit(1);
});

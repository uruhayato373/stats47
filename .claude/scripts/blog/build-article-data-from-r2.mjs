/**
 * build-article-data-from-r2.mjs
 *
 * クラウド環境 (フル DB 不在) 用の data 生成スクリプト。
 * R2 `app/stats/<metric>/values.json` から新規ブログ記事の data/*.json を生成する。
 * 標準の fetch-article-data.mjs は DB(stats_prefecture) 依存で Phase 6 後は動かないため、
 * R2 観測値ストアを直接読んで factual-check 互換スキーマに変換する。
 *
 * 出力 (.local/r2/app/blog/<slug>/data/):
 *   <metric>-prefecture-rankings.json  → { label, unit, year, data: [{areaName, rank, value, unit}] }
 *   <metric>-timeseries.json           → { label, unit, series: [{label, data: [{year, value}]}] }
 *                                         (都道府県観測値の算術平均)
 *
 * 使い方:
 *   node .claude/scripts/blog/build-article-data-from-r2.mjs <slug>:<metricKey>[,<metricKey2>] [...]
 *   例: node .claude/scripts/blog/build-article-data-from-r2.mjs public-phone-prefecture-vanishing:public-phone-count
 */
import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const R2_PUBLIC_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

function metricTitle(metricKey) {
  const f = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics", `${metricKey}.ts`);
  if (!fs.existsSync(f)) return metricKey;
  const txt = fs.readFileSync(f, "utf8");
  const m = txt.match(/"title":\s*"([^"]+)"/);
  return m ? m[1] : metricKey;
}

async function fetchValues(metricKey) {
  const url = `${R2_PUBLIC_BASE}/app/stats/${metricKey}/values.json`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function latestYear(rows) {
  return rows.reduce((max, r) => (r.yearCode > max ? r.yearCode : max), "0");
}

async function buildForMetric(slug, metricKey) {
  const payload = await fetchValues(metricKey);
  const rows = payload.rows || [];
  const label = metricTitle(metricKey);
  const unit = rows[0]?.unit ?? payload.meta?.unit ?? "";
  const year = latestYear(rows);

  // prefecture-rankings: 最新年の 47 県
  const latest = rows
    .filter((r) => r.yearCode === year)
    .map((r) => ({
      areaName: r.areaName,
      rank: typeof r.rank === "number" ? r.rank : null,
      value: r.value,
      unit: r.unit ?? unit,
    }));

  // rank フォールバック: R2 に rank が無い metric は value 降順で算出
  const hasRank = latest.some((x) => typeof x.rank === "number");
  if (!hasRank) {
    latest
      .slice()
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
      .forEach((x, i) => {
        x.rank = i + 1;
      });
  }
  latest.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));

  // 表示用年 (yearCode が 2024100000 等の異形でも先頭4桁を年とみなす)
  const displayYear = String(year).slice(0, 4);

  // timeseries: 年ごとの全国平均
  const byYear = new Map();
  for (const r of rows) {
    if (typeof r.value !== "number") continue;
    if (!byYear.has(r.yearCode)) byYear.set(r.yearCode, []);
    byYear.get(r.yearCode).push(r.value);
  }
  const points = [...byYear.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([y, vals]) => ({
      year: y,
      value: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100,
    }));
  const timeseries = {
    title: `${label}の推移（47都道府県平均）`,
    label,
    unit,
    series: [{ label: "47都道府県平均", data: points }],
  };

  const dataDir = path.join(PROJECT_ROOT, ".local/r2/app/blog", slug, "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const rankPath = path.join(dataDir, `${metricKey}-prefecture-rankings.json`);
  const tsPath = path.join(dataDir, `${metricKey}-timeseries.json`);
  const rankSourcePath = path.join(dataDir, `${metricKey}-prefecture-rankings.source.json`);
  const tsSourcePath = path.join(dataDir, `${metricKey}-timeseries.source.json`);
  const source = `r2:app/stats/${metricKey}/values.json`;
  const restore = `node .claude/scripts/blog/build-article-data-from-r2.mjs ${slug}:${metricKey}`;
  fs.writeFileSync(rankPath, JSON.stringify({ label, unit, year: displayYear, data: latest }, null, 2));
  fs.writeFileSync(tsPath, JSON.stringify(timeseries, null, 2));
  fs.writeFileSync(rankSourcePath, JSON.stringify({
    kind: "ranking",
    rankingKey: metricKey,
    year: displayYear,
    unit,
    label,
    transform: "latest year, all prefectures; rank is preserved or recomputed by value descending",
    source,
    upstream: "metric config → e-Stat → R2 app/stats",
    restore,
    generatedBy: "build-article-data-from-r2.mjs",
  }, null, 2));
  fs.writeFileSync(tsSourcePath, JSON.stringify({
    kind: "ranking",
    rankingKey: metricKey,
    year: `${String(points[0]?.year ?? "").slice(0, 4)}-${String(points.at(-1)?.year ?? "").slice(0, 4)}`,
    unit,
    label,
    transform: "arithmetic mean of all available prefecture observations for each year",
    source,
    upstream: "metric config → e-Stat → R2 app/stats",
    restore,
    generatedBy: "build-article-data-from-r2.mjs",
  }, null, 2));

  return { metricKey, label, unit, year: displayYear, prefCount: latest.length, years: points.length, rankFallback: !hasRank };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: node build-article-data-from-r2.mjs <slug>:<metricKey>[,<metricKey2>] ...");
    process.exit(1);
  }
  for (const arg of args) {
    const [slug, keysCsv] = arg.split(":");
    const keys = keysCsv.split(",").map((k) => k.trim()).filter(Boolean);
    console.log(`\n■ ${slug}`);
    for (const k of keys) {
      try {
        const r = await buildForMetric(slug, k);
        console.log(`  ✅ ${r.metricKey}: ${r.prefCount} 県 / ${r.years} 年分 (latest=${r.year}, unit=${r.unit}, label=${r.label})`);
      } catch (e) {
        console.error(`  ❌ ${k}: ${e.message}`);
      }
    }
  }
}

main();

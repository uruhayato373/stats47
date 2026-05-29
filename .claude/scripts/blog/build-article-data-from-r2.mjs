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
 *   <metric>-timeseries.json           → { label, unit, series: [{year, value}] }  (全国平均)
 *
 * 使い方:
 *   node .claude/scripts/blog/build-article-data-from-r2.mjs <slug>:<metricKey>[,<metricKey2>] [...]
 *   例: node .claude/scripts/blog/build-article-data-from-r2.mjs public-phone-prefecture-vanishing:public-phone-count
 */
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "../../..");
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";
const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

function metricTitle(metricKey) {
  const f = path.join(PROJECT_ROOT, "packages/data-configs/src/metrics", `${metricKey}.ts`);
  if (!fs.existsSync(f)) return metricKey;
  const txt = fs.readFileSync(f, "utf8");
  const m = txt.match(/"title":\s*"([^"]+)"/);
  return m ? m[1] : metricKey;
}

async function fetchValues(metricKey) {
  const r = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: `app/stats/${metricKey}/values.json` }),
  );
  return JSON.parse(await r.Body.transformToString());
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
  const series = [...byYear.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .map(([y, vals]) => ({
      year: y,
      value: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 100) / 100,
    }));

  const dataDir = path.join(PROJECT_ROOT, ".local/r2/app/blog", slug, "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const rankPath = path.join(dataDir, `${metricKey}-prefecture-rankings.json`);
  const tsPath = path.join(dataDir, `${metricKey}-timeseries.json`);
  fs.writeFileSync(rankPath, JSON.stringify({ label, unit, year: displayYear, data: latest }, null, 2));
  fs.writeFileSync(tsPath, JSON.stringify({ label, unit, series }, null, 2));

  return { metricKey, label, unit, year: displayYear, prefCount: latest.length, years: series.length, rankFallback: !hasRank };
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

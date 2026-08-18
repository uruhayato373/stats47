#!/usr/bin/env node
/**
 * export-city-local-finance.cjs
 *
 * stats_city にある 6 local-finance 指標を R2 形式の ranking_item + values にエクスポート。
 *
 * 出力 (per metric):
 *   .local/r2/app/ranking/<metric_key>/item.json
 *   .local/r2/app/ranking/<metric_key>/values.json (areaType=city, partitions[].values[])
 *
 * 対象:
 *   fiscal-strength-index, real-balance-ratio-city, current-balance-ratio-city,
 *   real-public-debt-service-ratio-city, future-burden-ratio-city, per-taxpayer-taxable-income
 *
 * .claude/todo/05_機能バックログ.md #292+
 */

"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const DB_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const LOCAL_R2 = path.join(PROJECT_ROOT, ".local/r2/app/ranking");

const TARGET_METRICS = [
  "fiscal-strength-index",
  "real-balance-ratio-city",
  "current-balance-ratio-city",
  "real-public-debt-service-ratio-city",
  "future-burden-ratio-city",
  "per-taxpayer-taxable-income",
];

function loadMetric(db, key) {
  return db
    .prepare(
      `SELECT key, title, subtitle, description, unit, source_id, category_key, source_config_json,
              visualization_config_json, value_display_config_json, calculation_config_json,
              is_active, seo_title, seo_description, year_format
       FROM metrics WHERE key = ?`,
    )
    .get(key);
}

function loadCityValues(db, key) {
  return db
    .prepare(
      `SELECT metric_key, area_code, area_name, prefecture_code, year_code, year_name, value, unit
       FROM stats_city WHERE metric_key = ? AND value IS NOT NULL
       ORDER BY year_code DESC, value DESC`,
    )
    .all(key);
}

function safeJson(s) {
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function rankPerYear(rows) {
  // rows already sorted by (year_code desc, value desc) — group by year and assign rank
  const byYear = new Map();
  for (const r of rows) {
    if (!byYear.has(r.year_code)) byYear.set(r.year_code, []);
    byYear.get(r.year_code).push(r);
  }
  // ranking direction: 通常は降順だが、ここでは value DESC で読み込まれてるので index+1 が rank
  for (const [, list] of byYear) {
    list.forEach((r, i) => (r._rank = i + 1));
  }
  return byYear;
}

function buildItemJson(metric, yearsInfo) {
  const sourceConfig = safeJson(metric.source_config_json);
  const valueDisplay = safeJson(metric.value_display_config_json);
  const visualization = safeJson(metric.visualization_config_json);
  const calculation = safeJson(metric.calculation_config_json);

  const availableYears = yearsInfo.map((y) => ({
    yearCode: y.year_code,
    yearName: y.year_name,
  }));
  const latestYear = availableYears[0] || null;

  return {
    generatedAt: new Date().toISOString(),
    item: {
      rankingKey: metric.key,
      areaType: "city",
      rankingName: metric.title,
      title: metric.title,
      subtitle: metric.subtitle ?? null,
      description: metric.description ?? null,
      unit: metric.unit ?? "",
      categoryKey: metric.category_key ?? null,
      seoTitle: metric.seo_title ?? null,
      seoDescription: metric.seo_description ?? null,
      availableYears,
      latestYear,
      isActive: metric.is_active === 1,
      isFeatured: false,
      featuredOrder: 0,
      dataSourceId: metric.source_id ?? null,
      sourceConfig: sourceConfig ?? {},
      valueDisplay: valueDisplay ?? { conversionFactor: 1, decimalPlaces: 1 },
      visualization: visualization ?? { colorScheme: "interpolateBlues", colorSchemeType: "sequential" },
      calculation: calculation ?? { isCalculated: false, normalizationOptions: [] },
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    },
  };
}

function buildValuesJson(metricKey, byYear) {
  // descending year, latest first
  const yearCodes = [...byYear.keys()].sort((a, b) => b.localeCompare(a));
  const partitions = yearCodes.map((yc) => {
    const list = byYear.get(yc);
    return {
      yearCode: yc,
      count: list.length,
      values: list.map((r) => ({
        areaType: "city",
        areaCode: r.area_code,
        areaName: r.area_name || "",
        prefectureCode: r.prefecture_code,
        yearCode: r.year_code,
        yearName: r.year_name || `${r.year_code}年度`,
        metricKey,
        value: r.value,
        unit: r.unit ?? "",
        rank: r._rank,
      })),
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    rankingKey: metricKey,
    areaType: "city",
    partitions,
  };
}

function main() {
  if (!fs.existsSync(DB_PATH)) {
    console.error("DB not found");
    process.exit(2);
  }
  const db = new Database(DB_PATH, { readonly: true });

  let totalRows = 0;
  let okCount = 0;
  for (const key of TARGET_METRICS) {
    console.log(`\n=== ${key} ===`);
    const metric = loadMetric(db, key);
    if (!metric) {
      console.log(`  ✗ metric not found`);
      continue;
    }
    const rows = loadCityValues(db, key);
    if (rows.length === 0) {
      console.log(`  ✗ no values`);
      continue;
    }
    const byYear = rankPerYear(rows);
    const yearsInfo = [...byYear.keys()]
      .sort((a, b) => b.localeCompare(a))
      .map((y) => ({
        year_code: y,
        year_name: byYear.get(y)[0].year_name || `${y}年度`,
      }));

    const itemJson = buildItemJson(metric, yearsInfo);
    const valuesJson = buildValuesJson(key, byYear);

    const dir = path.join(LOCAL_R2, key);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "item.json"), JSON.stringify(itemJson, null, 2));
    fs.writeFileSync(path.join(dir, "values.json"), JSON.stringify(valuesJson));

    console.log(`  ✓ ${rows.length} rows, ${yearsInfo.length} years`);
    console.log(`     item: ${dir}/item.json`);
    console.log(`     values: ${dir}/values.json (${(fs.statSync(path.join(dir, "values.json")).size / 1024).toFixed(0)} KB)`);
    totalRows += rows.length;
    okCount++;
  }

  db.close();
  console.log(`\n✓ exported ${okCount}/${TARGET_METRICS.length} metrics, total ${totalRows} rows`);
}

main();

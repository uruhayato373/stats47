#!/usr/bin/env tsx
/**
 * 駅別乗降客数 (国土数値情報 S12) を都道府県別に集計し、
 * local D1 の metrics + stats_prefecture へ「鉄道駅 乗降客数」ランキングとして登録する。
 *
 * - 集計値: 県内の鉄道駅の 1 日あたり乗降客数の「合計」
 * - 対象年: 2019〜2023 年度（JR 各社が S12 に報告している期間。
 *           2018 年以前は JR 欠損があり県間比較に不適なため除外）
 * - 入力 JSON: apps/remotion/scripts/fetch-station-passengers.ts が生成した
 *   apps/remotion/public/station-passengers/{NN}.json
 *
 * 実行: tsx packages/gis/src/station-passengers/register-ranking.ts
 *
 * 本番反映は local D1 への登録後に /sync-snapshots で R2 へ。
 */
import * as fs from "node:fs";
import * as path from "node:path";

import Database from "better-sqlite3";

const REPO_ROOT = path.resolve(__dirname, "../../../..");
const DB_PATH = path.join(
  REPO_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);
const DATA_DIR = path.join(
  REPO_ROOT,
  "apps/remotion/public/station-passengers",
);

const METRIC_KEY = "railway-passengers";
const UNIT = "人/日";
/** 県間比較に使える年（JR 報告開始済み） */
const YEARS = [2019, 2020, 2021, 2022, 2023];
const LATEST_YEAR = 2023;

interface StationJson {
  prefCode: string;
  prefName: string;
  stations: Array<{ counts: Record<string, number> }>;
}

/** 県別・年別の乗降客数合計を集計 */
function aggregate(): Map<string, { name: string; byYear: Map<number, number> }> {
  const result = new Map<
    string,
    { name: string; byYear: Map<number, number> }
  >();
  for (let i = 1; i <= 47; i++) {
    const code = String(i).padStart(2, "0");
    const file = path.join(DATA_DIR, `${code}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(
        `[ERROR] ${file} が無い。先に fetch-station-passengers.ts all を実行してください。`,
      );
    }
    const json = JSON.parse(fs.readFileSync(file, "utf8")) as StationJson;
    const byYear = new Map<number, number>();
    for (const year of YEARS) {
      let sum = 0;
      for (const s of json.stations) {
        const v = s.counts[String(year)];
        if (typeof v === "number" && v > 0) sum += v;
      }
      byYear.set(year, sum);
    }
    result.set(code, { name: json.prefName, byYear });
  }
  return result;
}

/** value 降順に dense rank を付与 */
function rankByValue(
  rows: Array<{ areaCode: string; value: number }>,
): Map<string, number> {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const ranks = new Map<string, number>();
  let rank = 0;
  let prev = Number.NaN;
  sorted.forEach((r, i) => {
    if (r.value !== prev) {
      rank = i + 1;
      prev = r.value;
    }
    ranks.set(r.areaCode, rank);
  });
  return ranks;
}

function main(): void {
  const agg = aggregate();
  const db = new Database(DB_PATH);
  const now = new Date().toISOString();

  // ── metrics 登録（既存なら基本列のみ更新、AI コンテンツ列は触らない）──
  const sourceConfig = JSON.stringify({
    source: {
      name: "国土数値情報 駅別乗降客数",
      url: "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2023.html",
    },
    ksjDataId: "S12",
    ksjVersion: "2023",
    description:
      "都道府県内の鉄道駅の1日あたり乗降客数の合計（S12 に乗降客数が登録されている駅）",
  });
  const valueDisplayConfig = JSON.stringify({
    normalizationOptions: [
      {
        type: "per_population",
        label: "人口1人あたり",
        unit: "人/日/人",
        scaleFactor: 1,
        decimalPlaces: 2,
      },
    ],
    isCalculated: false,
  });
  const description =
    "国土数値情報「駅別乗降客数」(S12) をもとにした、都道府県内の鉄道駅の1日あたり乗降客数の合計。" +
    "S12 に乗降客数が登録されている駅のみを集計対象とする。2019〜2023年度。";
  const seoTitle = `鉄道駅 乗降客数ランキング都道府県【${LATEST_YEAR}年度】`;
  const seoDescription = `${LATEST_YEAR}年度の鉄道駅 乗降客数（県内合計）の都道府県別ランキング。国土数値情報「駅別乗降客数」をもとに47都道府県を地図とグラフで比較。`;

  const existing = db
    .prepare("SELECT key FROM metrics WHERE key = ?")
    .get(METRIC_KEY);
  if (existing) {
    db.prepare(
      `UPDATE metrics SET
         title = ?, description = ?, unit = ?, source_id = 'mlit_ksj',
         category_key = 'infrastructure', source_config_json = ?,
         value_display_config_json = ?, is_active = 1, year_format = 'fiscal',
         year_code = ?, seo_title = ?, seo_description = ?, updated_at = ?
       WHERE key = ?`,
    ).run(
      "鉄道駅 乗降客数",
      description,
      UNIT,
      sourceConfig,
      valueDisplayConfig,
      String(LATEST_YEAR),
      seoTitle,
      seoDescription,
      now,
      METRIC_KEY,
    );
    console.log(`[metrics] 更新: ${METRIC_KEY}`);
  } else {
    db.prepare(
      `INSERT INTO metrics (
         key, title, description, unit, source_id, category_key,
         source_config_json, value_display_config_json,
         is_active, is_featured, year_format, year_code,
         seo_title, seo_description, tags, created_at, updated_at
       ) VALUES (?, ?, ?, ?, 'mlit_ksj', 'infrastructure',
         ?, ?, 1, 0, 'fiscal', ?, ?, ?, '[]', ?, ?)`,
    ).run(
      METRIC_KEY,
      "鉄道駅 乗降客数",
      description,
      UNIT,
      sourceConfig,
      valueDisplayConfig,
      String(LATEST_YEAR),
      seoTitle,
      seoDescription,
      now,
      now,
    );
    console.log(`[metrics] 新規登録: ${METRIC_KEY}`);
  }

  // ── stats_prefecture 登録（冪等: 既存を削除して再投入）──
  db.prepare("DELETE FROM stats_prefecture WHERE metric_key = ?").run(
    METRIC_KEY,
  );
  const insert = db.prepare(
    `INSERT INTO stats_prefecture (
       metric_key, area_code, area_name, year_code, year_name,
       value, unit, rank
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  let dataRows = 0;
  for (const year of YEARS) {
    const rows = [...agg.entries()].map(([code, p]) => ({
      areaCode: `${code}000`,
      areaName: p.name,
      value: p.byYear.get(year) ?? 0,
    }));
    const ranks = rankByValue(rows);
    for (const r of rows) {
      insert.run(
        METRIC_KEY,
        r.areaCode,
        r.areaName,
        String(year),
        `${year}年度`,
        r.value,
        UNIT,
        ranks.get(r.areaCode) ?? null,
      );
      dataRows++;
    }
  }

  // サマリ
  const latest = [...agg.entries()]
    .map(([code, p]) => ({
      name: p.name,
      value: p.byYear.get(LATEST_YEAR) ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
  db.close();

  console.log(`[stats_prefecture] ${dataRows} 行登録 (${YEARS.length} 年 × 47 県)`);
  console.log(
    `[ranking] ${LATEST_YEAR}年度 1位 ${latest[0].name} ${latest[0].value.toLocaleString()} ${UNIT} / ` +
      `47位 ${latest[46].name} ${latest[46].value.toLocaleString()} ${UNIT}`,
  );
  console.log("\n次のステップ: /sync-snapshots で R2 に反映してください。");
}

main();

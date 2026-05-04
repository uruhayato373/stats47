#!/usr/bin/env tsx
/**
 * 市区町村 indicators 一括登録スクリプト
 *
 * 既存の都道府県 SSDS ランキング (area_type='prefecture') を参照し、
 * 対応する市区町村版 (area_type='city') を自動生成して indicators に INSERT する。
 *
 * statsDataId のマッピング:
 *   都道府県 000001xxxx → 市区町村 000002xxxx
 *   cdCat01 は同一コードを使用
 *
 * Usage:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/seed-city-ranking-items.ts --dry-run
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/ranking/src/scripts/seed-city-ranking-items.ts
 */

import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(
  process.cwd(),
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);

function parseArgs() {
  const args = process.argv.slice(2);
  return { dryRun: args.includes("--dry-run") };
}

function mapStatsDataId(prefStatsDataId: string): string {
  return prefStatsDataId.replace("000001", "000002");
}

interface PrefIndicatorRow {
  key: string;
  title: string;
  unit: string;
  subtitle: string | null;
  demographic_attr: string | null;
  normalization_basis: string | null;
  description: string | null;
  source_id: string | null;
  source_config_json: string | null;
  value_display_config_json: string | null;
  visualization_config_json: string | null;
  calculation_config_json: string | null;
  category_key: string | null;
  survey_id: string | null;
  group_key: string | null;
  additional_categories_json: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

function main() {
  const { dryRun } = parseArgs();
  const db = new Database(DB_PATH);

  const prefItems = db.prepare(`
    SELECT key, title, unit, subtitle, demographic_attr,
           normalization_basis, description, source_id, source_config_json,
           value_display_config_json, visualization_config_json, calculation_config_json,
           category_key, survey_id, group_key, additional_categories_json,
           seo_title, seo_description
    FROM indicators
    WHERE area_type = 'prefecture'
      AND is_active = 1
      AND source_config_json LIKE '%000001%'
      AND (
        calculation_config_json IS NULL
        OR json_extract(calculation_config_json, '$.isCalculated') IS NOT 1
      )
    ORDER BY key
  `).all() as PrefIndicatorRow[];

  console.log(`都道府県 SSDS ランキング（非計算型）: ${prefItems.length}件`);

  const existingCityKeys = new Set(
    (db.prepare(`SELECT key FROM indicators WHERE area_type = 'city'`).all() as { key: string }[])
      .map(r => r.key)
  );
  console.log(`既存 city keys: ${existingCityKeys.size}件`);

  const toInsert: PrefIndicatorRow[] = [];

  for (const pref of prefItems) {
    if (existingCityKeys.has(pref.key)) continue;
    if (!pref.source_config_json) continue;

    let sourceConfig: Record<string, unknown>;
    try {
      sourceConfig = JSON.parse(pref.source_config_json);
    } catch {
      console.warn(`  SKIP ${pref.key}: invalid source_config_json`);
      continue;
    }

    const prefStatsDataId = sourceConfig.statsDataId as string;
    if (!prefStatsDataId || !prefStatsDataId.startsWith("000001")) {
      continue;
    }

    const cityStatsDataId = mapStatsDataId(prefStatsDataId);
    const citySourceConfig = { ...sourceConfig, statsDataId: cityStatsDataId };

    toInsert.push({
      ...pref,
      source_config_json: JSON.stringify(citySourceConfig),
    });
  }

  console.log(`\n新規追加対象: ${toInsert.length}件`);

  if (dryRun) {
    for (const item of toInsert) {
      const sc = item.source_config_json ? JSON.parse(item.source_config_json) : {};
      console.log(`  ${item.key} — ${item.title} (${sc.statsDataId} / ${sc.cdCat01})`);
    }
    console.log("\n--dry-run: 実際の INSERT は行いません");
    db.close();
    return;
  }

  const insertStmt = db.prepare(`
    INSERT INTO indicators (
      key, area_type, title, unit, subtitle, demographic_attr,
      normalization_basis, description, source_id, source_config_json,
      value_display_config_json, visualization_config_json, calculation_config_json,
      category_key, survey_id, group_key, additional_categories_json,
      seo_title, seo_description,
      is_active, is_featured, featured_order,
      created_at, updated_at
    ) VALUES (
      ?, 'city', ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?,
      1, 0, 0,
      datetime('now'), datetime('now')
    )
  `);

  const insertMany = db.transaction((items: PrefIndicatorRow[]) => {
    let count = 0;
    for (const item of items) {
      insertStmt.run(
        item.key, item.title, item.unit, item.subtitle, item.demographic_attr,
        item.normalization_basis, item.description, item.source_id, item.source_config_json,
        item.value_display_config_json, item.visualization_config_json, item.calculation_config_json,
        item.category_key, item.survey_id, item.group_key, item.additional_categories_json,
        item.seo_title, item.seo_description,
      );
      count++;
    }
    return count;
  });

  const inserted = insertMany(toInsert);
  console.log(`\n${inserted}件を indicators (area_type='city') に INSERT しました`);

  const total = db.prepare(`SELECT COUNT(*) as c FROM indicators WHERE area_type = 'city' AND is_active = 1`).get() as { c: number };
  console.log(`アクティブ city indicators 合計: ${total.c}件`);

  db.close();
}

main();

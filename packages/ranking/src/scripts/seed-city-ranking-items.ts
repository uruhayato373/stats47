#!/usr/bin/env tsx
/**
 * 市区町村 ranking_items 一括登録スクリプト
 *
 * 既存の都道府県 SSDS ランキング (area_type='prefecture') を参照し、
 * 対応する市区町村版 (area_type='city') を自動生成して ranking_items に INSERT する。
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

/**
 * 都道府県 statsDataId → 市区町村 statsDataId に変換
 * 000001xxxx → 000002xxxx
 */
function mapStatsDataId(prefStatsDataId: string): string {
  return prefStatsDataId.replace("000001", "000002");
}

interface PrefRankingRow {
  ranking_key: string;
  title: string;
  ranking_name: string;
  unit: string;
  subtitle: string | null;
  demographic_attr: string | null;
  normalization_basis: string | null;
  description: string | null;
  data_source_id: string;
  source_config: string;
  value_display_config: string | null;
  visualization_config: string | null;
  calculation_config: string | null;
  category_key: string | null;
  survey_id: string | null;
  group_key: string | null;
  additional_categories: string | null;
  is_calculated: number;
}

function main() {
  const { dryRun } = parseArgs();
  const db = new Database(DB_PATH);

  // 1. アクティブな都道府県 SSDS ランキングを取得（計算型は除外）
  const prefItems = db.prepare(`
    SELECT ranking_key, title, ranking_name, unit, subtitle, demographic_attr,
           normalization_basis, description, data_source_id, source_config,
           value_display_config, visualization_config, calculation_config,
           category_key, survey_id, group_key, additional_categories, is_calculated
    FROM ranking_items
    WHERE area_type = 'prefecture'
      AND is_active = 1
      AND source_config LIKE '%000001%'
      AND (is_calculated = 0 OR is_calculated IS NULL)
    ORDER BY ranking_key
  `).all() as PrefRankingRow[];

  console.log(`都道府県 SSDS ランキング（非計算型）: ${prefItems.length}件`);

  // 2. 既存の city ranking_key を取得（重複防止）
  const existingCityKeys = new Set(
    (db.prepare(`SELECT ranking_key FROM ranking_items WHERE area_type = 'city'`).all() as { ranking_key: string }[])
      .map(r => r.ranking_key)
  );
  console.log(`既存 city ranking_keys: ${existingCityKeys.size}件`);

  // 3. 新規追加対象を決定
  const toInsert: Array<{
    ranking_key: string;
    title: string;
    ranking_name: string;
    unit: string;
    subtitle: string | null;
    demographic_attr: string | null;
    normalization_basis: string | null;
    description: string | null;
    data_source_id: string;
    source_config: string;
    value_display_config: string | null;
    visualization_config: string | null;
    calculation_config: string | null;
    category_key: string | null;
    survey_id: string | null;
    group_key: string | null;
    additional_categories: string | null;
  }> = [];

  for (const pref of prefItems) {
    if (existingCityKeys.has(pref.ranking_key)) continue;

    // source_config の statsDataId をマッピング
    let sourceConfig: Record<string, unknown>;
    try {
      sourceConfig = JSON.parse(pref.source_config);
    } catch {
      console.warn(`  SKIP ${pref.ranking_key}: invalid source_config`);
      continue;
    }

    const prefStatsDataId = sourceConfig.statsDataId as string;
    if (!prefStatsDataId || !prefStatsDataId.startsWith("000001")) {
      continue;
    }

    const cityStatsDataId = mapStatsDataId(prefStatsDataId);
    const citySourceConfig = { ...sourceConfig, statsDataId: cityStatsDataId };

    toInsert.push({
      ranking_key: pref.ranking_key,
      title: pref.title,
      ranking_name: pref.ranking_name,
      unit: pref.unit,
      subtitle: pref.subtitle,
      demographic_attr: pref.demographic_attr,
      normalization_basis: pref.normalization_basis,
      description: pref.description,
      data_source_id: pref.data_source_id,
      source_config: JSON.stringify(citySourceConfig),
      value_display_config: pref.value_display_config,
      visualization_config: pref.visualization_config,
      calculation_config: pref.calculation_config,
      category_key: pref.category_key,
      survey_id: pref.survey_id,
      group_key: pref.group_key,
      additional_categories: pref.additional_categories,
    });
  }

  console.log(`\n新規追加対象: ${toInsert.length}件`);

  if (dryRun) {
    for (const item of toInsert) {
      const sc = JSON.parse(item.source_config);
      console.log(`  ${item.ranking_key} — ${item.title} (${sc.statsDataId} / ${sc.cdCat01})`);
    }
    console.log("\n--dry-run: 実際の INSERT は行いません");
    db.close();
    return;
  }

  // 4. 一括 INSERT
  const insertStmt = db.prepare(`
    INSERT INTO ranking_items (
      ranking_key, area_type, title, ranking_name, unit,
      subtitle, demographic_attr, normalization_basis, description,
      data_source_id, source_config, value_display_config, visualization_config,
      calculation_config, category_key, survey_id, group_key, additional_categories,
      is_active, is_featured, featured_order, is_calculated,
      created_at, updated_at
    ) VALUES (
      ?, 'city', ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      1, 0, 0, 0,
      datetime('now'), datetime('now')
    )
  `);

  const insertMany = db.transaction((items: typeof toInsert) => {
    let count = 0;
    for (const item of items) {
      insertStmt.run(
        item.ranking_key, item.title, item.ranking_name, item.unit,
        item.subtitle, item.demographic_attr, item.normalization_basis, item.description,
        item.data_source_id, item.source_config, item.value_display_config, item.visualization_config,
        item.calculation_config, item.category_key, item.survey_id, item.group_key, item.additional_categories,
      );
      count++;
    }
    return count;
  });

  const inserted = insertMany(toInsert);
  console.log(`\n${inserted}件を ranking_items (area_type='city') に INSERT しました`);

  // 5. 確認
  const total = db.prepare(`SELECT COUNT(*) as c FROM ranking_items WHERE area_type = 'city' AND is_active = 1`).get() as { c: number };
  console.log(`アクティブ city ranking_items 合計: ${total.c}件`);

  db.close();
}

main();

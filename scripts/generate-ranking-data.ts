/**
 * mapping.csvからランキング項目を生成するスクリプト
 * グループ化機能なし、全データを個別に登録
 *
 * 使用方法:
 * npx tsx scripts/generate-ranking-data.ts
 */

import fs from "fs";
import path from "path";

interface MappingRow {
  stats_data_id: string;
  cat01: string;
  item_name: string;
  item_code: string;
  unit: string;
  dividing_value: string;
  new_unit: string;
  ascending: string;
}

interface RankingItem {
  rankingKey: string;
  label: string;
  name: string;
  description: string;
  unit: string;
  dataSourceId: string;
  statsDataId: string;
  cat01: string;
  rankingDirection: "asc" | "desc";
  conversionFactor: number;
  decimalPlaces: number;
}

/**
 * CSVファイルを読み込む
 */
function readCsvFile(filePath: string): MappingRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const headers = lines[0].split(",");

  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(",");
      return {
        stats_data_id: values[0],
        cat01: values[1],
        item_name: values[2],
        item_code: values[3],
        unit: values[4],
        dividing_value: values[5] || "",
        new_unit: values[6] || "",
        ascending: values[7] || "False",
      };
    })
    .filter((row) => row.stats_data_id && row.item_name);
}

/**
 * CSV行からランキングアイテムを作成
 */
function createRankingItems(mappingRows: MappingRow[]): RankingItem[] {
  return mappingRows.map((row) => {
    return {
      rankingKey: row.item_code,
      label: row.item_name,
      name: row.item_name,
      description: row.item_name,
      unit: row.new_unit || row.unit || "‐",
      dataSourceId: "estat",
      statsDataId: row.stats_data_id,
      cat01: row.cat01,
      rankingDirection: row.ascending === "True" ? "asc" : "desc",
      conversionFactor: row.dividing_value ? parseFloat(row.dividing_value) : 1,
      decimalPlaces: row.new_unit ? 2 : 0,
    };
  });
}

/**
 * SQLを生成
 */
function generateSQL(items: RankingItem[]): string {
  let sql = "-- ランキングデータ生成SQL\n";
  sql +=
    "-- このファイルは scripts/generate-ranking-data.ts から自動生成されました\n\n";

  // ランキングアイテムのINSERT文
  sql += "-- Ranking Items\n";
  let itemId = 1;
  const itemsMap = new Map<string, number>();

  for (const item of items) {
    if (!itemsMap.has(item.rankingKey)) {
      itemsMap.set(item.rankingKey, itemId);

      // SQLインジェクション対策のため、シングルクォートをエスケープ
      const escapedName = item.name.replace(/'/g, "''");
      const escapedLabel = item.label.replace(/'/g, "''");
      const escapedDescription = item.description.replace(/'/g, "''");
      const escapedUnit = item.unit.replace(/'/g, "''");

      sql += `INSERT OR IGNORE INTO ranking_items (\n`;
      sql += `  id, ranking_key, label, name, description, unit, data_source_id,\n`;
      sql += `  ranking_direction, conversion_factor, decimal_places, is_active\n`;
      sql += `) VALUES (\n`;
      sql += `  ${itemId}, '${item.rankingKey}', '${escapedLabel}', '${escapedName}', '${escapedDescription}', '${escapedUnit}', '${item.dataSourceId}',\n`;
      sql += `  '${item.rankingDirection}', ${item.conversionFactor}, ${item.decimalPlaces}, 1\n`;
      sql += `);\n\n`;

      // データソースメタデータ
      const escapedCat01 = item.cat01.replace(/'/g, "''");
      sql += `INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)\n`;
      sql += `VALUES (${itemId}, 'estat', '{"stats_data_id": "${item.statsDataId}", "cd_cat01": "${escapedCat01}"}');\n\n`;

      itemId++;
    }
  }

  return sql;
}

/**
 * メイン処理
 */
function main() {
  console.log("📊 Ranking data generation started...");

  // CSVファイルを読み込む
  const csvPath = path.join(process.cwd(), "data", "mapping.csv");
  const mappingRows = readCsvFile(csvPath);

  console.log(`📋 Loaded ${mappingRows.length} mapping rows`);

  // ランキングアイテムを作成
  const items = createRankingItems(mappingRows);

  console.log(`🎯 Generated ${items.length} ranking items`);

  // SQLを生成
  const sql = generateSQL(items);

  // SQLファイルに出力
  const outputPath = path.join(
    process.cwd(),
    "database",
    "migrations",
    "021_populate_ranking_data_from_mapping.sql"
  );
  fs.writeFileSync(outputPath, sql, "utf-8");

  console.log(`✅ SQL file generated: ${outputPath}`);
  console.log(`📦 Total items: ${items.length}`);
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { createRankingItems, generateSQL, readCsvFile };

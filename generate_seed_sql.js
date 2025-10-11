#!/usr/bin/env node

const fs = require("fs");

/**
 * 抽出されたランキングデータからSQLシードデータを生成するスクリプト
 */

// 抽出されたデータを読み込み
const extractedData = JSON.parse(
  fs.readFileSync("./extracted_ranking_data.json", "utf8")
);

// SQLファイルの内容を構築
let sqlContent = `-- 全サブカテゴリのランキング設定シードデータ
-- 生成日時: ${new Date().toISOString()}
-- 総サブカテゴリ数: ${extractedData.length}
-- 総ランキング項目数: ${extractedData.reduce(
  (sum, item) => sum + item.rankingItems.length,
  0
)}

-- 既存データをクリア（必要に応じて）
-- DELETE FROM ranking_items;
-- DELETE FROM subcategory_configs;

`;

// サブカテゴリ設定を挿入
sqlContent += `-- サブカテゴリ設定の挿入
INSERT INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES
`;

const subcategoryInserts = extractedData.map((item) => {
  const name = item.subcategoryName.replace(/([A-Z])/g, " $1").trim();
  return `  ('${item.subcategoryId}', '${item.categoryId}', '${name}', NULL, '${item.defaultRankingKey}')`;
});

sqlContent += subcategoryInserts.join(",\n") + ";\n\n";

// ランキング項目を挿入
sqlContent += `-- ランキング項目の挿入
INSERT INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order, is_active)
VALUES
`;

const rankingItemInserts = [];

extractedData.forEach((subcategory) => {
  subcategory.rankingItems.forEach((item) => {
    // ラベルは名前と同じ（必要に応じて調整）
    const label = item.name;

    rankingItemInserts.push(
      `  ('${subcategory.subcategoryId}', '${item.rankingKey}', '${label}', '${item.statsDataId}', '${item.cdCat01}', '${item.unit}', '${item.name}', ${item.displayOrder}, 1)`
    );
  });
});

sqlContent += rankingItemInserts.join(",\n") + ";\n\n";

// データ確認クエリを追加
sqlContent += `-- データ確認クエリ
-- SELECT 
--   sc.name as subcategory_name,
--   ri.ranking_key,
--   ri.label,
--   ri.stats_data_id,
--   ri.cd_cat01,
--   ri.unit,
--   ri.display_order
-- FROM subcategory_configs sc
-- LEFT JOIN ranking_items ri ON sc.id = ri.subcategory_id
-- ORDER BY sc.id, ri.display_order;

-- 統計情報
-- SELECT 
--   COUNT(DISTINCT sc.id) as subcategory_count,
--   COUNT(ri.id) as ranking_item_count
-- FROM subcategory_configs sc
-- LEFT JOIN ranking_items ri ON sc.id = ri.subcategory_id;
`;

// SQLファイルに出力
const outputPath = "./database/seeds/all_ranking_items_seed.sql";
fs.writeFileSync(outputPath, sqlContent, "utf8");

console.log("シードデータSQL生成完了！");
console.log(`出力ファイル: ${outputPath}`);
console.log(`サブカテゴリ数: ${extractedData.length}`);
console.log(
  `ランキング項目数: ${extractedData.reduce(
    (sum, item) => sum + item.rankingItems.length,
    0
  )}`
);

// カテゴリ別統計を表示
const categoryStats = {};
extractedData.forEach((item) => {
  if (!categoryStats[item.categoryId]) {
    categoryStats[item.categoryId] = {
      subcategories: 0,
      rankingItems: 0,
    };
  }
  categoryStats[item.categoryId].subcategories++;
  categoryStats[item.categoryId].rankingItems += item.rankingItems.length;
});

console.log("\nカテゴリ別統計:");
Object.entries(categoryStats).forEach(([category, stats]) => {
  console.log(
    `  ${category}: ${stats.subcategories}サブカテゴリ, ${stats.rankingItems}ランキング項目`
  );
});

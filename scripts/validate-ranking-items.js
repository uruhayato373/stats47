const fs = require("fs");
const path = require("path");

// mapping.csvから有効なstats_data_idを取得
function getValidStatsDataIds() {
  const csvPath = path.join(__dirname, "../src/data/mapping.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");

  const validIds = new Set();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) {
      const statsDataId = line.split(",")[0];
      if (statsDataId && statsDataId !== "stats_data_id") {
        validIds.add(statsDataId);
      }
    }
  }

  return validIds;
}

// データベースのranking_itemsを取得（コマンドライン引数から）
function getDatabaseStatsDataIds(dbData) {
  const ids = new Set();
  try {
    const data = JSON.parse(dbData);
    if (data && data[0] && data[0].results) {
      data[0].results.forEach((row) => {
        ids.add(row.stats_data_id);
      });
    }
  } catch (error) {
    console.error("Failed to parse database data:", error);
  }
  return ids;
}

// メイン処理
const validIds = getValidStatsDataIds();
console.log(`\n有効なstats_data_id: ${validIds.size}件`);
console.log(Array.from(validIds).sort().join(", "));

// データベースデータが渡された場合は検証
if (process.argv[2]) {
  const dbIds = getDatabaseStatsDataIds(process.argv[2]);
  console.log(`\nデータベースのstats_data_id: ${dbIds.size}件`);

  const invalidIds = Array.from(dbIds).filter((id) => !validIds.has(id));

  if (invalidIds.length > 0) {
    console.log(`\n❌ 無効なstats_data_id: ${invalidIds.length}件`);
    invalidIds.forEach((id) => console.log(`  - ${id}`));
  } else {
    console.log(`\n✅ すべてのstats_data_idは有効です`);
  }
}

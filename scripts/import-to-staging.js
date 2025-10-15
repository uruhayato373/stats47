#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// バックアップディレクトリ
const backupDir = `database/backups/${new Date()
  .toISOString()
  .slice(0, 10)
  .replace(/-/g, "")}`;

// JSONファイルを読み込んでSQLに変換する関数
function jsonToSQL(jsonFile, tableName) {
  const data = JSON.parse(fs.readFileSync(jsonFile, "utf8"));
  const results = data[0].results;

  if (results.length === 0) {
    return `-- No data in ${tableName}\n`;
  }

  // カラム名を取得
  const columns = Object.keys(results[0]);
  const columnList = columns.join(", ");

  // INSERT文を生成
  let sql = `-- Import data to ${tableName}\n`;
  sql += `DELETE FROM ${tableName};\n\n`;

  for (const row of results) {
    const values = columns
      .map((col) => {
        const value = row[col];
        if (value === null) {
          return "NULL";
        } else if (typeof value === "string") {
          return `'${value.replace(/'/g, "''")}'`;
        } else {
          return value;
        }
      })
      .join(", ");

    sql += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
  }

  return sql + "\n";
}

// メイン処理
console.log("📦 本番DBからステージングDBへのデータコピー");
console.log("================================================");
console.log("");

// 各テーブルのデータをSQLに変換
const tables = [
  { json: "ranking_items.json", table: "ranking_items" },
  { json: "estat_metainfo.json", table: "estat_metainfo" },
  { json: "ranking_values.json", table: "ranking_values" },
];

let allSQL = "-- 本番DBからステージングDBへのデータコピー\n";
allSQL += `-- 生成日時: ${new Date().toISOString()}\n\n`;

for (const { json, table } of tables) {
  const jsonFile = path.join(backupDir, json);
  if (fs.existsSync(jsonFile)) {
    console.log(`📄 ${table} を処理中...`);
    allSQL += jsonToSQL(jsonFile, table);
  } else {
    console.log(`⚠️  ${json} が見つかりません`);
  }
}

// SQLファイルを保存
const sqlFile = path.join(backupDir, "import_to_staging.sql");
fs.writeFileSync(sqlFile, allSQL);

console.log("");
console.log("✅ SQLファイル生成完了");
console.log(`📁 出力先: ${sqlFile}`);
console.log(
  `📊 ファイルサイズ: ${(fs.statSync(sqlFile).size / 1024).toFixed(2)}KB`
);

// 実行用のコマンドを表示
console.log("");
console.log("🚀 ステージングDBにインポートするには:");
console.log(
  `npx wrangler d1 execute stats47_staging --env staging --file=${sqlFile}`
);

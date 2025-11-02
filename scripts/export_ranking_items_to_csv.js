#!/usr/bin/env node

/**
 * ranking_itemsテーブルの内容をCSV形式で出力するスクリプト
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// CSVファイルの出力先
const outputPath = path.join(process.cwd(), "ranking_items_export.csv");

try {
  // D1データベースからデータを取得（JSON形式で出力）
  const command = `npx wrangler d1 execute stats47 --local --command "SELECT ranking_key, area_type, label, ranking_name, annotation, unit, group_key, is_active, created_at, updated_at FROM ranking_items ORDER BY ranking_key, area_type;" 2>&1`;

  console.log("データベースからデータを取得中...");
  const output = execSync(command, { encoding: "utf-8" });

  // wranglerの出力からJSONのみを抽出（"results"で始まる行を探す）
  const lines = output.split("\n");
  let jsonStartIndex = -1;
  let jsonEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('"results"') || lines[i].trim().startsWith("[")) {
      jsonStartIndex = i;
      break;
    }
  }

  if (jsonStartIndex === -1) {
    console.error("JSONデータが見つかりません");
    console.error("出力:", output);
    process.exit(1);
  }

  // JSONの終わりを探す（最後の]または}）
  for (let i = lines.length - 1; i >= jsonStartIndex; i--) {
    if (lines[i].trim().endsWith("]") || lines[i].trim().endsWith("}")) {
      jsonEndIndex = i;
      break;
    }
  }

  if (jsonEndIndex === -1) {
    jsonEndIndex = lines.length - 1;
  }

  // JSON部分を抽出
  const jsonText = lines.slice(jsonStartIndex, jsonEndIndex + 1).join("\n");
  
  // JSON結果をパース
  const jsonResult = JSON.parse(jsonText);
  
  if (!jsonResult || !Array.isArray(jsonResult) || !jsonResult[0] || !jsonResult[0].results) {
    console.error("データが見つかりません");
    console.error("JSON:", jsonText);
    process.exit(1);
  }

  const rows = jsonResult[0].results;

  // CSVヘッダー
  const headers = [
    "ranking_key",
    "area_type",
    "label",
    "ranking_name",
    "annotation",
    "unit",
    "group_key",
    "is_active",
    "created_at",
    "updated_at",
  ];

  // CSV行を生成
  const csvRows = [headers.join(",")];

  for (const row of rows) {
    const values = headers.map((header) => {
      const value = row[header];
      // CSVエスケープ（値にカンマやダブルクォートが含まれる場合）
      if (value === null || value === undefined) {
        return "";
      }
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(","));
  }

  // CSVファイルに書き出し
  const csvContent = csvRows.join("\n");
  fs.writeFileSync(outputPath, csvContent, "utf-8");

  console.log(`✅ CSVファイルを出力しました: ${outputPath}`);
  console.log(`📊 件数: ${rows.length}件`);
  console.log("\n最初の5件:");
  console.log(csvRows.slice(0, 6).join("\n"));
  if (csvRows.length > 6) {
    console.log("...");
    console.log(`最後の1件:\n${csvRows[csvRows.length - 1]}`);
  }
} catch (error) {
  console.error("エラーが発生しました:", error);
  if (error.message) {
    console.error("エラーメッセージ:", error.message);
  }
  process.exit(1);
}

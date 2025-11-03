#!/usr/bin/env tsx
/**
 * estat_ranking_mappingsとslug.csvを比較して、未登録のslugを抽出するスクリプト
 *
 * estat_ranking_mappingsテーブルのitem_codeとslug.csvのslugを比較し、
 * estat_ranking_mappingsに登録されていないslugを抽出してCSVファイルに保存します。
 *
 * 使用方法:
 *   npx tsx scripts/find-unregistered-slugs.ts
 *
 * 出力:
 *   unregistered-slugs.csv - 未登録のslug一覧
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * CSVの行をエスケープ（ダブルクォートで囲む）
 */
function escapeCsvField(value: string): string {
  const escaped = value.replace(/"/g, '""');
  if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * wranglerコマンドを実行してestat_ranking_mappingsからitem_code一覧を取得
 */
function getItemCodesFromDatabase(): Set<string> {
  console.log("📊 estat_ranking_mappingsテーブルからitem_codeを取得中...");

  try {
    const command = `npx wrangler d1 execute stats47 --local --command="SELECT DISTINCT item_code FROM estat_ranking_mappings ORDER BY item_code" --json`;
    const output = execSync(command, { encoding: "utf-8", cwd: process.cwd() });

    // JSONレスポンスをパース
    const result = JSON.parse(output.trim());
    const itemCodes = new Set<string>();

    if (Array.isArray(result) && result.length > 0) {
      const firstResult = result[0];
      if (firstResult.results && Array.isArray(firstResult.results)) {
        for (const row of firstResult.results) {
          if (row.item_code) {
            itemCodes.add(String(row.item_code));
          }
        }
      }
    }

    console.log(`✅ ${itemCodes.size}件のitem_codeを取得しました\n`);
    return itemCodes;
  } catch (error) {
    console.error("❌ データベースからの取得に失敗しました:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

/**
 * slug.csvからslug一覧を読み込む
 */
function getSlugsFromCSV(csvPath: string): Array<{
  category: string;
  slug: string;
  year: string;
  filePath: string;
}> {
  console.log(`📄 ${csvPath}からslugを読み込み中...`);

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ ファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

  if (lines.length < 2) {
    console.error("❌ CSVファイルにデータがありません");
    process.exit(1);
  }

  const slugs: Array<{
    category: string;
    slug: string;
    year: string;
    filePath: string;
  }> = [];

  // ヘッダーをスキップしてデータ行を処理
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSVのパース（カンマ区切り、ダブルクォート対応）
    const fields: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // エスケープされたダブルクォート
          currentField += '"';
          j++; // 次の文字をスキップ
        } else {
          // クォートの開始/終了
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // フィールドの区切り
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    fields.push(currentField); // 最後のフィールド

    if (fields.length >= 4) {
      slugs.push({
        category: fields[0],
        slug: fields[1],
        year: fields[2],
        filePath: fields[3],
      });
    }
  }

  console.log(`✅ ${slugs.length}件のslugを読み込みました\n`);
  return slugs;
}

/**
 * 未登録のslugを抽出してCSVに出力
 */
async function findUnregisteredSlugs(): Promise<void> {
  console.log("🔍 estat_ranking_mappingsとslug.csvを比較中...\n");

  try {
    // データベースからitem_code一覧を取得
    const itemCodes = getItemCodesFromDatabase();

    // slug.csvからslug一覧を読み込む
    const csvPath = path.join(process.cwd(), "slugs.csv");
    const slugs = getSlugsFromCSV(csvPath);

    // 未登録のslugを抽出
    const unregisteredSlugs = slugs.filter((item) => !itemCodes.has(item.slug));

    console.log(`📊 比較結果:`);
    console.log(`  - データベースのitem_code数: ${itemCodes.size}件`);
    console.log(`  - slug.csvのslug数: ${slugs.length}件`);
    console.log(`  - 未登録のslug数: ${unregisteredSlugs.length}件\n`);

    if (unregisteredSlugs.length === 0) {
      console.log("✅ すべてのslugがestat_ranking_mappingsに登録されています");
      return;
    }

    // CSVのヘッダー
    const csvLines: string[] = [
      "category,slug,year,file_path",
    ];

    // CSVのデータ行を追加
    for (const item of unregisteredSlugs) {
      const line = [
        escapeCsvField(item.category),
        escapeCsvField(item.slug),
        escapeCsvField(item.year),
        escapeCsvField(item.filePath),
      ].join(",");
      csvLines.push(line);
    }

    // CSVファイルに書き込み
    const outputPath = path.join(process.cwd(), "unregistered-slugs.csv");
    fs.writeFileSync(outputPath, csvLines.join("\n"), "utf-8");

    console.log("=".repeat(50));
    console.log("✅ 未登録のslug一覧をCSVファイルに出力しました");
    console.log("=".repeat(50));
    console.log(`📄 出力ファイル: ${outputPath}`);
    console.log(`📊 未登録slug数: ${unregisteredSlugs.length}件`);
    console.log("=".repeat(50));

    // カテゴリごとの統計
    const categoryStats = new Map<string, number>();
    for (const item of unregisteredSlugs) {
      const count = categoryStats.get(item.category) || 0;
      categoryStats.set(item.category, count + 1);
    }

    console.log("\n📊 カテゴリ別未登録slug数:");
    const sortedCategories = Array.from(categoryStats.entries()).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [category, count] of sortedCategories) {
      console.log(`  ${category}: ${count}件`);
    }
  } catch (error) {
    console.error("❌ エラーが発生しました:");
    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(String(error));
    }
    process.exit(1);
  }
}

// メイン処理を実行
findUnregisteredSlugs().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


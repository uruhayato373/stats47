#!/usr/bin/env tsx
/**
 * slugs.csvから削除済みのエントリを削除するスクリプト
 *
 * unregistered-slugs.csvにリストされているエントリをslugs.csvから削除します。
 *
 * 使用方法:
 *   npx tsx scripts/remove-deleted-slugs-from-csv.ts
 *
 * 注意:
 *   このスクリプトは元のslugs.csvを上書きします。
 *   実行前にバックアップを取ることを推奨します。
 */

import fs from "fs";
import path from "path";

/**
 * CSVの行をパース（ダブルクォート対応）
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされたダブルクォート
        currentField += '"';
        i++; // 次の文字をスキップ
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

  return fields;
}

/**
 * 削除済みのslug一覧を取得
 */
function getDeletedSlugs(): Set<string> {
  console.log("📄 削除済みのslug一覧を取得中...\n");

  // 削除済みの3件を直接指定
  const deletedSlugs = new Set<string>([
    "prefecture-rank,average-broadcast-media-consumption-time-employed-woman,2021",
    "prefecture-rank,average-weight-middle-school-second-grade-female,2022",
    "prefecture-rank,total-area,2023",
  ]);

  console.log(`✅ ${deletedSlugs.size}件の削除対象を取得しました\n`);
  return deletedSlugs;
}

/**
 * slugs.csvから削除済みのエントリを削除
 */
async function removeDeletedSlugsFromCSV(): Promise<void> {
  console.log("🗑️  slugs.csvから削除済みのエントリを削除します\n");
  console.log("⚠️  注意: 元のslugs.csvを上書きします。実行前にバックアップを取ることを推奨します。\n");

  try {
    const slugsCsvPath = path.join(process.cwd(), "slugs.csv");

    // 削除対象のslugを取得
    const deletedSlugs = getDeletedSlugs();

    if (deletedSlugs.size === 0) {
      console.log("✅ 削除対象のエントリがありません");
      return;
    }

    // slugs.csvを読み込む
    if (!fs.existsSync(slugsCsvPath)) {
      console.error(`❌ ファイルが見つかりません: ${slugsCsvPath}`);
      process.exit(1);
    }

    console.log(`📄 ${slugsCsvPath}からデータを読み込み中...`);

    const csvContent = fs.readFileSync(slugsCsvPath, "utf-8");
    const lines = csvContent.split("\n").filter((line) => line.trim() !== "");

    if (lines.length < 2) {
      console.error("❌ slugs.csvにデータがありません");
      process.exit(1);
    }

    console.log(`✅ ${lines.length - 1}件のエントリを読み込みました\n`);

    // ヘッダーを保持
    const header = lines[0];
    const newLines: string[] = [header];

    // 削除対象でないエントリのみを残す
    let removedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCsvLine(line);

      if (fields.length >= 3) {
        const category = fields[0];
        const slug = fields[1];
        const year = fields[2];
        const key = `${category},${slug},${year}`;

        if (deletedSlugs.has(key)) {
          // 削除対象のエントリ
          removedCount++;
          console.log(`  ❌ 削除: ${category}/${slug}/${year}`);
        } else {
          // 残すエントリ
          newLines.push(line);
        }
      } else {
        // フィールド数が不正な場合はそのまま残す
        newLines.push(line);
      }
    }

    // 新しいCSVファイルに書き込み
    fs.writeFileSync(slugsCsvPath, newLines.join("\n") + "\n", "utf-8");

    console.log("\n" + "=".repeat(50));
    console.log("✅ slugs.csvから削除済みのエントリを削除しました");
    console.log("=".repeat(50));
    console.log(`📊 元のエントリ数: ${lines.length - 1}件`);
    console.log(`🗑️  削除したエントリ数: ${removedCount}件`);
    console.log(`📊 残りのエントリ数: ${newLines.length - 1}件`);
    console.log("=".repeat(50));
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
removeDeletedSlugsFromCSV().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


#!/usr/bin/env tsx
/**
 * unregistered-slugs.csvにリストされているMDXファイルとそのディレクトリを削除するスクリプト
 *
 * unregistered-slugs.csvからファイルパスを読み込み、MDXファイルとその親ディレクトリを削除します。
 *
 * 使用方法:
 *   npx tsx scripts/delete-unregistered-slugs.ts
 *
 * 注意:
 *   このスクリプトはファイルを永続的に削除します。実行前に必ずバックアップを取ってください。
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
 * unregistered-slugs.csvから削除対象のディレクトリパスを取得
 */
function getDirectoriesToDelete(csvPath: string): Set<string> {
  console.log(`📄 ${csvPath}から削除対象を読み込み中...\n`);

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

  const directories = new Set<string>();

  // ヘッダーをスキップしてデータ行を処理
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = parseCsvLine(line);

    if (fields.length >= 4) {
      const filePath = fields[3];
      
      // ファイルパスからディレクトリパスを取得
      const dirPath = path.dirname(filePath);
      
      if (fs.existsSync(dirPath)) {
        directories.add(dirPath);
      } else {
        console.warn(`⚠️  ディレクトリが見つかりません: ${dirPath}`);
      }
    }
  }

  return directories;
}

/**
 * ディレクトリを再帰的に削除
 */
function removeDirectory(dirPath: string): void {
  try {
    // ディレクトリ内のすべてのファイルとサブディレクトリを削除
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // サブディレクトリの場合は再帰的に削除
        removeDirectory(filePath);
      } else {
        // ファイルの場合は削除
        fs.unlinkSync(filePath);
      }
    }

    // ディレクトリ自体を削除
    fs.rmdirSync(dirPath);
    console.log(`✅ 削除: ${dirPath}`);
  } catch (error) {
    console.error(`❌ ディレクトリの削除に失敗しました: ${dirPath}`);
    if (error instanceof Error) {
      console.error(`   エラー: ${error.message}`);
    }
  }
}

/**
 * unregistered-slugs.csvにリストされているディレクトリを削除
 */
async function deleteUnregisteredSlugs(): Promise<void> {
  console.log("🗑️  unregistered-slugs.csvにリストされているディレクトリを削除します\n");
  console.log("⚠️  注意: この操作は元に戻せません。実行前にバックアップを取ってください。\n");

  try {
    const csvPath = path.join(process.cwd(), "unregistered-slugs.csv");
    const directories = getDirectoriesToDelete(csvPath);

    if (directories.size === 0) {
      console.log("✅ 削除対象のディレクトリがありません");
      return;
    }

    console.log(`📊 削除対象ディレクトリ数: ${directories.size}件\n`);

    // 削除対象を表示
    console.log("削除対象ディレクトリ:");
    const sortedDirs = Array.from(directories).sort();
    for (const dir of sortedDirs) {
      console.log(`  - ${dir}`);
    }

    console.log("\n" + "=".repeat(50));

    // 各ディレクトリを削除
    let successCount = 0;
    let errorCount = 0;

    for (const dirPath of sortedDirs) {
      try {
        removeDirectory(dirPath);
        successCount++;
      } catch (error) {
        console.error(`❌ 削除エラー: ${dirPath}`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ 削除処理が完了しました");
    console.log("=".repeat(50));
    console.log(`📊 成功: ${successCount}件`);
    if (errorCount > 0) {
      console.log(`❌ エラー: ${errorCount}件`);
    }
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
deleteUnregisteredSlugs().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


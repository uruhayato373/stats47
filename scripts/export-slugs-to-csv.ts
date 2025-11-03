#!/usr/bin/env tsx
/**
 * MDXファイルからslug一覧をCSVにエクスポートするスクリプト
 *
 * contents内のMDXファイルを調査し、存在するslugの一覧をCSV形式で保存します。
 *
 * 使用方法:
 *   npm run tsx scripts/export-slugs-to-csv.ts
 *
 * 出力:
 *   slugs.csv - カテゴリとslugの一覧（重複なし）
 */

import fs from "fs";
import path from "path";
import { listMDXFiles } from "../src/features/blog/repositories/article-repository";

/**
 * CSVの行をエスケープ（ダブルクォートで囲む）
 */
function escapeCsvField(value: string): string {
  // ダブルクォートが含まれている場合は2つにエスケープ
  const escaped = value.replace(/"/g, '""');
  // カンマ、改行、ダブルクォートが含まれている場合はクォートで囲む
  if (escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * slug一覧をCSVファイルに出力
 */
async function exportSlugsToCSV(): Promise<void> {
  console.log("🔍 MDXファイルを調査中...\n");

  try {
    // すべてのMDXファイルを取得
    const files = await listMDXFiles();

    console.log(`📁 検出されたMDXファイル数: ${files.length}件\n`);

    // ユニークなslugのセットを作成
    // キー: `category,slug` の形式
    const slugSet = new Set<string>();
    const slugDetails: Array<{
      category: string;
      slug: string;
      year: string;
      filePath: string;
    }> = [];

    // 各ファイルからslug情報を収集
    for (const file of files) {
      const key = `${file.category},${file.slug}`;
      if (!slugSet.has(key)) {
        slugSet.add(key);
        slugDetails.push({
          category: file.category,
          slug: file.slug,
          year: file.year,
          filePath: file.fullPath,
        });
      }
    }

    // カテゴリとslugでソート
    slugDetails.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      if (a.slug !== b.slug) {
        return a.slug.localeCompare(b.slug);
      }
      return a.year.localeCompare(b.year);
    });

    console.log(`📊 ユニークなslug数: ${slugDetails.length}件\n`);

    // CSVのヘッダー
    const csvLines: string[] = [
      "category,slug,year,file_path",
    ];

    // CSVのデータ行を追加
    for (const detail of slugDetails) {
      const line = [
        escapeCsvField(detail.category),
        escapeCsvField(detail.slug),
        escapeCsvField(detail.year),
        escapeCsvField(detail.filePath),
      ].join(",");
      csvLines.push(line);
    }

    // CSVファイルに書き込み
    const outputPath = path.join(process.cwd(), "slugs.csv");
    fs.writeFileSync(outputPath, csvLines.join("\n"), "utf-8");

    console.log("=".repeat(50));
    console.log("✅ slug一覧をCSVファイルに出力しました");
    console.log("=".repeat(50));
    console.log(`📄 出力ファイル: ${outputPath}`);
    console.log(`📊 総slug数: ${slugDetails.length}件`);
    console.log(`📁 総ファイル数: ${files.length}件`);
    console.log("=".repeat(50));

    // カテゴリごとの統計
    const categoryStats = new Map<string, number>();
    for (const detail of slugDetails) {
      const count = categoryStats.get(detail.category) || 0;
      categoryStats.set(detail.category, count + 1);
    }

    console.log("\n📊 カテゴリ別slug数:");
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
exportSlugsToCSV().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


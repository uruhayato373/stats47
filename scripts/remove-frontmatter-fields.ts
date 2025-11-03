/**
 * MDXファイルのfrontmatterから指定フィールドを削除するスクリプト
 * 
 * contents内の全MDXファイルから、dateを削除します。
 * 
 * 使用方法:
 *   npx tsx scripts/remove-frontmatter-fields.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import matter from "gray-matter";
import { listMDXFiles } from "../src/features/blog/repositories/article-repository";

/**
 * 削除対象のフィールド
 */
const FIELDS_TO_REMOVE = ["date"] as const;

/**
 * MDXファイルのfrontmatterから指定フィールドを削除
 */
async function removeFieldsFromMDXFiles(): Promise<void> {
  console.log("🚀 MDXファイルのfrontmatterから指定フィールドを削除開始...\n");

  try {
    const files = await listMDXFiles();

    console.log(`📁 検出されたMDXファイル数: ${files.length}件\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = `[${i + 1}/${files.length}]`;

      try {
        // ファイルを読み込み
        const fileContent = readFileSync(file.fullPath, "utf-8");

        // frontmatterとコンテンツを分離
        const parsed = matter(fileContent);
        const frontmatter = parsed.data as Record<string, unknown>;

        // 削除対象フィールドが存在するか確認
        const hasFieldsToRemove = FIELDS_TO_REMOVE.some(
          (field) => field in frontmatter
        );

        if (!hasFieldsToRemove) {
          console.log(`${progress} ⏭️  スキップ: ${file.fullPath} (削除対象フィールドなし)`);
          skippedCount++;
          continue;
        }

        // 指定フィールドを削除
        const updatedFrontmatter = { ...frontmatter };
        for (const field of FIELDS_TO_REMOVE) {
          delete updatedFrontmatter[field];
        }

        // 更新されたfrontmatterでファイルを再構築
        const updatedContent = matter.stringify(parsed.content, updatedFrontmatter, {
          language: "yaml",
          delimiters: "---",
        });

        // ファイルを書き込み
        writeFileSync(file.fullPath, updatedContent, "utf-8");

        const removedFields = FIELDS_TO_REMOVE.filter((field) => field in frontmatter);
        console.log(
          `${progress} ✅ 削除完了: ${file.fullPath} (削除: ${removedFields.join(", ")})`
        );
        successCount++;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === "string"
              ? error
              : JSON.stringify(error);
        console.error(`${progress} ❌ エラー: ${file.fullPath}`);
        console.error(`    ${errorMessage}\n`);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 削除結果サマリー");
    console.log("=".repeat(50));
    console.log(`✅ 成功: ${successCount}件`);
    console.log(`⏭️  スキップ: ${skippedCount}件`);
    console.log(`❌ エラー: ${errorCount}件`);
    console.log(`📁 合計: ${files.length}件`);
    console.log(`削除対象フィールド: ${FIELDS_TO_REMOVE.join(", ")}`);
    console.log("=".repeat(50));

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 削除処理で致命的なエラーが発生しました:");
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
removeFieldsFromMDXFiles().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


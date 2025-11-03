/**
 * MDXファイルのカスタムコンポーネントのpropsを修正するスクリプト
 * 
 * contents内の全MDXファイルについて、修正された形式（<ComponentName / ...>）を
 * 正しい形式（<ComponentName ... />）に修正し、rankingKeyとtimeを明示的に追加します。
 * 
 * 使用方法:
 *   npx tsx scripts/fix-mdx-component-props.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { listMDXFiles } from "../src/features/blog/repositories/article-repository";

/**
 * 対象のコンポーネント名
 */
const COMPONENT_NAMES = [
  "PrefectureRankingMap",
  "PrefectureRankingHighlights",
  "PrefectureRankingRegion",
  "PrefectureStatisticsCard",
  "PrefectureRankingTable",
] as const;

/**
 * ファイルパスからディレクトリ構造を解析してrankingKeyとtimeを取得
 */
function parsePath(filePath: string): { rankingKey: string; time: string } | null {
  const contentsIndex = filePath.indexOf("contents/");
  if (contentsIndex === -1) {
    return null;
  }

  const relativePath = filePath.slice(contentsIndex + "contents/".length);
  const parts = relativePath.split("/");

  if (parts.length < 3) {
    return null;
  }

  const category = parts[0];
  const slug = parts[1];
  const fileName = parts[2];
  const time = fileName.replace(/\.mdx$/, "");

  return { rankingKey: slug, time };
}

/**
 * コンポーネントタグを修正
 */
function fixComponentTags(
  content: string,
  componentName: string,
  rankingKey: string,
  time: string
): string {
  // 修正された形式（<ComponentName / ...>）を検出
  const brokenPattern = new RegExp(
    `<${componentName}\\s*/\\s+(.*?)\\s*>`,
    "g"
  );

  return content.replace(brokenPattern, (match, props) => {
    // 閉じタグの場合はスキップ
    if (match.includes(`</${componentName}`)) {
      return match;
    }

    // 既存のpropsからrankingKeyとtime以外を抽出
    const propsToAdd: string[] = [];
    let otherProps = props.trim()
      .replace(/rankingKey\s*=\s*["'][^"']+["']\s*/g, "")
      .replace(/time\s*=\s*["']([^"']+)["']\s*/g, "")
      .trim();

    if (otherProps && !otherProps.match(/^\s*$/)) {
      propsToAdd.push(otherProps);
    }

    // rankingKeyとtimeを明示的に追加
    propsToAdd.push(`rankingKey="${rankingKey}"`);
    propsToAdd.push(`time="${time}"`);

    // 正しい自己終了タグ形式に修正
    return `<${componentName} ${propsToAdd.join(" ")} />`;
  });
}

/**
 * MDXファイルのカスタムコンポーネントのpropsを修正
 */
async function fixMDXComponentProps(): Promise<void> {
  console.log("🚀 MDXファイルのカスタムコンポーネントのpropsを修正開始...\n");

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
        // ファイルパスからrankingKeyとtimeを取得
        const pathInfo = parsePath(file.fullPath);
        if (!pathInfo) {
          console.log(`${progress} ⏭️  スキップ: ${file.fullPath} (パス解析失敗)`);
          skippedCount++;
          continue;
        }

        const { rankingKey, time } = pathInfo;

        // ファイルを読み込み
        const fileContent = readFileSync(file.fullPath, "utf-8");

        // 各コンポーネントタグを修正
        let updatedContent = fileContent;
        let hasChanges = false;

        for (const componentName of COMPONENT_NAMES) {
          // 修正された形式（<ComponentName / ...>）が存在するか確認
          const brokenPattern = new RegExp(
            `<${componentName}\\s*/\\s+[^>]*>`,
            "g"
          );
          const matches = fileContent.match(brokenPattern);

          if (matches && matches.length > 0) {
            const originalContent = updatedContent;
            updatedContent = fixComponentTags(
              updatedContent,
              componentName,
              rankingKey,
              time
            );

            if (updatedContent !== originalContent) {
              hasChanges = true;
            }
          }
        }

        if (!hasChanges) {
          console.log(
            `${progress} ⏭️  スキップ: ${file.fullPath} (修正対象なし)`
          );
          skippedCount++;
          continue;
        }

        // ファイルを書き込み
        writeFileSync(file.fullPath, updatedContent, "utf-8");

        console.log(
          `${progress} ✅ 更新完了: ${file.fullPath} (rankingKey: ${rankingKey}, time: ${time})`
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
    console.log("📊 更新結果サマリー");
    console.log("=".repeat(50));
    console.log(`✅ 成功: ${successCount}件`);
    console.log(`⏭️  スキップ: ${skippedCount}件`);
    console.log(`❌ エラー: ${errorCount}件`);
    console.log(`📁 合計: ${files.length}件`);
    console.log(`対象コンポーネント: ${COMPONENT_NAMES.join(", ")}`);
    console.log("=".repeat(50));

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ 更新処理で致命的なエラーが発生しました:");
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
fixMDXComponentProps().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


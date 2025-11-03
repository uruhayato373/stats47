/**
 * MDXファイルのカスタムコンポーネントに明示的なpropsを追加するスクリプト
 * 
 * contents内の全MDXファイルについて、カスタムコンポーネントに
 * rankingKeyとtimeを明示的にpropsとして渡すようにする。
 * これらの値はディレクトリ構造から取得する。
 * 
 * 使用方法:
 *   npx tsx scripts/add-explicit-props-to-mdx-components.ts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname, basename } from "path";
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
 * 
 * @param filePath - ファイルパス（例: contents/prefecture-rank/abandoned-cultivated-land-area/2014.mdx）
 * @returns rankingKeyとtime、またはnull
 */
function parsePath(filePath: string): { rankingKey: string; time: string } | null {
  // contents/以降のパスを取得
  const contentsIndex = filePath.indexOf("contents/");
  if (contentsIndex === -1) {
    return null;
  }

  const relativePath = filePath.slice(contentsIndex + "contents/".length);
  const parts = relativePath.split("/");

  // contents/{category}/{slug}/{time}.mdx の形式を想定
  if (parts.length < 3) {
    return null;
  }

  // category, slug, timeを取得
  const category = parts[0];
  const slug = parts[1];
  const fileName = parts[2];
  const time = fileName.replace(/\.mdx$/, "");

  // slugをrankingKeyとして使用
  const rankingKey = slug;

  return { rankingKey, time };
}

/**
 * コンポーネントタグにpropsを追加または更新
 * 
 * @param content - MDXファイルのコンテンツ
 * @param componentName - コンポーネント名
 * @param rankingKey - ランキングキー
 * @param time - 時間（年度など）
 * @returns 更新されたコンテンツ
 */
function addPropsToComponent(
  content: string,
  componentName: string,
  rankingKey: string,
  time: string
): string {
  // 修正された形式も含めて検出: <ComponentName / ... > や <ComponentName / ... />
  // スラッシュの後にpropsがある形式: <ComponentName / prop="value" ...>
  const brokenPattern = new RegExp(
    `<${componentName}\\s*/\\s+(.*?)>`,
    "g"
  );
  
  // スラッシュの前にpropsがある形式（<ComponentName prop="value" / >）
  const brokenPattern2 = new RegExp(
    `<${componentName}\\s+([^/]*?)\\s*/\\s*>`,
    "g"
  );

  // 正しい自己終了タグ: <ComponentName /> または <ComponentName {...props} />
  const selfClosingPattern = new RegExp(
    `<${componentName}\\s*([^/>]*?)\\s*/>`,
    "g"
  );

  // 通常タグの開始タグ: <ComponentName>...</ComponentName>
  const normalTagPattern = new RegExp(
    `<${componentName}\\s*([^>]*?)\\s*>(?!.*</${componentName}>)`,
    "g"
  );

  let updatedContent = content;

  // 修正された形式（<ComponentName / ... >）を処理（スラッシュの後にpropsがある形式）
  updatedContent = updatedContent.replace(brokenPattern, (match, props) => {
    // 閉じタグの場合はスキップ
    if (match.includes(`</${componentName}`)) {
      return match;
    }

    // 既存のpropsを解析（スラッシュの後にpropsがある形式）
    const rankingKeyMatch = props.match(/rankingKey\s*=\s*["']([^"']+)["']/);
    const timeMatch = props.match(/time\s*=\s*["']([^"']+)["']/);

    // 既存のpropsがあっても、常にrankingKeyとtimeを明示的に追加
    // 値が既に正しい場合はそのまま、間違っている場合は更新
    const propsToAdd: string[] = [];
    
    // 既存のpropsからrankingKeyとtime以外を抽出
    let otherProps = props.trim();
    if (rankingKeyMatch) {
      otherProps = otherProps.replace(/rankingKey\s*=\s*["'][^"']+["']\s*/g, "").trim();
    }
    if (timeMatch) {
      otherProps = otherProps.replace(/time\s*=\s*["'][^"']+["']\s*/g, "").trim();
    }
    
    if (otherProps && !otherProps.match(/^\s*$/)) {
      propsToAdd.push(otherProps);
    }
    
    // rankingKeyとtimeを明示的に追加
    propsToAdd.push(`rankingKey="${rankingKey}"`);
    propsToAdd.push(`time="${time}"`);

    // 正しい自己終了タグ形式に修正
    return `<${componentName} ${propsToAdd.join(" ")} />`;
  });

  // 修正された形式（<ComponentName prop="value" / >）を処理（スラッシュの前にpropsがある形式）
  updatedContent = updatedContent.replace(brokenPattern2, (match, props) => {
    // 閉じタグの場合はスキップ
    if (match.includes(`</${componentName}`)) {
      return match;
    }

    // 既存のpropsを解析
    const rankingKeyMatch = props.match(/rankingKey\s*=\s*["']([^"']+)["']/);
    const timeMatch = props.match(/time\s*=\s*["']([^"']+)["']/);

    // 既存のpropsがある場合は更新、ない場合は追加
    let newProps = props.trim();
    
    if (rankingKeyMatch || timeMatch) {
      // 既存のpropsを削除
      newProps = newProps.replace(/rankingKey\s*=\s*["'][^"']+["']\s*/g, "");
      newProps = newProps.replace(/time\s*=\s*["'][^"']+["']\s*/g, "");
    }

    // 新しいpropsを追加
    const propsToAdd = [];
    if (newProps && !newProps.match(/^\s*$/)) {
      propsToAdd.push(newProps.trim());
    }
    propsToAdd.push(`rankingKey="${rankingKey}"`);
    propsToAdd.push(`time="${time}"`);

    // 正しい自己終了タグ形式に修正
    return `<${componentName} ${propsToAdd.join(" ")} />`;
  });

  // 自己終了タグを処理
  updatedContent = updatedContent.replace(selfClosingPattern, (match, props) => {
    // 既存のpropsを解析
    const rankingKeyMatch = props.match(/rankingKey\s*=\s*["']([^"']+)["']/);
    const timeMatch = props.match(/time\s*=\s*["']([^"']+)["']/);

    // 既存のpropsがある場合は更新、ない場合は追加
    let newProps = props.trim();
    
    if (rankingKeyMatch || timeMatch) {
      // 既存のpropsを削除
      newProps = newProps.replace(/rankingKey\s*=\s*["'][^"']+["']\s*/g, "");
      newProps = newProps.replace(/time\s*=\s*["'][^"']+["']\s*/g, "");
    }

    // 新しいpropsを追加
    const propsToAdd = [];
    if (newProps && !newProps.match(/^\s*$/)) {
      propsToAdd.push(newProps.trim());
    }
    propsToAdd.push(`rankingKey="${rankingKey}"`);
    propsToAdd.push(`time="${time}"`);

    return `<${componentName} ${propsToAdd.join(" ")} />`;
  });

  // 通常タグを処理（開始タグのみ、閉じタグはそのまま）
  updatedContent = updatedContent.replace(normalTagPattern, (match, props) => {
    // 閉じタグの場合はスキップ
    if (match.includes(`</${componentName}`)) {
      return match;
    }

    // 既存のpropsを解析
    const rankingKeyMatch = props.match(/rankingKey\s*=\s*["']([^"']+)["']/);
    const timeMatch = props.match(/time\s*=\s*["']([^"']+)["']/);

    let newProps = props.trim();
    
    if (rankingKeyMatch || timeMatch) {
      // 既存のpropsを削除
      newProps = newProps.replace(/rankingKey\s*=\s*["'][^"']+["']\s*/g, "");
      newProps = newProps.replace(/time\s*=\s*["'][^"']+["']\s*/g, "");
    }

    // 新しいpropsを追加
    const propsToAdd = [];
    if (newProps && !newProps.match(/^\s*$/)) {
      propsToAdd.push(newProps.trim());
    }
    propsToAdd.push(`rankingKey="${rankingKey}"`);
    propsToAdd.push(`time="${time}"`);

    return `<${componentName} ${propsToAdd.join(" ")}>`;
  });

  return updatedContent;
}

/**
 * MDXファイルのカスタムコンポーネントに明示的なpropsを追加
 */
async function addExplicitPropsToMDXFiles(): Promise<void> {
  console.log("🚀 MDXファイルのカスタムコンポーネントに明示的なpropsを追加開始...\n");

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

        // 各コンポーネントタグにpropsを追加
        let updatedContent = fileContent;
        let hasChanges = false;

        for (const componentName of COMPONENT_NAMES) {
          // コンポーネントタグが存在するか確認（修正された形式も検出）
          // <ComponentName /> または <ComponentName / ... > または <ComponentName>...</ComponentName>
          const componentPattern = new RegExp(`<${componentName}[^>]*>`, "g");
          const matches = fileContent.match(componentPattern);

          if (matches && matches.length > 0) {
            const originalContent = updatedContent;
            updatedContent = addPropsToComponent(updatedContent, componentName, rankingKey, time);
            
            if (updatedContent !== originalContent) {
              hasChanges = true;
            }
          }
        }

        if (!hasChanges) {
          console.log(`${progress} ⏭️  スキップ: ${file.fullPath} (対象コンポーネントなしまたは既に更新済み)`);
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
addExplicitPropsToMDXFiles().catch((error) => {
  console.error("❌ 予期しないエラーが発生しました:", error);
  process.exit(1);
});


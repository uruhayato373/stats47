#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * ランキングコンポーネントからデータを抽出するスクリプト
 */

// 抽出対象のディレクトリ
const subcategoriesDir = "./src/components/subcategories";

// 結果を格納する配列
const extractedData = [];

/**
 * ファイルからランキングデータを抽出
 */
function extractRankingData(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // ファイルパスからカテゴリとサブカテゴリを抽出
    const pathParts = filePath.split("/");
    const categoryIndex =
      pathParts.findIndex((part) => part === "subcategories") + 1;
    const subcategoryIndex = categoryIndex + 1;

    if (categoryIndex === -1 || subcategoryIndex >= pathParts.length) {
      console.warn(`Invalid path structure: ${filePath}`);
      return null;
    }

    const categoryId = pathParts[categoryIndex];
    const subcategoryId = pathParts[subcategoryIndex];

    // TypeScriptの型定義からランキングキーを抽出
    const typeMatch = content.match(/type RankingTab =[^;]+;/s);
    if (!typeMatch) {
      console.warn(`No RankingTab type found in: ${filePath}`);
      return null;
    }

    const rankingKeys = typeMatch[0]
      .replace(/type RankingTab =/, "")
      .replace(/;/g, "")
      .split("|")
      .map((key) => key.trim().replace(/"/g, ""))
      .filter((key) => key.length > 0);

    // rankingsオブジェクトからデータを抽出
    const rankingsMatch = content.match(/const rankings = \{([\s\S]*?)\};/);
    if (!rankingsMatch) {
      console.warn(`No rankings object found in: ${filePath}`);
      return null;
    }

    const rankingsContent = rankingsMatch[1];
    const rankingItems = [];

    // 各ランキング項目を抽出
    rankingKeys.forEach((key, index) => {
      const keyMatch = rankingsContent.match(
        new RegExp(`${key}:\\s*\\{([\\s\\S]*?)\\}`)
      );
      if (keyMatch) {
        const itemContent = keyMatch[1];

        const statsDataIdMatch = itemContent.match(
          /statsDataId:\s*["']([^"']+)["']/
        );
        const cdCat01Match = itemContent.match(/cdCat01:\s*["']([^"']+)["']/);
        const unitMatch = itemContent.match(/unit:\s*["']([^"']+)["']/);
        const nameMatch = itemContent.match(/name:\s*["']([^"']+)["']/);

        if (statsDataIdMatch && cdCat01Match && unitMatch && nameMatch) {
          rankingItems.push({
            rankingKey: key,
            statsDataId: statsDataIdMatch[1],
            cdCat01: cdCat01Match[1],
            unit: unitMatch[1],
            name: nameMatch[1],
            displayOrder: index + 1,
          });
        }
      }
    });

    // useStateの初期値からデフォルトランキングキーを抽出
    const useStateMatch = content.match(/useState<RankingTab>\("([^"]+)"\)/);
    const defaultRankingKey = useStateMatch ? useStateMatch[1] : rankingKeys[0];

    // サブカテゴリ名を抽出（SubcategoryLayoutのpropsから）
    const subcategoryNameMatch = content.match(
      /subcategory=\{\s*subcategory\s*\}/
    );
    // categories.jsonから実際の名前を取得する必要があるが、ここではファイル名から推測

    return {
      categoryId,
      subcategoryId,
      subcategoryName: subcategoryId
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
      defaultRankingKey,
      rankingItems,
    };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return null;
  }
}

/**
 * ディレクトリを再帰的に探索してランキングファイルを検索
 */
function findRankingFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith("Ranking.tsx")) {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// メイン処理
console.log("ランキングデータの抽出を開始...");

const rankingFiles = findRankingFiles(subcategoriesDir);
console.log(`見つかったランキングファイル: ${rankingFiles.length}個`);

for (const file of rankingFiles) {
  console.log(`処理中: ${file}`);
  const data = extractRankingData(file);
  if (data) {
    extractedData.push(data);
    console.log(`  - カテゴリ: ${data.categoryId}`);
    console.log(`  - サブカテゴリ: ${data.subcategoryId}`);
    console.log(`  - ランキング項目数: ${data.rankingItems.length}`);
    console.log(`  - デフォルト: ${data.defaultRankingKey}`);
  }
}

// 結果をJSONファイルに出力
const outputPath = "./extracted_ranking_data.json";
fs.writeFileSync(outputPath, JSON.stringify(extractedData, null, 2), "utf8");

console.log(`\n抽出完了！`);
console.log(`処理したファイル数: ${rankingFiles.length}`);
console.log(`抽出成功: ${extractedData.length}`);
console.log(`出力ファイル: ${outputPath}`);

// 統計情報を表示
const categoryStats = {};
extractedData.forEach((item) => {
  if (!categoryStats[item.categoryId]) {
    categoryStats[item.categoryId] = 0;
  }
  categoryStats[item.categoryId]++;
});

console.log("\nカテゴリ別統計:");
Object.entries(categoryStats).forEach(([category, count]) => {
  console.log(`  ${category}: ${count}個のサブカテゴリ`);
});

const totalRankingItems = extractedData.reduce(
  (sum, item) => sum + item.rankingItems.length,
  0
);
console.log(`\n総ランキング項目数: ${totalRankingItems}`);

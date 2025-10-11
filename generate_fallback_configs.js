#!/usr/bin/env node

const fs = require("fs");

/**
 * 抽出されたランキングデータからFALLBACK_CONFIGSを生成するスクリプト
 */

// 抽出されたデータを読み込み
const extractedData = JSON.parse(
  fs.readFileSync("./extracted_ranking_data.json", "utf8")
);

// TypeScriptコードを生成
let tsContent = `// 全サブカテゴリのフォールバック設定
// 生成日時: ${new Date().toISOString()}
// 総サブカテゴリ数: ${extractedData.length}
// 総ランキング項目数: ${extractedData.reduce(
  (sum, item) => sum + item.rankingItems.length,
  0
)}

export const FALLBACK_CONFIGS: Record<string, RankingConfigResponse> = {
`;

extractedData.forEach((subcategory, index) => {
  tsContent += `  "${subcategory.subcategoryId}": {\n`;
  tsContent += `    subcategory: {\n`;
  tsContent += `      id: "${subcategory.subcategoryId}",\n`;
  tsContent += `      categoryId: "${subcategory.categoryId}",\n`;
  tsContent += `      name: "${subcategory.subcategoryName}",\n`;
  tsContent += `      description: null,\n`;
  tsContent += `      defaultRankingKey: "${subcategory.defaultRankingKey}"\n`;
  tsContent += `    },\n`;
  tsContent += `    rankingItems: [\n`;

  subcategory.rankingItems.forEach((item, itemIndex) => {
    tsContent += `      {\n`;
    tsContent += `        rankingKey: "${item.rankingKey}",\n`;
    tsContent += `        label: "${item.name}",\n`;
    tsContent += `        statsDataId: "${item.statsDataId}",\n`;
    tsContent += `        cdCat01: "${item.cdCat01}",\n`;
    tsContent += `        unit: "${item.unit}",\n`;
    tsContent += `        name: "${item.name}",\n`;
    tsContent += `        displayOrder: ${item.displayOrder},\n`;
    tsContent += `        isActive: true\n`;
    tsContent += `      }${
      itemIndex < subcategory.rankingItems.length - 1 ? "," : ""
    }\n`;
  });

  tsContent += `    ]\n`;
  tsContent += `  }${index < extractedData.length - 1 ? "," : ""}\n`;
});

tsContent += `};\n`;

// TypeScriptファイルに出力
const outputPath = "./src/lib/ranking/fallback-configs.ts";
fs.writeFileSync(outputPath, tsContent, "utf8");

console.log("FALLBACK_CONFIGS生成完了！");
console.log(`出力ファイル: ${outputPath}`);
console.log(`サブカテゴリ数: ${extractedData.length}`);
console.log(
  `ランキング項目数: ${extractedData.reduce(
    (sum, item) => sum + item.rankingItems.length,
    0
  )}`
);

// カテゴリ別統計を表示
const categoryStats = {};
extractedData.forEach((item) => {
  if (!categoryStats[item.categoryId]) {
    categoryStats[item.categoryId] = {
      subcategories: 0,
      rankingItems: 0,
    };
  }
  categoryStats[item.categoryId].subcategories++;
  categoryStats[item.categoryId].rankingItems += item.rankingItems.length;
});

console.log("\nカテゴリ別統計:");
Object.entries(categoryStats).forEach(([category, stats]) => {
  console.log(
    `  ${category}: ${stats.subcategories}サブカテゴリ, ${stats.rankingItems}ランキング項目`
  );
});

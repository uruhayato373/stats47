#!/usr/bin/env node

const fs = require("fs");

/**
 * categories.jsonからrankingComponentプロパティを削除するスクリプト
 */

// categories.jsonを読み込み
const categoriesPath = "./src/config/categories.json";
const categories = JSON.parse(fs.readFileSync(categoriesPath, "utf8"));

console.log("categories.jsonの更新を開始...");

let updatedCount = 0;

// 各カテゴリのサブカテゴリからrankingComponentプロパティを削除
categories.forEach((category) => {
  if (category.subcategories) {
    category.subcategories.forEach((subcategory) => {
      if (subcategory.rankingComponent) {
        delete subcategory.rankingComponent;
        updatedCount++;
        console.log(
          `✓ 削除: ${category.id}/${subcategory.id} の rankingComponent`
        );
      }
    });
  }
});

// 更新されたcategories.jsonを保存
fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2), "utf8");

console.log("\n更新完了！");
console.log(`削除したrankingComponentプロパティ数: ${updatedCount}`);
console.log(`更新されたファイル: ${categoriesPath}`);

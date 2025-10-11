#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * 削除されたランキングコンポーネントへの参照を修正するスクリプト
 */

// 修正対象のファイルとパターン
const fixes = [
  // index.tsxファイルでランキングコンポーネントのインポートを削除
  {
    pattern: /import.*Ranking.*from.*['"]\.\/.*Ranking['"];?\n?/g,
    replacement: "",
    description: "ランキングコンポーネントのインポートを削除",
  },
  // Page.tsxファイルでランキングコンポーネントのインポートを削除
  {
    pattern: /import.*Ranking.*from.*['"]\.\/.*Ranking['"];?\n?/g,
    replacement: "",
    description: "Page.tsxファイルのランキングコンポーネントインポートを削除",
  },
  // ランキングコンポーネントの使用箇所を削除
  {
    pattern: /<.*Ranking[^>]*\/>/g,
    replacement: "",
    description: "ランキングコンポーネントの使用箇所を削除",
  },
  // ランキングコンポーネントのexportを削除
  {
    pattern: /export.*Ranking.*from.*['"]\.\/.*Ranking['"];?\n?/g,
    replacement: "",
    description: "ランキングコンポーネントのexportを削除",
  },
];

// 修正対象のディレクトリ
const targetDirs = ["src/components/subcategories"];

console.log("ランキングコンポーネント参照の修正を開始...");

let totalFiles = 0;
let modifiedFiles = 0;

// ディレクトリを再帰的に探索
function processDirectory(dir) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (item.endsWith(".tsx") || item.endsWith(".ts")) {
      processFile(fullPath);
    }
  }
}

// ファイルを処理
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    let modifiedContent = content;
    let hasChanges = false;

    // 各修正パターンを適用
    fixes.forEach((fix) => {
      const matches = modifiedContent.match(fix.pattern);
      if (matches && matches.length > 0) {
        modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
        hasChanges = true;
        console.log(`  ${fix.description}: ${matches.length}箇所`);
      }
    });

    if (hasChanges) {
      fs.writeFileSync(filePath, modifiedContent, "utf8");
      console.log(`✓ 修正: ${filePath}`);
      modifiedFiles++;
    }

    totalFiles++;
  } catch (error) {
    console.error(`✗ エラー: ${filePath} - ${error.message}`);
  }
}

// 各ターゲットディレクトリを処理
targetDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
});

console.log("\n修正完了！");
console.log(`処理したファイル数: ${totalFiles}`);
console.log(`修正したファイル数: ${modifiedFiles}`);

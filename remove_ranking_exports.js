#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * ランキングコンポーネントのexportを削除するスクリプト
 */

// 修正対象のディレクトリ
const targetDirs = ["src/components/subcategories"];

console.log("ランキングコンポーネントのexport削除を開始...");

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
    } else if (item === "index.ts" || item === "index.tsx") {
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

    // ランキングコンポーネントのexportを削除
    const rankingExportPattern =
      /export\s*{\s*[^}]*Ranking[^}]*}\s*from\s*['"][^'"]*['"];?\n?/g;
    const matches = modifiedContent.match(rankingExportPattern);

    if (matches && matches.length > 0) {
      modifiedContent = modifiedContent.replace(rankingExportPattern, "");
      hasChanges = true;
      console.log(`  ${filePath}: ${matches.length}個のランキングexportを削除`);
    }

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

#!/usr/bin/env node
/**
 * koumuin-claude-code シリーズ全 31 本の回遊フッタ内プレースホルダー
 * `{{MAGAZINE_URL}}` を、実際の note マガジン URL に一括置換する。
 *
 * note マガジンを作成して URL が判明したら実行する。
 *
 * Usage:
 *   node .claude/scripts/note/inject-magazine-url.cjs <マガジンURL>
 *   例) node .claude/scripts/note/inject-magazine-url.cjs https://note.com/stats47/m/mXXXXXXXX
 *
 * 冪等性: 置換は {{MAGAZINE_URL}} に対してのみ行う。既に実 URL 注入済みの記事は
 * プレースホルダーが無いのでスキップされる（再実行で別 URL に変えたい場合は
 * add-koumuin-magazine-footer.cjs でフッタを貼り直してから再実行する）。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const SERIES_DIR = path.join(
  PROJECT_ROOT,
  "docs/31_note記事原稿/koumuin-claude-code",
);
const PLACEHOLDER = "{{MAGAZINE_URL}}";

function main() {
  const url = process.argv[2];
  if (!url) {
    console.error(
      "usage: node inject-magazine-url.cjs <マガジンURL>\n" +
        "  例) node inject-magazine-url.cjs https://note.com/stats47/m/mXXXXXXXX",
    );
    process.exit(2);
  }
  if (!/^https:\/\/note\.com\/[^/]+\/m\//.test(url)) {
    console.error(
      `WARN: 渡された URL がマガジン URL の形式 (https://note.com/<handle>/m/...) と一致しません: ${url}`,
    );
    console.error("意図した URL か確認してください。中断します。");
    process.exit(2);
  }

  const dirs = fs
    .readdirSync(SERIES_DIR)
    .filter((d) => /^\d{2}-/.test(d))
    .sort();

  let injected = 0;
  let skipped = 0;

  for (const slug of dirs) {
    const draftPath = path.join(SERIES_DIR, slug, "draft.md");
    if (!fs.existsSync(draftPath)) continue;
    const content = fs.readFileSync(draftPath, "utf8");
    if (!content.includes(PLACEHOLDER)) {
      console.log(`SKIP ${slug} (プレースホルダーなし)`);
      skipped++;
      continue;
    }
    const updated = content.split(PLACEHOLDER).join(url);
    fs.writeFileSync(draftPath, updated);
    console.log(`OK   ${slug}`);
    injected++;
  }

  console.log(`\nInjected: ${injected}, Skipped: ${skipped}`);
  if (injected > 0) {
    console.log(`マガジン URL: ${url}`);
  }
}

main();

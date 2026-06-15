#!/usr/bin/env node
/**
 * note 記事シリーズの回遊フッタ内マガジン URL プレースホルダーを、
 * 実際の note マガジン URL に一括置換する (vertical 対応)。
 *
 * note マガジンを作成して URL が判明したら実行する。
 *
 * Usage:
 *   node .claude/scripts/note/inject-magazine-url.cjs [--vertical <name>] [--placeholder <ph>] <マガジンURL>
 *
 *   # koumuin-claude-code (デフォルト, placeholder={{MAGAZINE_URL}})
 *   node inject-magazine-url.cjs https://note.com/stats47/m/mXXXXXXXX
 *
 *   # koumuin-estat-claude-code (placeholder={{ESTAT_MAGAZINE_URL}} を自動選択)
 *   node inject-magazine-url.cjs --vertical koumuin-estat-claude-code https://note.com/stats47/m/mYYYYYYYY
 *
 * 冪等性: 置換は当該プレースホルダーに対してのみ行う。既に実 URL 注入済みの記事は
 * プレースホルダーが無いのでスキップされる。
 */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");

// vertical ごとのデフォルトプレースホルダー。未登録 vertical は {{MAGAZINE_URL}} を既定とする。
const VERTICAL_PLACEHOLDERS = {
  "koumuin-claude-code": "{{MAGAZINE_URL}}",
  "koumuin-estat-claude-code": "{{ESTAT_MAGAZINE_URL}}",
};

function parseArgs(argv) {
  const opts = {
    vertical: "koumuin-claude-code",
    placeholder: null,
    url: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--vertical") {
      opts.vertical = argv[++i];
    } else if (a === "--placeholder") {
      opts.placeholder = argv[++i];
    } else if (!a.startsWith("--")) {
      opts.url = a;
    }
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.url) {
    console.error(
      "usage: node inject-magazine-url.cjs [--vertical <name>] [--placeholder <ph>] <マガジンURL>\n" +
        "  例) node inject-magazine-url.cjs --vertical koumuin-estat-claude-code https://note.com/stats47/m/mXXXXXXXX",
    );
    process.exit(2);
  }
  if (!/^https:\/\/note\.com\/[^/]+\/m\//.test(opts.url)) {
    console.error(
      `WARN: 渡された URL がマガジン URL の形式 (https://note.com/<handle>/m/...) と一致しません: ${opts.url}`,
    );
    console.error("意図した URL か確認してください。中断します。");
    process.exit(2);
  }

  const placeholder =
    opts.placeholder ||
    VERTICAL_PLACEHOLDERS[opts.vertical] ||
    "{{MAGAZINE_URL}}";

  const seriesDir = path.join(PROJECT_ROOT, "docs/31_note記事原稿", opts.vertical);
  if (!fs.existsSync(seriesDir)) {
    console.error(`ERROR: シリーズディレクトリが存在しません: ${seriesDir}`);
    process.exit(2);
  }

  console.log(`vertical    : ${opts.vertical}`);
  console.log(`placeholder : ${placeholder}`);
  console.log(`magazine URL: ${opts.url}\n`);

  const dirs = fs
    .readdirSync(seriesDir)
    .filter((d) => /^\d{2}-/.test(d))
    .sort();

  let injected = 0;
  let skipped = 0;

  for (const slug of dirs) {
    const draftPath = path.join(seriesDir, slug, "draft.md");
    if (!fs.existsSync(draftPath)) continue;
    const content = fs.readFileSync(draftPath, "utf8");
    if (!content.includes(placeholder)) {
      console.log(`SKIP ${slug} (プレースホルダーなし)`);
      skipped++;
      continue;
    }
    const updated = content.split(placeholder).join(opts.url);
    fs.writeFileSync(draftPath, updated);
    console.log(`OK   ${slug}`);
    injected++;
  }

  console.log(`\nInjected: ${injected}, Skipped: ${skipped}`);
  if (injected > 0) {
    console.log(`マガジン URL: ${opts.url}`);
  }
}

main();

#!/usr/bin/env node
/**
 * lint-article.cjs
 * ブログ記事の bold+全角括弧レンダリングバグを検出する。
 *
 * 使用方法:
 *   node .claude/scripts/blog/lint-article.cjs <slug>
 *   node .claude/scripts/blog/lint-article.cjs <slug1> <slug2> ...
 *   node .claude/scripts/blog/lint-article.cjs --all   (全記事をスキャン)
 *
 * exit 0: 問題なし / exit 1: 問題あり
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const BLOG_DIR = path.join(PROJECT_ROOT, ".local/r2/app/blog");

// CommonMark で bold を壊すパターン
// 注意: `**text**（外側）` は正常。問題は `**text（内側）**` のみ。
// `）**` は「右フランキング区切り子」にならないケースがある（後続が非句読点の場合）。
const PATTERNS = [
  {
    // `）**` や `」**` の後に句読点・空白・行末以外が続く場合に bold が閉じない
    // 行末(`$`)・コロン(`:`)・句読点の直前はCommonMarkで救済されるため許容
    regex: /[）」】〕〉》\]]\*\*(?![:\s。．・！？*_\-\n])/g,
    label: "右括弧+ボールド閉じ（非句読点続き）",
    fix: "括弧をボールドの外へ移動: `**text（）**` → `**text**（）`",
  },
  {
    // `）**` が行末・コロンで終わる場合も念のため報告（WARNING レベル）
    regex: /[）」】〕〉》\]]\*\*[:\s]/g,
    label: "右括弧+ボールド閉じ（行末/コロン前）※確認推奨",
    fix: "多くのパーサーで動作するが、念のため `**text**（）` 形式を推奨",
  },
  {
    regex: /%\*\*(?!\s)/g,
    label: "% + ボールド閉じ（スペースなし）",
    fix: "`**` の後にスペースを追加: `**98%**と` → `**98%** と`",
  },
  {
    regex: /\*\*[△▲▽▼※]/g,
    label: "ボールド開始+特殊記号",
    fix: "記号を変更またはスペースを追加: `**△47%**` → `**−47%**`",
  },
];

function lintFile(filePath, slug) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const issues = [];

  lines.forEach((line, i) => {
    // フロントマターとコードブロックはスキップ
    if (i === 0 && line === "---") return;
    if (line.startsWith("```") || line.startsWith("    ")) return;

    PATTERNS.forEach(({ regex, label, fix }) => {
      regex.lastIndex = 0;
      if (regex.test(line)) {
        issues.push({
          slug,
          line: i + 1,
          text: line.trim().slice(0, 80),
          label,
          fix,
        });
      }
    });
  });

  return issues;
}

function resolveArticlePath(slug) {
  const candidates = [
    path.join(BLOG_DIR, slug, "article.md"),
    path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿", slug, "article.md"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

function getAllSlugs() {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR).filter((d) => {
    const p = path.join(BLOG_DIR, d, "article.md");
    return fs.existsSync(p);
  });
}

function main() {
  const args = process.argv.slice(2);
  let slugs;

  if (args.includes("--all")) {
    slugs = getAllSlugs();
  } else if (args.length === 0) {
    console.error("Usage: lint-article.cjs <slug> [<slug2> ...] | --all");
    process.exit(2);
  } else {
    slugs = args;
  }

  let allIssues = [];
  for (const slug of slugs) {
    const filePath = resolveArticlePath(slug);
    if (!filePath) {
      console.warn(`⚠ 記事が見つかりません: ${slug}`);
      continue;
    }
    const issues = lintFile(filePath, slug);
    allIssues = allIssues.concat(issues);
  }

  if (allIssues.length === 0) {
    console.log(`✅ bold レンダリングバグなし（${slugs.length} 記事スキャン）`);
    process.exit(0);
  }

  console.log(`\n❌ bold レンダリングバグ検出: ${allIssues.length} 件\n`);
  for (const issue of allIssues) {
    console.log(`  [${issue.slug}] L${issue.line} — ${issue.label}`);
    console.log(`    ${issue.text}`);
    console.log(`    💡 修正: ${issue.fix}`);
    console.log();
  }
  process.exit(1);
}

main();

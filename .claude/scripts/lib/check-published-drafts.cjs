#!/usr/bin/env node
/**
 * 公開済み下書きの取り残しガード。
 *
 * publish-article SKILL 手順6「公開後に docs/21_ブログ記事原稿/<slug> を削除」が
 * スキップされると、公開済み記事の古い下書きが docs/21 に残り、R2(live) と drift して
 * 退行リスク源になる (2026-05-30: 6件の取り残しを検出・削除した事故由来)。
 *
 * docs/21_ブログ記事原稿 は「公開したら消す」ephemeral な下書き staging。
 * 記事の正典 (SSOT) は R2 app/blog/<slug>/article.md。
 *
 * 検出: docs/21_ブログ記事原稿/<slug> が存在し、かつ .local/r2/app/blog/<slug>/article.md
 *       (公開 SSOT) も存在する slug = 公開済みなのに下書きが残っている → exit 1。
 *
 * 呼び出し元:
 *   - /deploy Step 2 (再発防止ガード)
 *   - /publish-article 手順6 完了確認
 *
 * SSD 非接続等で .local/r2/app/blog が無い場合は検証不能として skip (exit 0)。
 */
const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const DRAFT_DIR = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿");
const PUBLISHED_DIR = path.join(PROJECT_ROOT, ".local/r2/app/blog");

function ok(msg) {
  console.log(`[check-published-drafts] ${msg}`);
  process.exit(0);
}

if (!fs.existsSync(DRAFT_DIR)) ok("下書きディレクトリ無し — チェック対象なし");
if (!fs.existsSync(PUBLISHED_DIR)) {
  ok("公開フォルダ (.local/r2/app/blog) がローカルに無い (SSD 非接続?) — 検証 skip");
}

const drafts = fs
  .readdirSync(DRAFT_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const leftovers = drafts.filter((slug) =>
  fs.existsSync(path.join(PUBLISHED_DIR, slug, "article.md")),
);

if (leftovers.length > 0) {
  console.error(
    `[check-published-drafts] ❌ 公開済みなのに下書きが残っています (${leftovers.length}件):`,
  );
  leftovers.forEach((s) =>
    console.error(`  - docs/21_ブログ記事原稿/${s}  (公開済: app/blog/${s})`),
  );
  console.error(
    "[check-published-drafts] publish-article SKILL 手順6 (公開後の下書き削除) の取り残しです。\n" +
      "  対応: 公開済みを確認のうえ各下書きを削除\n" +
      '        git rm -r "docs/21_ブログ記事原稿/<slug>"\n' +
      "  記事の正典は R2 app/blog。docs/21 は公開で消す ephemeral staging。",
  );
  process.exit(1);
}

ok(`OK — 公開済みの取り残しなし (下書き ${drafts.length}件、すべて未公開)`);

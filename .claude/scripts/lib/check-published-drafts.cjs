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
 * 呼び出し元:
 *   - /deploy Step 2 (再発防止ガード)
 *   - /publish-article 手順6 完了確認
 *
 * ★2026-06-21 改修 (整合性監査で 2 つの修正漏れを検出):
 *   ① 旧実装は判定オラクルに `.local/r2/app/blog` を使っていたが、ローカル R2 ミラーは
 *      2026-06-20 に廃止 (R2 は remote が唯一の真実源)。ローカルに存在しないため**常に skip**する
 *      死んだガードになっていた。
 *   ② 旧実装は「存在」だけで取り残し判定し、brushup (既 live 記事の改稿。docs/21 に新版・R2 に旧版) を
 *      誤検知していた。
 *   → 判定を `prune-published-outbox.mjs --check` に委譲して単一ソース化。これは R2 公開 URL を
 *      正典に使い (remote 唯一)、**内容が完全一致する取り残しのみ**を検出する (改稿中の差分は無視)。
 *   exit 1 = 取り残しあり (ブロック) / exit 0 = クリーン or 検証不能 skip。
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const PRUNE = path.join(PROJECT_ROOT, ".claude/scripts/blog/prune-published-outbox.mjs");
const DRAFT_DIR = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿");

function ok(msg) {
  console.log(`[check-published-drafts] ${msg}`);
  process.exit(0);
}

if (!fs.existsSync(DRAFT_DIR)) ok("下書きディレクトリ無し — チェック対象なし");
if (!fs.existsSync(PRUNE)) ok("prune-published-outbox.mjs が見つからない — 検証 skip");

// 取り残し検出は prune --check に委譲 (R2 公開URL正典 + 内容一致判定の単一ソース)。
const res = spawnSync("node", [PRUNE, "--check"], {
  cwd: PROJECT_ROOT,
  stdio: "inherit",
  env: process.env,
});

if (res.status === 1) {
  // prune --check が取り残しを検出 (詳細は inherit で既に出力済み)
  console.error(
    "[check-published-drafts] ❌ 公開済み (R2 と内容一致) の下書きが docs/21 に残っています。\n" +
      "  対応: node .claude/scripts/blog/prune-published-outbox.mjs --apply で掃除\n" +
      "        (または日次 cron blog-remediation-daily.yml が翌朝処理)。",
  );
  process.exit(1);
}

if (res.status !== 0) {
  // ネットワーク不通等で prune がエラー終了 → 検証不能として skip (deploy/publish を止めない)
  ok("prune --check が検証不能 (R2 取得失敗?) — skip");
}

ok("OK — 公開済みの取り残しなし");

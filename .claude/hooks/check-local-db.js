#!/usr/bin/env node
/**
 * SessionStart hook: ローカルビルド DB (SQLite) の存在チェック。
 *
 * 2026-05-29: データ層は「形で使い分けるハイブリッド」が正典 (docs/01_技術設計/18_データ層ハイブリッド設計.md)。
 * 本番アプリは R2 snapshot のみ読み、ローカル SQLite 不在でもクラウド作業 (git TS 編集 / R2 直接反映) は可能。
 * リモート D1 の CRUD/seed/集計はローカル(Mac)で行う方針のため、クラウドでの DB 不在は基本「正常」。
 *
 * ただし移行期 (Phase ③ 未完) は旧 batch (sync-snapshots の一部 exporter 等) が
 * まだローカル SQLite を要求しうる。その場合の最小案内のみ出す。
 *
 * stdout は Claude のコンテキストに注入される (公式仕様)。ブロックはしない。
 * 配置: .claude/hooks/check-local-db.js / 登録: .claude/settings.json の hooks.SessionStart
 */

const fs = require("fs");
const path = require("path");

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const dbPath = path.join(projectDir, "packages/database/.data/stats47.sqlite");

let exists = false;
try {
  exists = fs.statSync(dbPath).size > 0;
} catch {
  exists = false;
}

if (exists) {
  // DB がある場合も無言 (コンテキストを汚さない)
  process.exit(0);
}

const msg = [
  "ℹ️ ローカルビルド DB (SQLite) はありません — ハイブリッド設計では通常これが正常です。",
  "   正典: docs/01_技術設計/18_データ層ハイブリッド設計.md",
  "",
  "  - 本番アプリは R2 snapshot のみ読む (DB 不要)。",
  "  - 設定(低volume・人手: チャート定義等)は git TS が SSOT。",
  "    クラウドでの反映は冪等スクリプトで R2 直接 (例: apps/web/scripts/sync-theme-additions-to-r2.ts)。",
  "  - 関係・運用(page_components/theme_metrics 等)と集計はリモート D1 が SSOT だが、",
  "    D1 の CRUD/seed/export/集計は【ローカル(Mac)】で行う。クラウド agent は git TS と R2 直接で作業する。",
  "",
  "  ※ 移行期 (Phase ③ 未完): 旧 batch の一部 exporter (sync-snapshots 等) は",
  "    まだローカル SQLite を要求する場合があります。その時だけ R2 から取得:",
  "      npm run db:pull --workspace=packages/r2-storage   # R2 に DB がある場合",
  "    要 env: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY",
].join("\n");

process.stdout.write(msg + "\n");
process.exit(0);

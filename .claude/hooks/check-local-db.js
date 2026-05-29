#!/usr/bin/env node
/**
 * SessionStart hook: ローカルビルド DB (SQLite) の存在チェック。
 *
 * 別 PC / 新規 clone / クラウドセッションでは packages/database/.data/stats47.sqlite
 * (git 管理外) が存在しないため、batch / dev が空ファイルを掴んで失敗する。
 * その前に「pull / seed が必要」と気づけるよう、SessionStart 時に stdout へ警告を出す。
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
  // 正常時は無言 (コンテキストを汚さない)
  process.exit(0);
}

const msg = [
  "⚠️ ローカルビルド DB (SQLite) が見つかりません: packages/database/.data/stats47.sqlite",
  "",
  "このファイルは git 管理外で、別 PC / 新規 clone / クラウドでは存在しません。",
  "batch (sync-articles / page-data-batch / sync-snapshots 等) や dev の前に取得が必要です:",
  "",
  "  # R2 に持ち回りの DB がある場合 (通常はこれ)",
  "  npm run db:pull --workspace=packages/r2-storage",
  "",
  "  # 空 schema だけ欲しい場合",
  "  npm run db:migrate:local --workspace=packages/database",
  "",
  "初回 seed (R2 にまだ一度も push していない最初の1回) だけは、実データを持つ環境",
  "(旧 miniflare DB が残る Mac) から push する必要があります:",
  "  cp .local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c*.sqlite packages/database/.data/stats47.sqlite",
  "  npm run db:push --workspace=packages/r2-storage",
  "",
  "要 env: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY (.env.local)。",
  "詳細: packages/database/README.md の「🚀 新規 clone / 別 PC でのセットアップ」節。",
].join("\n");

process.stdout.write(msg + "\n");
process.exit(0);

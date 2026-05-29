#!/usr/bin/env node
/**
 * SessionStart hook: ローカルビルド DB (SQLite) の存在チェック。
 *
 * 2026-05-29: データ層は DB レス設計が正典 (docs/01_技術設計/18_DBレスデータ設計.md)。
 * 永続 DB を前提にしないため、DB 不在は基本「正常」。本番アプリは R2 snapshot のみ読み、
 * Authored データは R2 JSON が SSOT、Derived はエフェメラル計算で再生成できる。
 *
 * ただし移行期 (Phase ③④ 未完) は旧 batch (sync-snapshots の一部 exporter 等) が
 * まだ SQLite を要求しうる。その場合の最小案内のみ出す (db:pull 持ち回りは段階廃止中)。
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
  "ℹ️ ローカルビルド DB (SQLite) はありません — DB レス設計では通常これが正常です。",
  "   正典: docs/01_技術設計/18_DBレスデータ設計.md",
  "",
  "  - 本番アプリは R2 snapshot のみ読む (DB 不要)。",
  "  - Authored データ (page_components 等) は R2 JSON が SSOT。",
  "    定義は git の TS、反映は冪等スクリプト (例: apps/web/scripts/sync-theme-additions-to-r2.ts)。",
  "  - Reference (metrics/articles) は再生成、Derived (area_profiles/相関) はエフェメラル計算 → R2。",
  "",
  "  ※ 移行期 (Phase ③④ 未完): 旧 batch の一部 exporter (sync-snapshots 等) は",
  "    まだ SQLite を要求する場合があります。その時だけ R2 から取得:",
  "      npm run db:pull --workspace=packages/r2-storage   # R2 に DB がある場合",
  "    （db:pull の持ち回りは段階廃止中。新規実装では DB レス経路で書くこと）",
  "    要 env: R2_S3_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY",
].join("\n");

process.stdout.write(msg + "\n");
process.exit(0);

#!/usr/bin/env node
/**
 * SessionStart hook: ローカルビルド DB (SQLite) の存在チェック。
 *
 * 2026-05-29: データ層は「完全DBレス」が正典 (docs/01_技術設計/02_データアーキテクチャ.md)。
 * SSOT は git TS (設定・定義・運用エンティティ) と R2 (観測値・配信 snapshot) の二つだけ。
 * 永続/リモート D1 は廃止。本番アプリは R2 snapshot のみ読む。
 * Derived (area_profiles / correlations) はエフェメラル計算 (使い捨て :memory: SQLite / DuckDB が
 * R2 を読む) → R2 へ書き出す。ローカル SQLite はあくまで「再生成可能な使い捨てビルドキャッシュ」で、
 * 不在でもクラウド/ローカル両方の作業 (git TS 編集 / R2 直接反映 / エフェメラル集計) は可能。
 * よって DB 不在は基本「正常」。
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
  "ℹ️ ローカルビルド DB (SQLite) はありません — 完全DBレス設計では通常これが正常です。",
  "   正典: docs/01_技術設計/02_データアーキテクチャ.md",
  "",
  "  - 本番アプリは R2 snapshot のみ読む (DB を一切 query しない)。",
  "  - SSOT は git TS (設定・定義・運用エンティティ) と R2 (観測値・配信) の二つだけ。",
  "    永続/リモート D1 は廃止済み。クラウド/ローカルとも git TS 編集 + R2 直接反映で作業する。",
  "    設定の R2 反映は git TS → R2 generator (例: apps/web/scripts/export-page-components-snapshot.ts)。",
  "  - Derived (area_profiles / correlations) はエフェメラル計算 → R2。",
  "    使い捨て :memory: SQLite / DuckDB が R2 観測値を読んで集計し R2 へ書き出す (永続しない)。",
  "",
  "  ※ R2 読み取りは公開 URL 経由で SSD/認証なしに可能:",
  "    R2_PUBLIC_FETCH_URL=https://storage.stats47.jp (NODE_OPTIONS='--conditions react-server')。",
  "    旧 db:pull / リモート D1 / SSD dual-mode は使わない。",
].join("\n");

process.stdout.write(msg + "\n");
process.exit(0);

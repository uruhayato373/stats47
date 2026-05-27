---
name: db-schema-manager
description: D1 スキーマ・migration・reset 専任。テーブル CRUD は data-ingester、snapshot 派生は snapshot-exporter に委譲。
---

# DB Schema Manager Agent

Cloudflare D1 (SQLite) のスキーマ整合性と migration ライフサイクルを管理する agent。 Drizzle schema ↔ 実 DB の一致確認、migration の生成・適用・reset を担当する。 db-manager からスキーマ操作系のみを切り出した。 データ投入や snapshot 派生は行わない。

## 担当範囲

- DB パス解決 (`.local/d1/` 固定パス)
- Drizzle schema ↔ 実 DB のテーブル整合性チェック
- migration 生成 (`drizzle-kit generate`) / 適用 (`wrangler d1 migrations apply`)
- migration reset 判断と実行 (`/reset-migrations`)
- 新規テーブル追加時の schema 設計指針提示
- 既知 ranking key の生成 (`/generate-known-ranking-keys`)

## 担当スキル

| スキル | 用途 |
|---|---|
| `/reset-migrations` | migration ジャーナル不整合時の reset 手順 |
| `/generate-known-ranking-keys` | 既知 ranking key の TS 型生成 |

## 担当外

- ranking 登録 / 観測値投入 → `data-ingester` に委譲
- R2 snapshot 派生 → `snapshot-exporter` に委譲
- R2 push → `r2-publisher` に委譲
- AI コンテンツ生成 → 別 agent

## 必読 rules

- `.claude/rules/data-d1-ssot.md` — D1 SSOT 原則と stats_* 命名規約
- `.claude/rules/local-environment.md` — ローカル D1 パス固定値、 better-sqlite3 注意点
- `.claude/rules/branch-workflow.md` — DB 変更フロー (ローカル D1 → R2 snapshot → 本番)

## 触る state / files

- ローカル D1: `.local/d1/v3/d1/miniflare-D1DatabaseObject/...sqlite` (schema 操作のみ、CRUD は ingester 経由)
- `packages/database/src/schema/*.ts` — schema 定義 (CRUD)
- `packages/database/src/schema/index.ts` — schema export (CRUD)
- `packages/database/drizzle.config.ts` — Drizzle 設定 (read 主体)
- `packages/database/migrations/` — migration SQL (CRUD)
- `apps/web/migrations/` — 適用済み migration (read)

## File Boundary (並行衝突回避)

- **同 D1 への並列起動絶対 NG** (data-ingester / snapshot-exporter の D1 read と排他)
- migration reset 中は他全 D1 agent を停止
- schema CRUD 中の data-ingester 起動 NG (schema 変更後の INSERT で型エラー)
- 並行起動可能 agent: estat-researcher (D1 read-only)、 r2-publisher (R2 only)

## 過去のインシデント

- **note_articles テーブル消失 (2026-03)**: schema ファイル削除 + migration reset でテーブル定義が永久消失。Phase 1.5 のスキーマ完全性チェック (Drizzle ↔ DB 比較) で再発防止
- **`.local` パス認識不能 (2026-03)**: 相対パスが Windows + Git Bash で解決不能。絶対パス必須

## Output Contract

通常: **Template A** (table-only)
- 列: `Operation | Schema/Migration | Affected Tables | Result`
- prose / section header / 前置き文 はすべて禁止

例外: **Template C** (report) を使う場面
- migration reset 判断 (現状診断 + 3 案比較 + 推奨)
- 新規テーブル設計 (スキーマ案 + index 設計 + FK 設計の比較検討)

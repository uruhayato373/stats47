---
name: estat_metainfo unified with estat_stats_tables (2026-05-04)
description: estat_stats_tables を estat_metainfo に統合 (PR #205)。status='candidate'/'registered' で 8,399 catalog + 62 registered を 1 テーブル管理
type: project
originSessionId: a1901524-b4eb-4b4b-8590-5c5f7395cde7
---
# estat_metainfo + estat_stats_tables 統一 (2026-05-04)

## 完了状態

- **PR**: #205 (`feat(db): unify estat_metainfo + estat_stats_tables`) develop merge 済 (`c745a11e`)
- **main 反映**: `dbd2bc46` (Cloudflare Pages 自動デプロイ済、production 3 URL 200 確認)
- **ローカル D1 テーブル数**: 24 → **23**（1 削減）
- **リモート D1 への sync 不要**: production 環境は 2026-04-29 に D1 削除済（Phase 10）

## 新スキーマ

`estat_metainfo` が e-Stat 統計表の唯一の真実の源。8,461 行（registered 62 / candidate 8,399）。

追加カラム（旧 estat_stats_tables から吸収）:
- `gov_org` / `category_key` / `stats_field` / `class_inf` / `updated_date`
- `status` (CHECK: 'candidate' / 'registered'、DEFAULT 'registered')

旧 `estat_metainfo` カラム（運用情報）はそのまま維持:
- `is_active` / `last_fetched_at` / `description` / `category_filters` / `item_name_prefix` / `memo`

## 役割の使い分け

- **status='registered'** + `is_active=1` → e-Stat 同期対象の運用マスタ（旧 metainfo 行）
- **status='candidate'** + `is_active=0` → 未登録の発見カタログ（旧 stats_tables 行、将来 discover-trends で活用）

## 重要な API 設計

### 既存 reader/writer は完全 backward compat
`save / find-by-stats-id / update-status / update-attributes / delete` は内部に **`WHERE status='registered'` フィルタ追加**で candidate 行が外から見えない。public API シグネチャ不変。

### save() は UPSERT で candidate → registered に昇格
candidate な行が save 経由で登録されると、status='registered' / is_active=1 にセットされる。

### list-candidates() を新規追加
`packages/estat-api/src/meta-info/repositories/d1/list-candidates.ts`
- WHERE status='candidate' で SELECT
- フィルタ: `statsField` / `categoryKey` / `govOrg` / `titleQuery` / `limit`
- 用途: discover-trends スキルが catalog から登録候補を選ぶ

## 関連ファイル

- Plan: `/Users/minamidaisuke/.claude/plans/enchanted-tinkering-otter.md`（estat 統一に書き換え済）
- Migration: `packages/database/drizzle/0023_unify_estat_metainfo.sql` / `0024_drop_estat_stats_tables.sql`
- 移行スクリプト: `packages/database/scripts/migrate-estat-stats-tables-to-metainfo.ts`
- schema: `packages/database/src/schema/estat_metainfo.ts`（estat_stats_tables.ts は削除済）

## 注意点

- リモート D1 は既に存在しないため、migration 0023/0024 はローカル D1 のみで完結
- production app は R2 snapshot 経由でしか D1 を読まないため、estat_metainfo の構造変更は production 影響なし
- e-Stat 同期バッチ（data-pipeline）は既存 5 関数経由でのみ書き込むため、status='registered' を維持

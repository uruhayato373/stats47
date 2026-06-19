---
name: 3-Layer Schema Migration COMPLETE (PR-1〜PR-7)
description: stats47 D1 を ranking_items+ranking_data の 2 テーブル → sources/indicators/observations 3 層に再編する 7-PR チェーン。2026-05-04 全 PR merge 完了 (32 → 20 テーブル、12 削減)。
type: project
originSessionId: a1901524-b4eb-4b4b-8590-5c5f7395cde7
---
# 3 層化 D1 リファクタ完了 (2026-05-04)

## 状態

- **Plan file**: `/Users/minamidaisuke/.claude/plans/enchanted-tinkering-otter.md`
- **PR-1〜PR-7**: 全て develop merge 済 (#196 / #197 / #198 / #199 / #202 / #203 / #204)
- **main デプロイ済**: PR-5 (`8e845990`) / PR-6 (`3b2cd2f8`) / PR-7 (`e43dc4d5`)
- **ローカル D1 テーブル数**: 32 → **20**（12 削減）

## 完了状態

新スキーマ（最終形）:
- `sources` (110 行) — データ出所統合
- `metrics` (3,064 行) — 旧 ranking_items / indicators の置換 (PR #210, 2026-05-04 で indicators から rename + latest_year/available_years_json 削除)
- `observations` (3,407,479 行) — 旧 ranking_data + port_statistics 統合
- `area_profiles` (17,678 行) — 旧 area_profile_rankings の置換、indicator_id FK 化
- `correlations` (1,674,544 行) — 旧 correlation_analysis の置換、indicator_id FK 化
- `ai_content` (1,941 行) — 旧 ranking_ai_content の置換、metric_id 単独 PK
- `taggings` (4,112 行) — polymorphic M:N: article (474) + metric (3,638) → tag_key (PR #209, 2026-05-04 で article_tags + indicator_tags を統合)
- `page_components` (+20 ranking 系含む) — ranking_page_cards 統合
- `page_component_assignments` (page_type='ranking' 追加)
- `ports` — port_statistics 削除後、観測値は observations(entity_type='port')

## DROP 済テーブル

| PR | テーブル | 行数 |
|---|---|---|
| PR-1 | component_data, port_trade_detail | 0 / 478K (未使用) |
| PR-2 | data_sources, source_metadata | 5 / 402 |
| PR-5 | ranking_items, ranking_data, ranking_tags, ranking_ai_content, area_profile_rankings, correlation_analysis | 3,050 / 3,324K / 3,638 / 1,943 / 17,678 / 1,674,544 |
| PR-6 | port_statistics | 41,733 |
| PR-7 | ranking_page_cards | 20 |
| PR #205 (2026-05-04) | estat_stats_tables → estat_metainfo に統合 | 8,460 |
| PR #206 (2026-05-04) | ranking_page_views → GA4 pages.csv に置換 | - |
| PR #207 (2026-05-04) | subcategories + 3 dead schema 一括撤去 | 86 + 0 |
| PR #209 (2026-05-04) | article_tags + indicator_tags → taggings に polymorphic 統合 | 474 + 3,638 |
| PR #210 (2026-05-04) | indicators → metrics リネーム + latest_year/available_years_json 削除 (observations から動的計算) | 0 (rename) |

合計 12 テーブル削減 (32 → **20**)、約 5M 行を 3 層構造に統合。
metrics の列数は 26 → 24 (-2)。yearName format ("年度") 統一で旧 stale cache のバグも解消。

## 重要な設計判断（全 PR 共通）

- **public API 不変**: 旧 reader/writer 関数のシグネチャは保持。内部実装のみ新 schema に切替
- **R2 snapshot 完全互換**: 出力 JSON は完全互換（PR-4 で byte-level diff 検証済み）。フロントエンド reader 影響ゼロ
- **派生テーブルの indicator_id FK 化**: area_profiles / correlations / ai_content は (rankingKey, areaType) → indicator_id に再正規化。snapshot 出力時に indicators JOIN で旧形式を維持
- **prefecture 仮定**: area_type 列がない派生テーブルからの migration は prefecture を仮定（実データもすべて prefecture）
- **ranking_name → title**: 重複排除（旧スキーマ 448 行を seo_title に migrate 済み、indicatorAsRankingItemSelection で title fallback）
- **deprecated D1 sync 削除**: pull-remote-d1 / d1-diff-report / backup-d1-to-r2 (リモート D1 撤廃済のため不要)
- **port_statistics → observations**: PR-3 backfill で既に COPY 済み、PR-6 では writer/exporter 切替と DROP のみ
- **ranking_page_cards → page_components**: component_key=旧 id (rpc-*)、snapshot 形式は完全互換

## 検証結果（最終）

- `tsc --noEmit` 全 package OK
- dev server: `/ranking/total-population` / `/areas/13000` / `/themes/aging-society` / `/compare?areas=13000,27000` / `/ports` / `/ranking/total-fertility-rate` 全て 200
- 本番 (stats47.jp): デプロイ後 ranking / areas / themes 全て 200
- ローカル D1: 41,733 行の port_statistics と observations(entity_type='port') が 14 metric_keys × 100% 一致

## 残タスク

- 本番 R2 snapshot の再生成 (`/sync-snapshots` で全 export 再実行)
  → byte-for-byte 互換のため必須ではないが、新 exporter コードパスでの再生成として実施推奨

## 重要な教訓

1. **段階的移行**: 並行 schema → 並行 reader/writer → 切替 → DROP の 4 段階を PR ごとに分割
2. **byte-level diff 検証**: PR-4 で旧/新 exporter 出力を diff し、generatedAt 以外で 100% 一致を確認後に PR-5 で切替
3. **migration 行数検証**: 各 backfill 後に旧テーブルと新テーブルの行数 / metric 別 GROUP BY が一致することをアサート
4. **schema rename pattern**: 旧 schema を残しつつ新 schema を追加 → reader 切替後に旧 schema を削除（drizzle migration 番号で履歴を残す）
5. **dead code の早期削除**: PR-7 で ranking-page-card-repository.ts は R2 snapshot 経由のため未使用と判明、即削除

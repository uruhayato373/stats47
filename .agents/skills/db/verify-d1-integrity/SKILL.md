---
name: verify-d1-integrity
description: ローカル D1 メタ (`metrics`/`sources`/`prefectures`/`cities`/`estat_metainfo`) の整合性と、R2 (`app/stats/<metric>/*.json`) 観測値との照合を検証。/sync-snapshots と /export-d1-to-remotion-static の precondition。Use when user says "D1 整合性確認", "verify d1", "データ整合性".
argument-hint: "[--metric <key>] [--strict]"
disable-model-invocation: true
primary_agent: data-ingester
---

ローカル D1 (メタのみ: `metrics`, `prefectures`, `cities`, `estat_metainfo`, `sources`) と R2 (`app/stats/<metric>/*.json` の観測値) の整合性を検証する。

Phase 6 (2026-05-27) で観測値ストア (`stats_prefecture` / `stats_city` / `stats_port` / `stats_migration_flow` / `correlations` テーブル) は全 DROP 済み、観測値の SSOT は R2 (`app/stats/<metric>/{values,cities,ports,migration-flow-<year>}.json`)。本 skill も R2 を読みに行く方針。

## 検証項目

1. **メタ整合性**
   - `metrics.source_id` が `sources.id` に存在
   - `metrics.key` が TS-config registry (`packages/data-configs/src/metrics/<key>.ts`) と一致
     (差分があれば `/sync-metrics-cache --apply` で同期)

2. **R2 observation 存在 (entities フィールドとの一致)**
   - TS-config が `entities: ["prefecture"]` を宣言する metric → `app/stats/<key>/values.json` 存在
   - 同 `["city"]` → `app/stats/<key>/cities.json` 存在
   - 同 `["port"]` → `app/stats/<key>/ports.json` 存在
   - 同 `["migration-flow"]` → `app/stats/<key>/migration-flow-<year>.json` (年単位) 存在

3. **エリアカバレッジ (R2 payload を読んで検証)**
   - 都道府県 metric: 47 県カバレッジ (R2 values.json の rows から `new Set(rows.map(r => r.areaCode)).size === 47`)
   - 各 metric の最新年で全 47 県の `value` が NULL でない

4. **年代カバレッジ (R2 payload を読んで検証)**
   - 各 metric の `MIN(year_code)` / `MAX(year_code)` / 欠損年 (連続性)
   - TS-config の `years: { from, to }` と R2 実値の比較

5. **estat_metainfo の status 整合**
   - `status='registered'` の statsDataId が `sources` に存在
   - `metrics.source_id` が指す source が estat_metainfo に存在

## 手順

1. 全 metric 検証:
   ```bash
   node .Codex/scripts/db/verify-d1-integrity.mjs
   ```

2. 特定 metric:
   ```bash
   node .Codex/scripts/db/verify-d1-integrity.mjs --metric japanese-population
   ```

3. strict モード (警告も failure):
   ```bash
   node .Codex/scripts/db/verify-d1-integrity.mjs --strict
   ```

## 出力 (Phase 7 以降)

```
=== D1 + R2 Integrity Report ===
Metrics in D1 cache: 2,209
Metrics in TS-config registry: 2,209
  ✓ D1 cache ↔ TS-config registry 一致

R2 observation coverage:
  ✓ japanese-population: prefecture (47 areas × 45 years 1980-2024)
  ✓ japanese-population: city (1,724 areas × 5 years)
  ⚠ inflow-population-ratio: prefecture (47 areas × 5 years 2020-2024, expected 2015-2024)
  ✗ station-passengers-annual-total: R2 missing (TS-config 宣言 entities=["prefecture"] だが values.json 不在)

Estat metainfo:
  ✓ 62 registered tables match sources

=== Result: 1 error, 1 warning ===
```

exit code: 0 (clean), 1 (warning only), 2 (error)。`--strict` では warning も exit 1。

## 失敗時の対応

| 症状 | 対応 |
|---|---|
| 「D1 cache ↔ TS-config registry 差分」 | `/sync-metrics-cache --apply` で同期 |
| 「R2 missing」(TS-config に entities 宣言あるが R2 値なし) | TS-config の source 情報を確認 → `/page-data-batch --metric <key>` で投入 |
| エリア欠損 | `/page-data-batch --metric <key>` で補完 |
| 年欠損 | TS-config の `years` フィールド更新 → `/page-data-batch --metric <key>` |
| estat_metainfo の registered ↔ sources 不一致 | `/sync-metrics-cache --apply` を再実行、または手動 DELETE |

## 使い時

- `/sync-snapshots` 実行前 (R2 に壊れたデータを push しないため)
- `/export-d1-to-remotion-static` 実行前 (動画用 JSON に欠損データを書かないため)
- `/page-data-batch` などで大量投入後の確認
- 週次レビュー時 (`.Codex/skills/management/weekly-review/reference/reviews/`)

## 参照

- 実装: `.Codex/scripts/db/verify-d1-integrity.mjs` (Phase 2 で新規、Phase 7 で R2 fetch 対応に refactor 予定)
- 親方針: `.Codex/rules/data-sqlite-ssot.md`, `.Codex/rules/r2-storage-design.md`
- 現行データ設計: `docs/01_技術設計/02_データアーキテクチャ.md`
- 関連: `/sync-snapshots`, `/export-d1-to-remotion-static`, `/page-data-batch`, `/sync-metrics-cache`

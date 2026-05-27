---
name: verify-d1-integrity
description: ローカル D1 の整合性 (metric ↔ stats_* / 47 県カバレッジ / 欠損年 / FK 整合性) を検証。/sync-snapshots と /export-d1-to-remotion-static の precondition。Use when user says "D1 整合性確認", "verify d1", "データ整合性".
argument-hint: [--metric <key>] [--strict]
disable-model-invocation: true
primary_agent: data-ingester
co_agents: [data-pipeline, db-manager]
---

ローカル D1 (`metrics`, `stats_*`, `prefectures`, `cities`, `estat_metainfo`) の整合性を検証する。

## 検証項目

1. **FK 整合性**
   - `stats_prefecture.metric_key` がすべて `metrics.key` に存在
   - `stats_city.metric_key` 同上
   - `stats_port.metric_key` 同上
   - `stats_migration_flow.metric_key` / `from_pref_code` / `to_pref_code` の FK
   - `metrics.source_id` が `sources.id` に存在

2. **エリアカバレッジ**
   - 都道府県 metric: 47 県カバレッジ (`COUNT(DISTINCT area_code) = 47`)
   - 各 metric の最新年で全 47 県の `value` が NULL でない

3. **年代カバレッジ**
   - 各 metric の `MIN(year_code)` / `MAX(year_code)` / 欠損年 (連続性)
   - 想定範囲 (例: 人口 1976-2024) と実態の比較

4. **重複・矛盾**
   - 同じ (metric, area, year) で複数行が無いこと (PK 違反は SQLite が防ぐが念のため)
   - `stats_migration_flow` の `inflow` / `outflow` / `net` の関係 (`net = inflow - outflow`)

5. **estat_metainfo の status 整合**
   - `status='registered'` の statsDataId が `sources` に存在
   - `metrics.source_id` が指す source が estat_metainfo に存在

## 手順

1. 全 metric 検証:
   ```bash
   node .claude/scripts/db/verify-d1-integrity.mjs
   ```

2. 特定 metric:
   ```bash
   node .claude/scripts/db/verify-d1-integrity.mjs --metric japanese-population
   ```

3. strict モード (警告も failure):
   ```bash
   node .claude/scripts/db/verify-d1-integrity.mjs --strict
   ```

## 出力

```
=== D1 Integrity Report ===
Metrics: 2,206 total
  ✓ FK integrity: stats_prefecture → metrics (1,493,281 rows OK)
  ✓ FK integrity: stats_city → metrics (1,995,376 rows OK)
  ✗ stats_migration_flow → metrics: 12 orphan rows (metric_key not in metrics)

Coverage:
  ✓ japanese-population: 47 prefs × 49 years (1976-2024)
  ⚠ inflow-population-ratio: 47 prefs × 5 years (2020-2024, expected 2015-2024)

Estat metainfo:
  ✓ 62 registered tables match sources

=== Result: 1 error, 1 warning ===
```

exit code: 0 (clean), 1 (warning only), 2 (error)。`--strict` では warning も exit 1。

## 失敗時の対応

| 症状 | 対応 |
|---|---|
| FK orphan rows | 欠損 metric を `/register-ranking` で追加、または orphan rows を DELETE |
| エリア欠損 | `/populate-all-rankings --metric <key>` で補完 |
| 年欠損 | `/populate-all-rankings --metric <key> --years <from>-<to>` で範囲指定再投入 |
| `net != inflow - outflow` | ingest スクリプトのバグ → `/tmp/` でデバッグ |

## 使い時

- `/sync-snapshots` 実行前 (R2 に壊れたデータを push しないため)
- `/export-d1-to-remotion-static` 実行前 (動画用 JSON に欠損データを書かないため)
- `/populate-all-rankings` などで大量投入後の確認
- 週次レビュー時 (`docs/03_週次運用/週次レビュー/`)

## 参照

- 実装: `.claude/scripts/db/verify-d1-integrity.mjs` (Phase 2 で新規)
- 親方針: `.claude/rules/data-d1-ssot.md`
- 関連: `/sync-snapshots`, `/export-d1-to-remotion-static`, `/populate-all-rankings`

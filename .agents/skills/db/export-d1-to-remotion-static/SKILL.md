---
name: export-d1-to-remotion-static
description: ローカル D1 → apps/remotion/public/<feature>/*.json を生成。Remotion build 時に staticFile() で読まれる派生 JSON を D1 から再生成。Use when user says "remotion 動画データを D1 から生成", "export-d1-to-remotion-static", "動画用 JSON 再生成".
argument-hint: "[--feature <name>|all] [--year YYYY] [--dry-run]"
disable-model-invocation: true
primary_agent: snapshot-exporter
---

ローカル D1 から Remotion 動画用の `apps/remotion/public/<feature>/*.json` を生成する。

## 背景

Remotion は Webpack bundle に組み込まれ、render 時に network / DB access ができないため `staticFile()` で `public/` 配下を読む設計。本 skill は **D1 (SSOT) → public/ 派生 JSON** の自動生成を担う。詳細: `.Codex/rules/data-sqlite-ssot.md`

## 前提

- 必要 metric が TS-config (`packages/data-configs/src/metrics/<key>.ts`) に定義済
- 必要 metric が D1 `metrics` cache に同期済 (`/sync-metrics-cache --apply` で同期)
- 必要 metric の観測値が R2 (`app/stats/<key>/*.json`) に投入済 (`/page-data-batch --metric <key>` 等)
- ローカル D1 の prefectures master が揃っていること (`loadPrefectures()` で参照)

未投入の feature を export しようとすると、空の JSON または不完全 JSON が出るので、まず `/verify-d1-integrity` で確認。

## 手順

1. dry-run で出力対象を確認:
   ```bash
   node apps/remotion/scripts/export-d1-to-remotion-static.ts --dry-run
   ```

2. 特定 feature のみ:
   ```bash
   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature migration-flow
   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature migration-flow --year 2025
   ```

3. 全 feature:
   ```bash
   tsx apps/remotion/scripts/export-d1-to-remotion-static.ts --feature all
   ```

4. 出力検証: `apps/remotion/public/<feature>/` の更新を確認

## サポート feature

Phase 6 (2026-05-27) で観測値の SSOT を R2 に移行済。各 exporter は `_shared/local-r2-reader.ts` 経由で `.local/r2/app/stats/<metric>/*.json` から読み出し、prefectures master のみ D1 から読む。

| feature | 出力 | 入力 (R2) |
|---|---|---|
| `migration-flow` | `pref-net-{year}.json` + `{NN}.json` × 47 + `municipalities/{NN}.json` × 47 | `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json`, `app/stats/population-migration-net-municipality/cities.json` |
| `population-yoy-47` | `timeseries.json` | `app/stats/japanese-population/values.json` |
| `station-passengers` | `index.json` | `app/stats/station-passengers-annual-total/values.json` |
| `master` | `packages/area/src/data/{prefectures,cities}.json` | D1 `prefectures` / `cities` (master 系のみ D1 残存) |

## ビルドフローへの統合

`apps/remotion/package.json` に script:

```json
"prepare-data": "tsx scripts/export-d1-to-remotion-static.ts --feature all"
```

Remotion build / render の前に必ず実行する:

```bash
cd apps/remotion && pnpm prepare-data && pnpm render --composition=<name>
```

`/sync-snapshots` の TASKS にも先頭で組み込まれているため、Web snapshot と動画用 JSON が常に同じ D1 から派生する。

## 参照

- 入力 D1: `.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite`
- exporter 実装: `apps/remotion/scripts/exporters/`
- 親方針: `.Codex/rules/data-sqlite-ssot.md`
- feature 別データ仕様: `apps/remotion/README.md` / `apps/remotion/scripts/pipeline/README.md`
- 関連: `/verify-d1-integrity`, `/sync-snapshots`, `/sync-metrics-cache`, `/page-data-batch`

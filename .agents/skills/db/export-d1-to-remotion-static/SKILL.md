---
name: export-d1-to-remotion-static
domain: data
description: R2 観測値 (.local/r2) と台帳 areas.prefectures → apps/remotion/public/<feature>/*.json を生成。Remotion build 時に staticFile() で読まれる派生 JSON を再生成 (名前に D1 が残るが D1 は読まない)。Use when user says "remotion 動画データを生成", "export-d1-to-remotion-static", "動画用 JSON 再生成".
argument-hint: "[--feature <name>|all] [--year YYYY] [--dry-run]"
disable-model-invocation: true
primary_agent: snapshot-exporter
---

R2 の観測値 (ローカルミラー `.local/r2/`) と `@stats47/area` の県マスタから、Remotion 動画用の `apps/remotion/public/<feature>/*.json` を生成する。skill 名とスクリプト名に D1 が残っているのは旧名の名残で、D1 も SQLite も読まない。

## 背景

Remotion は Webpack bundle に組み込まれ、render 時に network / DB access ができないため `staticFile()` で `public/` 配下を読む設計。本 skill は **R2 観測値 + git の台帳 → public/ 派生 JSON** の自動生成を担う。置き場の規則: `.claude/rules/data-storage.md`

## 前提

- 必要 metric が TS-config (`data/metrics/<key>.ts`) に定義済
- 必要 metric の観測値が R2 (`app/stats/<key>/*.json`) に投入済 (`/page-data-batch --metric <key>` 等)
- 必要な観測値がローカルミラー `.local/r2/app/stats/<key>/` にあること (無ければ `/pull-r2` で取得)

未投入の feature を export しようとすると、空の JSON または不完全 JSON が出るので、まず `.local/r2/app/stats/<key>/values.json` (または R2 の同じキー) に 47 県分あるかを確認する。

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

Phase 6 (2026-05-27) で観測値の SSOT を R2 に移行済。各 exporter は `_shared/local-r2-reader.ts` 経由で `.local/r2/app/stats/<metric>/*.json` から読み出し、prefectures master は `@stats47/area` (台帳 `areas.prefectures`) から読む (`_shared/load-prefectures.ts`)。

| feature | 出力 | 入力 (R2) |
|---|---|---|
| `migration-flow` | `pref-net-{year}.json` + `{NN}.json` × 47 + `municipalities/{NN}.json` × 47 | `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json`, `app/stats/population-migration-net-municipality/cities.json` |
| `station-passengers` | `index.json` | `app/stats/station-passengers-annual-total/values.json` |

## ビルドフローへの統合

`apps/remotion/package.json` に script:

```json
"prepare-data": "tsx scripts/export-d1-to-remotion-static.ts --feature all"
```

Remotion build / render の前に必ず実行する:

```bash
cd apps/remotion && pnpm prepare-data && pnpm render --composition=<name>
```

`/sync-snapshots` の TASKS にも先頭で組み込まれているため、Web snapshot と動画用 JSON が常に同じ R2 観測値から派生する。

## 参照

- 入力: `.local/r2/app/stats/<metric>/*.json` (R2 のローカルミラー) と `@stats47/area` の県マスタ
- exporter 実装: `apps/remotion/scripts/exporters/`
- 親方針: `.claude/rules/data-storage.md`
- feature 別データ仕様: `apps/remotion/README.md` / `apps/remotion/scripts/pipeline/README.md`
- 関連: `/sync-snapshots`, `/page-data-batch`, `/pull-r2`

---
type: tech-design
status: active
tags: [remotion, r2, ssot, data-flow]
---

# 動画データ SSOT 設計

Remotion 動画で使う統計データは **R2 (`app/stats/<metric>/*.json`) を SSOT** として、`pnpm prepare-data` (`apps/remotion/scripts/export-d1-to-remotion-static.ts`) 経由で `apps/remotion/public/<feature>/` に派生 JSON を生成する設計。本書は各 feature ごとのデータ経路と必要 metric を一覧化する。

Phase 6 (2026-05-27) で D1 `stats_*` テーブルは全 DROP 済。観測値は R2 にあり、TS-config (`packages/data-configs/src/metrics/<key>.ts`) が metric メタの SSOT。

## データフロー全体図

```
e-Stat / 国交省 等
        ↓ /search-estat / /inspect-estat-meta
TS-config (packages/data-configs/src/metrics/<key>.ts)
        ↓ /page-data-batch --metric <key>
R2 (app/stats/<metric>/{values,cities,ports,migration-flow-<year>}.json)
        ↓ pnpm prepare-data (apps/remotion/scripts/exporters/*.ts)
apps/remotion/public/<feature>/*.json
        ↓ Remotion build (staticFile)
     動画レンダリング
```

Remotion は **R2 を直接読まない**。Webpack bundle で network/DB access が制約されるため、build 前に exporter が `_shared/local-r2-reader.ts` 経由で `.local/r2/` から JSON を読んで `public/` に書き出す。

## feature 別データ一覧

### migration-flow (47 都道府県 人口移動)

| 出力ファイル | データソース | R2 key | metric_key |
|---|---|---|---|
| `public/migration-flow/pref-net-{year}.json` | 47 県 純移動の昇順配列 | `app/stats/<metric>/migration-flow-<year>.json` | `population-migration-inter-prefecture` |
| `public/migration-flow/{NN}.json` (47 本) | 焦点県 × 46 県 inflow/outflow | 同上 | 同上 |
| `public/migration-flow/municipalities/{NN}.json` | 市区町村別 純移動率 | `app/stats/<metric>/cities.json` | `population-migration-net-municipality` ⚠️ |
| `public/migration-flow/cities/{NN}.topojson` | 市区町村境界 | (git tracked, GIS) | — |

⚠️ `population-migration-net-municipality` は TS-config 作成済だが source.statsDataId が `TODO-MUNICIPALITY-MIGRATION` のまま (Phase 7 で確定 + ingest)。現状は 2026-05-25 snapshot を継続使用。

source: e-Stat 統計表 `0003423613` 住民基本台帳人口移動報告 (年: 2020-2025)

### population-yoy-47 (47 県 人口前年度比 1976-2024)

| 出力ファイル | データソース | R2 key | metric_key |
|---|---|---|---|
| `public/population-yoy-47/timeseries.json` | 47 県 × N 年 人口 + YoY ratio (exporter で算出) | `app/stats/japanese-population/values.json` | `japanese-population` |

source: e-Stat 人口推計 `0000010101` (cdCat01=A1102)

### station-passengers (47 県 駅別乗降客数 まとめ)

| 出力ファイル | データソース | R2 key | metric_key |
|---|---|---|---|
| `public/station-passengers/index.json` | 47 県 集計値 (年間総乗降客数) | `app/stats/station-passengers-annual-total/values.json` | `station-passengers-annual-total` ⚠️ |
| `public/station-passengers/{NN}.json` (47 本) | 駅単位データ | (Remotion native, static GeoJSON 寄り) | — |

⚠️ `station-passengers-annual-total` は TS-config 作成済だが source.resourceId が `TODO-STATION-PASSENGERS` のまま (Phase 7 で確定 + ingest)。現状は 2026-05-25 snapshot を継続使用。

source: 国交省 駅別乗降客数調査 (MLIT)

**判定**: 駅単位 (~1 万 駅) は交通インフラ寄りで観測値ストア対象外。pref-aggregate のみ R2 化。

### port-bubble (港湾統計)

R2: `app/stats/<metric>/ports.json` (Phase 6 移行済 7 指標)。exporter は省略 (Remotion 側で直接 `.local/r2/` から読む既存設計を維持)。

source: 国交省 港湾統計

### highway-history / mf-portrait / 他

統計データを含まない演出系 feature。exporter 不要。

## マスタデータ

| 出力ファイル | データソース | D1 テーブル |
|---|---|---|
| `packages/area/src/data/prefectures.json` | 47 県 (+ 全国) | `prefectures` |
| `packages/area/src/data/cities.json` | 市区町村マスタ | `cities` |

`/export-d1-to-remotion-static --feature master` で再生成。`@stats47/area` の `fetchPrefectures()` 等の interface は不変。

## 新規 feature 追加の手順

新しい動画 feature を作るとき:

1. **データソース特定**: e-Stat / 国交省 / 自前計算 のどれか
2. **TS-config 追加**: `packages/data-configs/src/metrics/<new-key>.ts` 新規作成 → `npm run build:registry --workspace=packages/data-configs` で registry 再生成
3. **D1 metrics cache 同期**: `/sync-metrics-cache --apply`
4. **R2 投入**: `/page-data-batch --metric <new-key>` で e-Stat → R2 直行
5. **exporter 追加**: `apps/remotion/scripts/exporters/<feature>.ts` (`readLocalStatsValues` / `readLocalMigrationFlow` で R2 読み込み)
6. **エントリポイント登録**: `apps/remotion/scripts/export-d1-to-remotion-static.ts` の dispatch に追加
7. **Remotion side**: feature の `use*Data.ts` で `staticFile()` 経由読み込み
8. **本書を更新**: feature 別データ一覧に追記

## 派生先と SSOT の関係

```
TS-config (packages/data-configs/src/metrics/*.ts) [メタ SSOT]
   ↓ /sync-metrics-cache → D1 metrics (cache)
   ↓ /page-data-batch (e-Stat / MLIT API)
R2 (app/stats/<metric>/*.json) [値 SSOT]
   ├→ apps/remotion/public/    (動画 build 用、pnpm prepare-data で派生)
   ├→ apps/web (SSR、@stats47/stats-r2 reader 経由)
   ├→ .local/r2/video/         (master 動画保存, /archive-remotion-output)
   └→ packages/area/src/data/  (npm package static export、D1 master 由来)
```

すべて再生成可能 snapshot。手で編集すると SSOT と乖離するため禁止。

## 関連

- 親方針: `.claude/rules/data-d1-ssot.md`
- 派生先と運用ルール: `.claude/rules/data-storage.md`
- R2 キーパス設計: `.claude/rules/r2-storage-design.md`
- DDD ドメイン分類: `docs/01_技術設計/04_DDDドメイン分類.md`
- TS-config 型定義: `packages/data-configs/src/types.ts`
- R2 reader: `packages/stats-r2/src/readers/index.ts`
- Remotion exporter 実装: `apps/remotion/scripts/exporters/`

---
type: tech-design
status: active
tags: [remotion, d1, ssot, data-flow]
---

# 動画データ SSOT 設計

Remotion 動画で使う統計データは D1 を SSOT として、build 前に `apps/remotion/public/<feature>/` へ export する設計。本書は各 feature ごとのデータ経路と必要 metric を一覧化する。

## データフロー全体図

```
e-Stat / 国交省 等
        ↓ /search-estat → /register-ranking
   D1 (metrics + stats_*)
        ↓ /export-d1-to-remotion-static
apps/remotion/public/<feature>/*.json
        ↓ Remotion build (staticFile)
     動画レンダリング
```

Remotion は **D1 を直接読まない**。Webpack bundle で network/DB access が制約されるため、build 前に exporter が静的 JSON を生成する。

## feature 別データ一覧

### migration-flow (47 都道府県 人口移動)

| 出力ファイル | データソース | D1 テーブル | metric_key |
|---|---|---|---|
| `public/migration-flow/pref-net-{year}.json` | 47 県 純移動の昇順配列 | `stats_migration_flow` (集計) | `population-migration-inter-prefecture` |
| `public/migration-flow/{NN}.json` (47 本) | 焦点県 × 46 県 inflow/outflow | `stats_migration_flow` | 同上 |
| `public/migration-flow/municipalities/{NN}.json` | 市区町村別 純移動率 | `stats_city` | `population-migration-net-municipality` |
| `public/migration-flow/cities/{NN}.topojson` | 市区町村境界 | (git tracked, GIS) | — |

source: e-Stat 統計表 `0003423613` 住民基本台帳人口移動報告 (年: 2020-2025)

### population-yoy-47 (47 県 人口前年度比 1976-2024)

| 出力ファイル | データソース | D1 テーブル | metric_key |
|---|---|---|---|
| `public/population-yoy-47/timeseries.json` | 47 県 × 49 年 人口 + YoY ratio (exporter で算出) | `stats_prefecture` | `japanese-population` 等 |

source: e-Stat 人口推計 (要確認: `0003448237` 等)

### station-passengers (47 県 駅別乗降客数 まとめ)

| 出力ファイル | データソース | D1 テーブル | metric_key |
|---|---|---|---|
| `public/station-passengers/index.json` | 47 県 集計値 (年間総乗降客数) | `stats_prefecture` | `station-passengers-annual-total` |
| `public/station-passengers/{NN}.json` (47 本) | 駅単位データ | (D1 非対象、static GeoJSON 寄り) | — |

source: 国交省 駅別乗降客数調査

**判定**: 駅単位 (~1 万 駅) は交通インフラ寄りで D1 化対象外。pref-aggregate のみ D1 化。

### port-bubble (港湾統計)

| 出力ファイル | データソース | D1 テーブル | metric_key |
|---|---|---|---|
| (動画レンダリング時のみ生成) | 港湾別 取扱貨物量・コンテナ数 | `stats_port` | 既存 7 指標 |

source: 国交省 港湾統計

すでに D1 化済 (`stats_port` 41,733 rows)。exporter は省略可能 (Remotion 側で直接 staticFile/(R2) から読む既存設計を維持)。

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
2. **D1 取り込み**: 
   - 単一指標 → `/register-ranking` + `/populate-all-rankings`
   - ペアデータ → `stats_*` 新規テーブル (`stats_migration_flow` がプロトタイプ)
3. **exporter 追加**: `apps/remotion/scripts/exporters/<feature>.ts` (≤ 50 行が目安)
4. **エントリポイント登録**: `apps/remotion/scripts/export-d1-to-remotion-static.ts` の dispatch に追加
5. **Remotion side**: feature の `use*Data.ts` で `staticFile()` 経由読み込み
6. **本書を更新**: feature 別データ一覧に追記

## 派生先と SSOT の関係

```
D1 (SSOT)
  ├→ apps/remotion/public/    (動画 build 用)
  ├→ .local/r2/app/           → R2 (Web SSR 用)
  ├→ .local/r2/video/         (master 動画保存, /archive-remotion-output)
  └→ packages/area/src/data/  (npm package static export)
```

すべて再生成可能 snapshot。手で編集すると D1 と乖離するため禁止。

## 関連

- 親方針: `.claude/rules/data-d1-ssot.md`
- 派生先と運用ルール: `.claude/rules/data-storage.md`
- R2 キーパス設計: `.claude/rules/r2-storage-design.md`
- DDD ドメイン分類: `docs/01_技術設計/04_DDDドメイン分類.md`
- D1 schema: `packages/database/src/schema/index.ts`
- Remotion exporter 実装: `apps/remotion/scripts/exporters/`

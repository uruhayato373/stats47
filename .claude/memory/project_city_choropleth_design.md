---
name: 市区町村コロプレスマップ切替機能の設計結論
description: ランキングページの市区町村データ管理方針・実装設計（2026-03-24 決定）
type: project
---

# 市区町村コロプレスマップ切替機能

## 設計結論：市区町村データの管理方針

**既存スキーマで十分。追加の管理機構は不要。**

`ranking_items` の複合 PK `(ranking_key, area_type)` により、同じランキングキーで `"prefecture"` と `"city"` が共存できる。市区町村データの有無は既存関数で判定：

```typescript
const cityRankingItem = await findRankingItem(rankingKey, "city");
const hasCityData = cityRankingItem !== null && cityRankingItem.isActive;
```

### 不採用案と理由

| 案 | 不採用理由 |
|---|---|
| `has_city_data` カラム追加 | 同期メンテが必要。ranking_items に既にデータがある |
| 静的リスト/定数 | 手動更新が必要で陳腐化するリスク |
| 新規リポジトリ関数 | `findRankingItem(key, "city")` で十分 |

### データ状況（2026-03-24 時点）

- アクティブな市区町村ランキング: 28 件
- 都道府県と同一キーのもの: 69 件（切替トグルの対象）
- 市区町村専用キー（`-city` 接尾辞等）: 24 件（別ページ対応、トグル対象外）
- ranking_data レコード数: 約 179 万件（市区町村）

## 実装設計

### UI: ToggleGroup で "都道府県 / 市区町村" 切替

- 地図カードヘッダーの年度セレクタ横に配置
- 市区町村データがないランキングでは非表示
- URL パラメータ: `?areaType=city&year=XXXX`（ブックマーク対応）

### 地図: 全国日本地図上で TopoJSON を切り替え

同一日本地図上で都道府県 TopoJSON と全国市区町村 TopoJSON を切り替える方式を採用。トグル操作のみで全国俯瞰が可能。

- `fetchAllCitiesTopology()`（packages/gis）をオンデマンド取得
- 初回切替時に取得し、コンポーネント state にキャッシュ（再切替時は再取得しない）
- `fetchCityTopologyAction` サーバーアクション経由で取得

### 変更ファイル

| ファイル | 操作 | 目的 |
|---|---|---|
| `apps/web/src/app/ranking/[rankingKey]/page.tsx` | 変更 | 市区町村 RankingItem 並列取得・Props 追加 |
| `apps/web/src/features/ranking/components/RankingKeyPage/RankingKeyPageClient.tsx` | 変更 | areaType state・切替ロジック・URL パラメータ |
| `apps/web/src/features/ranking/components/AreaTypeToggle.tsx` | 新規 | ToggleGroup コンポーネント |
| `apps/web/src/features/ranking/components/RankingMapChart/RankingMapChartClient.tsx` | 変更 | ドリルダウン対応 |

**Why:** 市区町村データが存在するランキングでコロプレスマップの粒度を切り替える機能が必要だった。
**How to apply:** 新規ランキングキーを市区町村データ付きで登録する際は、同じ rankingKey で areaType="city" の ranking_items レコードを作成すれば自動的にトグルが表示される。

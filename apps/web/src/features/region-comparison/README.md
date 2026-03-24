# 地域間比較（region-comparison）

## 概要

2つの都道府県を選んでカテゴリ固有のビジュアライゼーションで比較する機能です。URL パラメータで選択状態を管理します。

## データソース

比較ページに表示するコンポーネントは `comparison_components` テーブルで管理する。

- **`data_source`**: `estat` に統一（`ranking` は廃止済み）
- **`component_props`**: JSON で e-Stat API パラメータを保持

### component_props の構造

単一指標（stats-card 等）:

```json
{
  "estatParams": { "statsDataId": "0000010212", "cdCat01": "#L02734" },
  "unit": "％"
}
```

複数指標（line-chart 等）:

```json
{
  "estatParams": [
    { "statsDataId": "0000010102", "cdCat01": "B4101" },
    { "statsDataId": "0000010102", "cdCat01": "B4102" }
  ],
  "labels": ["年平均気温", "最高気温"]
}
```

## ディレクトリ構成

- `components/`:
    - `CompareGridLayout`: コンポーネントを地域ごとに左右に並べて描画
    - `RegionComparisonClient`: 全体の状態管理とレイアウト
    - `RegionSelector`: 地点選択・バッジ管理
    - `MunicipalityChoroplethSection`: 市区町村コロプレスマップ
    - `ComparisonEmpty`: コンポーネント未登録時の空表示
- `types/`: 共通型定義（`ComparisonRegion` 等）

## 連携

- **地域プロファイル**: 各地域の詳細ページ（[area-profile](../area-profile/README.md)）から、「他の地域と比較する」ボタンを通じて遷移可能
- **ダッシュボード**: `CompareGridLayout` は `DashboardComponentRenderer` を経由してコンポーネントを描画

## 開発時の注意

- URL パラメータ `areas`（カンマ区切り）で選択地域を決定
- カテゴリ固有データはサーバーサイドで取得
- コンポーネント追加は `comparison_components` テーブルに `data_source = 'estat'` で INSERT する

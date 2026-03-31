# ページコンポーネント設計ガイド

## Single Source of Truth

全ダッシュボードコンポーネント（KPI・チャート・属性マトリクス等）は `page_components` テーブルが唯一の定義元。

### テーブル構造

- `page_components`: コンポーネント定義（componentKey, componentType, componentProps JSON, colors, grid 等）
- `page_component_assignments`: ページ割り当て（pageType, pageKey, componentKey, section, sortOrder）

### ページ種別（pageType）

| pageType | pageKey の例 | 用途 |
|---|---|---|
| theme | safety, population-dynamics | テーマダッシュボード |
| area | 13000, 01000 | エリアトップページ |
| area-category | safetyenvironment, economy | エリアカテゴリページ |

### 1データ1コンポーネント原則

同じ統計データは **1つのコンポーネント定義を共有**し、`page_component_assignments` で複数ページに割り当てる。

- 都道府県用（`pref-` or テーマ共用）と市区町村用（`city-`）の **2レコードのみ** 作成
- テーマページ・エリアページ・カテゴリページで同じ chart_key を共有
- チャートタイプ・色・ラベルはコンポーネント定義で統一（ページごとに変えない）

```
例: 年齢3区分人口
  theme-age-composition (composition-chart, sid=0000010101)
    → theme/population-dynamics
    → theme/aging-society
    → area-category/population

  city-pop-age (composition-chart, sid=0000020101)
    → city-category/population
```

**禁止**: 同じデータに対してページごとに異なる chart_key・チャートタイプを作成すること。

### 都道府県/市区町村の statsDataId 分離

SSDSE は都道府県用と市区町村用で異なる `statsDataId` を使う。`page_components` にそれぞれのレコードを持たせ、`page_component_assignments` の `page_type` で正しい方を割り当てる。

| page_type | 使用するコンポーネント |
|---|---|
| `theme`, `area`, `area-category` | 都道府県用（`statsDataId: 000001xxxx`） |
| `city-category` | 市区町村用（`statsDataId: 000002xxxx`） |

サービス層での statsDataId 自動変換は行わない。DB が正しいデータを持つ。

### コンポーネント追加手順

1. `page_components` に INSERT（componentKey, componentType, title, componentProps）
2. 市区町村ページでも使う場合は `city-` 版も INSERT（statsDataId のみ差し替え）
3. `page_component_assignments` に INSERT（pageType, pageKey, componentKey, section, sortOrder）
4. コード変更不要

### 禁止事項

- IndicatorSet に charts フィールドを追加してはならない（型から削除済み）
- comparison_components にチャートを追加してはならない（廃止済み）
- コード内にチャート定義をハードコードしてはならない

### componentProps の色指定

チャートには必ず色を含める:
- line-chart: `seriesColors: ["#ef4444", "#3b82f6"]`
- mixed-chart: `columnColors: ["#f59e0b"]`, `lineColors: ["#22c55e"]`

### 予約カラー（変更禁止）

| 意味 | 色 | Hex | 用途 |
|---|---|---|---|
| 男性 | 青 | `#3b82f6` | 男女比較チャート専用 |
| 女性 | ピンク | `#ec4899` | 男女比較チャート専用 |

### 推奨カラーマッピング（チャート系列用）

| 意味 | 色 | Hex |
|---|---|---|
| 危険・死者数（交通事故死、火災死等） | 赤 | `#ef4444` |
| 件数・量（認知件数、事故件数、出火件数等） | 橙 | `#f59e0b` |
| 改善・率（検挙率、納付率等） | 緑 | `#22c55e` |
| 中立・補助 | グレー | `#6b7280` |
| 特殊（自殺率等） | 紫 | `#8b5cf6` |
| 人口・出生 | 青 | `#3b82f6`（男女比較でない文脈ならOK） |

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

### コンポーネント追加手順

1. `page_components` に INSERT（componentKey, componentType, title, componentProps）
2. `page_component_assignments` に INSERT（pageType, pageKey, componentKey, section, sortOrder）
3. コード変更不要

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

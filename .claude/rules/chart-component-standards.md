# チャートコンポーネント標準 (shadcn UI + D3.js)

チャート・カードコンポーネントの**単一ソース（SSoT）**。
新規実装・テーマ追加・監査を行うエージェント / 人間はこれに従う。

> **背景**: テーマページやダッシュボードで独自実装が散在し、色・スタイル・ツールチップが統一されていなかった（2026-06 整理）。
> `chart-component-builder` agent が管理するカタログが唯一の参照源。

---

## 1. アーキテクチャ概要（3層構造）

```
Layer 1: D3プリミティブ
  packages/visualization/src/d3/components/  ← 軸・描画のみ。データを知らない

Layer 2: 共有チャートエンジン（e-Stat連携・ローディング・エラー処理）
  apps/web/src/components/stat-charts/       ← ★ 2026-06移行後の正規パス
  ├── components/charts/   フルサイズチャート（next/dynamic wrapper）
  ├── components/cards/    KPI・統計カード
  ├── adapters/            e-Stat → Chart データ変換
  └── services/            e-Stat API 接続

Layer 3: UIミニチャート（カード内埋め込み用）
  apps/web/src/components/charts/            ← ミニチャート + ChartCard

Feature-scoped（明示的に例外認定）
  features/blog/components/charts/           ← ブログ専用（useChartDataに依存、移動不可）
  features/ranking/components/               ← ランキング専用（AllPrefecturesChart等）
```

---

## 2. コンポーネントカタログ（全量）

### 2-A. D3 プリミティブ（`packages/visualization/src/d3/`）

直接使用禁止。Layer 2 または `next/dynamic` 経由でのみ参照する。

| コンポーネント | エクスポート名 | 用途 |
|---|---|---|
| `BarChart` | `D3BarChart` | 縦棒グラフ |
| `BarChartRace` | `D3BarChartRace` | バーチャートレース（アニメーション） |
| `BoxplotChart` | `D3BoxplotChart` | 箱ひげ図（分布） |
| `CategoryHeatmap` | `D3CategoryHeatmap` | カテゴリ別ヒートマップ |
| `CityMapChart` | `D3CityMapChart` | 市区町村地図チャート |
| `ColumnChart` | `D3ColumnChart` | 横棒グラフ |
| `DivergingBarChart` | `D3DivergingBarChart` | 正負分岐棒グラフ |
| `DonutChart` | `D3DonutChart` | ドーナツ円グラフ |
| `HorizontalDivergingBarChart` | `D3HorizontalDivergingBarChart` | 水平正負分岐棒 |
| `LineChart` | `D3LineChart` | 時系列折れ線 |
| `MixedChart` | `D3MixedChart` | 複合チャート（折れ線＋棒） |
| `PrefectureMapChart` | `D3PrefectureMapChart` | 都道府県地図チャート |
| `PyramidChart` | `D3PyramidChart` | 人口ピラミッド |
| `RadarChart` | `D3RadarChart` | レーダーチャート |
| `Scatterplot` | `D3Scatterplot` | 散布図 |
| `StackedAreaChart` | `D3StackedAreaChart` | 積み上げエリアチャート |
| `SunburstChart` | `D3SunburstChart` | サンバーストチャート（階層内訳） |
| `TileGridMapChart` | `D3TileGridMapChart` | タイルグリッドマップ（47都道府県） |
| `TreemapChart` | `D3TreemapChart` | ツリーマップ |
| `DivergingChoroplethMap` | `DivergingChoroplethMap` | 符号付き増減率コロプレス（RdBu・カスタムtooltip・凡例付き） |
| `TimelineChoroplethMap` | `TimelineChoroplethMap` | 時系列再生UI付きコロプレス（DivergingChoroplethMapをラップ） |

インポートパス: `@stats47/visualization/d3` または `@stats47/visualization/d3/<ComponentName>`

---

### 2-B. 共有チャートエンジン（`@/components/stat-charts/`）

e-Stat連携・データ変換・ローディング状態を内包したフルスタックチャート。
`DashboardComponentRenderer` の `componentType` に対応し、`page_components` git TSから駆動される。

#### チャートコンポーネント

| コンポーネント | インポートパス | `componentType` | 用途 |
|---|---|---|---|
| `LineChartClient` | `@/components/stat-charts` | `line-chart` | 時系列折れ線（単一・複数系列） |
| `BarChartClient` | `@/components/stat-charts/components/charts/BarChart` | `bar-chart` / `category-bar-chart` | 棒グラフ（カテゴリ比較） |
| `CompositionChartClient` | `@/components/stat-charts/components/charts/CompositionChart` | `stacked-bar-chart` | 積み上げ棒グラフ |
| `DivergingBarChartClient` | `@/components/stat-charts/components/charts/DivergingBarChart` | `diverging-bar-chart` | 正負分岐棒グラフ |
| `D3BarChartRaceClient` | `@/components/stat-charts/components/charts/D3BarChartRace` | `custom` (chart_type: bar-chart-race) | バーチャートレース |
| `MixedChartClient` | `@/components/stat-charts/components/charts/MixedChart` | `multi-trend-chart` | 複合チャート |
| `PyramidChartClient` | `@/components/stat-charts/components/charts/PyramidChart` | `pyramid-chart` | 人口ピラミッド |
| `RadarChartDashboardClient` | `@/components/stat-charts/components/charts/RadarChartDashboard` | `radar-chart` | レーダーチャート |
| `StackedAreaDashboardClient` | `@/components/stat-charts/components/charts/StackedAreaDashboard` | `stacked-area-chart` | 積み上げエリア |
| `SunburstChartClient` | `@/components/stat-charts/components/charts/SunburstDashboardChart` | `sunburst` / `treemap` | サンバースト・ツリーマップ |
| `TreemapChartClient` | `@/components/stat-charts/components/charts/TreemapDashboardChart` | `treemap` | ツリーマップ |
| `AttributeMatrix` | `@/components/stat-charts/components/charts/AttributeMatrix` | `attribute-matrix` | 属性マトリクス |
| `RankingChart` | `@/components/stat-charts/components/charts/RankingChart` | `data-table` | ランキングテーブル |

#### カードコンポーネント

| コンポーネント | インポートパス | `componentType` | 用途 |
|---|---|---|---|
| `KpiCardClient` | `@/components/stat-charts` | `stats-card` | KPI単一値カード |
| `MultiStatCardClient` | `@/components/stat-charts/components/cards/MultiStatCard` | `multi-stats-card` | 複数KPIカード |
| `DefinitionsCard` | `@/components/stat-charts/components/cards/DefinitionsCard` | `definitions-card` | 定義・説明テキストカード |
| `StatsTableClient` | `@/components/stat-charts/components/cards/StatsTable` | `data-table` | 統計テーブル |
| `SlidePresentation` | `@/components/stat-charts/components/cards/SlidePresentation` | `slide-presentation` | スライド表示 |

#### 共有UI

| コンポーネント | インポートパス | 用途 |
|---|---|---|
| `DashboardCard` | `@/components/stat-charts` | チャートを囲むカードラッパー（タイトル・出典付き） |
| `ChartSkeleton` | `@/components/stat-charts` | ローディングスケルトン |
| `DashboardComponentRenderer` | `@/components/stat-charts/components/DashboardComponentRenderer` | componentTypeディスパッチャー |

#### アダプター（e-Stat → Chart データ変換）

| 関数 | インポートパス | 用途 |
|---|---|---|
| `toLineChartData` | `@/components/stat-charts` | → LineChartData |
| `toBarChartData` | `@/components/stat-charts/adapters` | → BarChartData |
| `toKpiCardData` | `@/components/stat-charts/adapters` | → KpiCardData |
| `toCompositionChartData` | `@/components/stat-charts/adapters` | → CompositionChartData |
| `toMixedChartData` | `@/components/stat-charts/adapters` | → MixedChartData |
| `toPyramidChartData` | `@/components/stat-charts/adapters` | → PyramidChartData |
| `toSunburstData` | `@/components/stat-charts/adapters` | → SunburstData |
| `toStackedAreaData` | `@/components/stat-charts/adapters` | → StackedAreaData |
| `toRadarChartData` | `@/components/stat-charts/adapters` | → RadarChartData |

---

### 2-C. UIミニチャート（`apps/web/src/components/charts/`）

カード内に埋め込む小型インタラクティブチャート。データ取得機能を持たない。

| コンポーネント | インポートパス | 用途 |
|---|---|---|
| `ChartCard` | `@/components/charts/ChartCard` | label / value / chart / footer スロット付きカード |
| `MiniLineChart` | `@/components/charts/MiniCharts` | カード内折れ線（実線 + 比較破線）。D3インタラクティブ |
| `MiniBarChart` | `@/components/charts/MiniCharts` | カード内棒グラフ（正負値対応） |
| `MiniStackedBarChart` | `@/components/charts/MiniCharts` | カード内積み上げ棒グラフ |
| `HubSankey` | `@/components/charts/HubSankey` | 焦点 hub 型 Sankey（左ノード群 → 中央 → 右ノード群）。財政フロー / 人口移動フロー / 通勤フローで共有。`chrome`（`card`=自前カード枠 + SVG 内に title/subtitle/footer を描く / `bare`=枠と SVG 内テキストを持たず `ChartPanel` に委ねる）と `usableHeight`（ノード列の高さ = 縦横比。既定 616 は 1 カラム用、2 カラムは 340）で見た目を切り替える |
| `DistributionHistogram` | `@/components/charts/DistributionHistogram` | 全国分布ヒストグラム（市区町村ランキング 1,718 自治体用）。**サーバー側でビン化済みの集計配列**（`binMunicipalityValues`、右裾は overflow ビンへ畳む）だけを受け取り、生の観測行は受け取らない。選択都道府県は基線上のラグ（縦ティック）で重ねる（全国と地域は件数スケールが 2 桁違うため棒の重ね描きは不可視になる）。中央値の破線・`useD3Tooltip`（ビン範囲 + 全国/県の件数）付き |
| `MiniDistributionBars` | `@/components/charts/MiniDistributionBars` | カード内埋め込みの分布スパークバー（市区町村テーマ一覧カード用）。item.json に**焼き込み済みの分布ビン**（builder が `binMunicipalityValues` で生成）を描くだけの装飾チャート。カード全体がリンクのため**非インタラクティブ・aria-hidden**（tooltip をリンク内に置かない。数値情報はカードのテキストが持つ） |

#### カードフレームの役割分担（★重複と誤判定しないこと）

`@/components/charts` のカード枠は**基盤 `SurfaceCard` を共有しつつ、用途別に明確な役割を持つ**。
表層が似ている（どれも `SurfaceCard` を p-0 でラップ）が**重複ではない**。マージは leaky abstraction を生むため禁止。
（過去に監査が「ChartCard と ChartPanel は重複」と表層誤判定 → 精読で役割分担と判明: 2026-06-23）。

| コンポーネント | 役割 | header の形 | 使い分け |
|---|---|---|---|
| `ChartPanel` | **タイトル付きチャート/マップ枠** | `title`+`description`+`icon`+`action`（border-b 付き）/ bordered footer | チャート・地図など「見出し付きパネル」 |
| `ChartCard` | **compact KPI カード** | `label`+`value` を1行 baseline（border なし） | KPI（指標名+大きな数値）+ ミニチャート |
| `KpiCard` | **KPI + badge/trend** | KPI 値 + バッジ/トレンド | 増減トレンド付き KPI |

> `ChartCard.tsx` が実装本体（import path は `@/components/charts/ChartCard` の 1 種類のみ）。
> 旧 `StatsChartCard` alias と re-export barrel は 2026-07-11 (DR-AUDIT-04) で廃止した。
> 役割の正典はこの表 + `check-design-system.mjs` の `no-legacy-dashboard-card` メッセージ（"ChartPanel for charts/maps and ChartCard for compact KPI cards"）。

---

### 2-D. Feature-scoped（例外認定・移動不可）

以下は feature 固有のロジックに依存するため、feature 内に置くことを正式に認定する。

| コンポーネント | 場所 | 理由 |
|---|---|---|
| `BlogBarChart` | `@/features/blog/components/charts/BlogBarChart` | `useChartData`（ブログデータ読込）に依存 |
| `BlogLineChart` | `@/features/blog/components/charts/BlogLineChart` | 同上 |
| `BlogChoroplethMap` | `@/features/blog/components/charts/BlogChoroplethMap` | 同上 |
| `BlogScatterPlot` | `@/features/blog/components/charts/BlogScatterPlot` | 同上 |
| `BlogStatsHighlight` | `@/features/blog/components/charts/BlogStatsHighlight` | 同上 |
| `RankingAllPrefecturesChart` | `@/features/ranking/components/RankingBarChart` | ランキングページ専用 |
| `RankingBoxplotChart` | `@/features/ranking/components/RankingBoxplotChart` | 同上 |
| `TrendSparklineCard` | `@/features/ranking/components/RankingSidebar` | サイドバー専用 |
| `AgeCompositionChart` | `@/features/theme-dashboard/components/AgeCompositionChart` | テーマ専用積み上げ棒 |
| `MunicipalityChoroplethSection` | `@/features/region-comparison/components/MunicipalityChoroplethSection` | データ取得・2 県並列表示のラッパー。描画は共有 `DivergingChoroplethMap` に委譲 |
| `MetricYoyChoroplethSection` | `@/features/theme-dashboard/components/MetricYoyChoroplethSection` | データ取得・セクションラッパー。描画は共有 `TimelineChoroplethMap` に委譲 |
| `HighwayTimelineMap` | `@/features/highway-history/HighwayTimelineMap` | 高速道路網の線描画（geo path）。コロプレスではない道路特有の可視化 |

> **地理コロプレスの方針**: 符号付き増減率コロプレスは **`DivergingChoroplethMap`**（`@stats47/visualization/d3`）を使う。
> 時系列再生UIが必要な場合は **`TimelineChoroplethMap`** でラップする。feature 内に独自のコロプレス実装を追加してはならない。
> feature 内の `*ChoroplethSection` / `*ChoroplethMap` は「データ取得・レイアウト配置」のみを担い、描画は共有コンポーネントに委譲する。

---

## 3. 実装禁止パターン

```typescript
// ❌ ハードコードカラー（テーマ追従しない）
const BLUE = "#2563eb";
fill="#94a3b8"

// ❌ 独自カードラッパー（CardFrame 等）
function CardFrame({ label, value, children }) { ... }

// ❌ feature内インラインD3（2-Dの例外認定リスト外）
// features/xxx/components/MyChart.tsx に <svg> や from "d3" を直接書く

// ❌ useD3Tooltip を使わない独自tooltipDiv
const tooltipRef = useRef<HTMLDivElement>(null);
tooltip.style("left", ...).style("top", ...);  // ← useD3Tooltip を使う
```

---

## 4. 色・スタイル規約

### 色は CSS 変数のみ使用

| 用途 | CSS 変数 |
|---|---|
| 主系列・強調 | `hsl(var(--primary))` |
| 比較系列・補助 | `hsl(var(--muted-foreground))` |
| 背景 | `hsl(var(--card))` |
| ボーダー | `hsl(var(--border))` |
| 地図背景（データなし） | `hsl(var(--muted))` |
| 境界線（地図） | `hsl(var(--border))` |
| ホバー強調（地図） | `hsl(var(--foreground))` |
| 道路・特殊用途 | `hsl(var(--warning))` |

複数系列が必要な場合のみ、呼び出し元から `colors` プロップで渡す（コンポーネント内にハードコードしない）。

### shadcn UI の利用

- カードは必ず `Card` / `CardHeader` / `CardContent`（`@stats47/components/atoms/ui/card`）
- `cn()` は `@stats47/components` からインポート
- `shadow-lg` 禁止 → `shadow-sm` / `shadow-md`（hover）
- `rounded-xl` 禁止 → フラット（`--radius: 0`）

---

## 5. D3.js 利用規約

### ツールチップ

`useD3Tooltip` を必ず使う（`@stats47/visualization` からインポート）。独自ツールチップ実装禁止。

```typescript
import { useD3Tooltip } from "@stats47/visualization";
const { showTooltip, showStackedTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();
```

### SVG サイズ

- ミニチャート: `viewBox="0 0 260 84"` を基準に `width="100%"` でレスポンシブ
- フルサイズ: `packages/visualization` の各 Props 型に従う

### アクセシビリティ

- SVG に必ず `role="img"` と `aria-label` を付与

---

## 6. 新規チャート追加フロー

```
1. カタログ確認（本ファイル §2）→ 既存で対応可能か？
   ├─ YES → 既存を使う
   └─ NO  → 2 へ

2. chart-component-builder agent に設計を依頼
   - 必要なprops・色・インタラクションを伝える
   - agentがカタログ（本ファイル）を更新する

3. 実装
   - Layer 2（e-Stat連携あり）→ @/components/stat-charts/components/charts/
   - Layer 3（UIのみ・データなし）→ @/components/charts/
   - CSS変数カラーのみ使用
   - useD3Tooltip を使用（D3インタラクティブの場合）
   - role="img" + aria-label を付与

4. /audit-chart-components スキルで違反ゼロを確認
5. 本カタログ（§2）を更新してSSoTを維持
```

---

## 7. 監査チェックリスト（`/audit-chart-components`）

| 項目 | NGパターン | 検出方法 |
|---|---|---|
| A. ハードコード色 | `#[0-9a-fA-F]{3,6}` が fill/stroke に直書き | grep |
| B. 未認定feature-scopeチャート | §2-D以外の`features/*/components/*.tsx`にSVG/D3 | grep |
| C. 独自カードラッパー | `features/`配下にcard/frame様の独自ラッパー | grep |
| D. useD3Tooltip未使用 | D3使用ファイルに`useD3Tooltip`なし | grep |
| E. shadcn Card未使用 | カード形状なのに`Card`インポートなし | grep |

§2-D の例外認定リストに載っているものはB・Dの対象外とする。

---

## 8. 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-06-17 | 全コンポーネントをカタログ化（3層構造・SSoT確立）。`features/stat-charts/` → `components/stat-charts/` 移行記録 |
| 2026-06 | 初版作成（MiniCharts・ChartCard・基本ルール） |

---

## 関連

- エージェント: `.claude/agents/chart-component-builder.md`
- スキル: `.claude/skills/ui/audit-chart-components/SKILL.md`
- shadcn UI 規約: `.claude/rules/ui-components.md`
- D3プリミティブ: `packages/visualization/src/d3/`
- 共有エンジン: `apps/web/src/components/stat-charts/`（2026-06移行後）
- UIミニチャート: `apps/web/src/components/charts/`

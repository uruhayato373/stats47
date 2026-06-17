# ブログ SVG チャート標準 (packages/svg-builder)

ブログ記事・note 記事向け静的 SVG チャートの**単一ソース（SSoT）**。
新規チャート追加・記事生成・監査を行うエージェント / 人間はこれに従う。

> **背景**: 記事ごとにインライン生成スクリプトが散在し、色・スタイル・ファイル命名が統一されていなかった（2026-06整理）。
> `chart-author` agent が管理するカタログが唯一の参照源。

---

## 1. アーキテクチャ概要（2層構造）

```
Layer 1: SVG ビルダー（共有ライブラリ）
  packages/svg-builder/src/
  ├── charts/     棒・折れ線・コロプレス・散布図・積み上げ棒
  ├── tables/     ランキングテーブル
  └── shared/     theme・color・axis・layout・regression・stats-schema

Layer 2: 記事 CLI（スキル実行エントリ）
  .claude/scripts/blog/generate-article-charts.mjs  ← Layer 1 を呼ぶ
  .claude/skills/blog/generate-article-charts/       ← スキル定義
```

**原則**: 新規チャートは必ず Layer 1 に実装してから CLI から呼ぶ。
CLI 内にインライン生成ロジックを書かない（重複・ドリフトの温床）。

---

## 2. チャートカタログ（全量）

### 2-A. チャートコンポーネント（`packages/svg-builder/src/charts/`）

| 関数 | ファイル | 入力型 | データ命名パターン | 用途 |
|---|---|---|---|---|
| `generateBarChartSvg` | `bar-chart.ts` | `BarItem[]` + `BarChartOptions` | `*-prefecture-rankings.json` | 横棒（上位5+下位5、セパレーター対応） |
| `generateChoroplethSvg` | `choropleth.ts` | `ChoroplethItem[]` + `ChoroplethOptions` | `*-tile-grid.json` | タイルグリッド 47 都道府県マップ |
| `generateLineSvg` | `line.ts` | `StatsSchema[]` + `LineOptions` | `*-timeseries.json` | 多系列折れ線（時系列・年齢階級）|
| `generateScatterSvg` | `scatter.ts` | `ScatterPoint[]` + `ScatterOptions` | `*-scatter.json` | 散布図（全都道府県・相関可視化） |
| `generateStackedBarSvg` | `stacked-bar.ts` | `StackedData` + `StackedBarOptions` | `*-stacked.json` | 積み上げ棒グラフ（構成比）|

### 2-B. テーブルコンポーネント（`packages/svg-builder/src/tables/`）

| 関数 | ファイル | 用途 |
|---|---|---|
| `generateRankingTableSvg` | `ranking-table.ts` | ランキング表（数値比較・数値が多い場合のみ使用） |

> **注意**: markdown 表は記事本文に禁止（`blog-quality-standards.md` §可視化）。
> 表が必要な場合は `generateRankingTableSvg` を使う。ただし棒グラフで代替できる場合はそちらを優先。

### 2-C. 共有ユーティリティ（`packages/svg-builder/src/shared/`）

| モジュール | 主な export | 用途 |
|---|---|---|
| `theme.ts` | `svgThemeStyle()` | ダークモード CSS ブロック（必ず `<svg>` 直後に挿入） |
| `color.ts` | `PALETTES`, `colorByIndex`, `SCATTER_COLORS`, `FONT_FAMILY` | 色パレット・フォント（ハードコード hex — 静的 SVG のため CSS 変数不可） |
| `axis.ts` | `niceScale`, `formatTick`, `niceTicks`, `linearScale` | 軸スケール計算・ラベルフォーマット |
| `layout.ts` | `makePlotArea`, `px` | プロットエリア座標計算 |
| `regression.ts` | `linearRegression` | 散布図の回帰直線 |
| `stats-schema.ts` | `toSplitItems`, `toChoroplethItems`, `joinStats` | StatsSchema → Chart 入力変換 |

---

## 3. 色・スタイル規約

### パレット（`PALETTES` — static SVG 用ハードコード hex）

静的 SVG は `<img>` サンドボックス内でレンダリングされるため、CSS 変数（`hsl(var(--primary))`）は使用不可。
代わりに `PALETTES` の固定色を使う。

| パレット | 用途 | 色範囲 |
|---|---|---|
| `PALETTES.red` | 多い・危険・ワースト順（1位が最悪の指標） | `#c62828`（濃）〜`#ef9a9a`（薄） |
| `PALETTES.blue` | 少ない・安全・ベスト順（1位が最良の指標） | `#1565c0`（濃）〜`#f0f8ff`（薄） |
| `PALETTES.orange` | 中立的に多い（消費量・観光客数等） | `#e65100`（濃）〜`#fff8f0`（薄） |
| `SCATTER_COLORS.mid` | 散布図ドット（均一色） | fill `#6b8fc9` / stroke `#3b6fa0` |

**選択基準**:
- 指標が高い = 悪い（死亡率・犯罪率・失業率） → `red`
- 指標が高い = 良い（収入・平均寿命） → `blue`
- 指標が高い = 中立（生産量・観光客数） → `orange`
- 相関可視化（散布図）→ `SCATTER_COLORS.mid`（単色均一）

### ダークモード（`svgThemeStyle()`）

SVG 全チャートで必須。`<svg>` の直後（`<title>` の後）に挿入する。

```ts
svg += svgThemeStyle();
// → <style>.svg-bg{...}@media(prefers-color-scheme:dark){.svg-bg{fill:#0f172a}...}</style>
```

テーマ依存要素には inline fill の代わりに以下の class を付与:

| class | 用途 | light | dark |
|---|---|---|---|
| `svg-bg` | 背景 rect | `#ffffff` | `#0f172a` |
| `svg-plot` | プロットエリア | `#f9fafb` | `#1e293b` |
| `svg-plot-border` | プロットエリア枠線 | `#d1d5db` | `#334155` |
| `svg-title` | タイトル文字 | `#1f2937` | `#e2e8f0` |
| `svg-axis` | 軸ラベル文字 | `#374151` | `#cbd5e1` |
| `svg-tick` | 目盛り・凡例文字 | `#6b7280` | `#94a3b8` |
| `svg-grid` | グリッド線 | `#e5e7eb` | `#334155` |

データ色（棒・ドット）は vivid 色のため inline fill で良い（テーマ非依存）。

### フォント

`FONT_FAMILY = "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif"`
全チャートで統一。ウェブフォント読み込みなし。

---

## 4. ファイル命名規則

### データ JSON（`data/*.json`）

| サフィックス | 対応チャート関数 | 例 |
|---|---|---|
| `*-prefecture-rankings.json` | `generateBarChartSvg` | `mortality-prefecture-rankings.json` |
| `*-tile-grid.json` | `generateChoroplethSvg` | `unemployment-tile-grid.json` |
| `*-timeseries.json` | `generateLineSvg` | `population-timeseries.json` |
| `*-scatter.json` | `generateScatterSvg` | `income-lifespan-scatter.json` |
| `*-stacked.json` | `generateStackedBarSvg` | `age-composition-stacked.json` |

### 出力 SVG（`data/*.svg`）

```
{json-basename-without-extension}.svg
```

例: `mortality-prefecture-rankings.json` → `mortality-prefecture-rankings.svg`

### プロベナンスコメント（必須）

全 SVG の末尾に埋め込む:

```svg
<!-- data-source: mortality-prefecture-rankings.json | generated: 2026-06-17T10:00:00.000Z -->
```

---

## 5. viewBox 規格

| チャート種 | 標準 viewBox | 備考 |
|---|---|---|
| 横棒（上位5+下位5） | `0 0 560 {height}` | height は件数に応じて可変（1行 30px 基準） |
| タイルグリッドマップ | `0 0 560 420` | 47 都道府県固定レイアウト |
| 折れ線（時系列） | `0 0 640 400` | 系列数・期間に応じて調整可 |
| 散布図 | `0 0 640 480` | 47 点固定 |
| 積み上げ棒 | `0 0 640 {height}` | 可変 |

`width` と `height` 属性は viewBox と必ず一致させる（svg-lint が検査）。

---

## 6. 品質チェック（`svg-lint.mjs`）

`packages/svg-builder` の全出力は `.claude/scripts/lib/svg-lint.mjs` で検査。

| 重大度 | チェック項目 |
|---|---|
| **error** | viewBox 未設定 / width・height 属性なし / 閉じタグなし |
| **warning** | ダークモード非準拠（`svgThemeStyle()` なし） / テーマ色のインライン指定 |

バッチ監査: `.claude/scripts/blog/audit-chart-quality.mjs` で全記事を一括チェック。

---

## 7. 禁止パターン

```typescript
// ❌ CLI / 記事生成スクリプト内にインライン SVG ロジック
function genBarChartSvg() { /* svg文字列を直接組む */ }

// ❌ CSS 変数（静的 SVG では動作しない）
fill="hsl(var(--primary))"

// ❌ svgThemeStyle() なし（ダークモードで白背景のまま）
<svg viewBox="0 0 560 300" width="560" height="300">
  <rect class="svg-bg" width="560" height="300"/>  <!-- クラスが効かない -->

// ❌ PALETTES 以外のアドホック色
fill="#ff0000"  // ← PALETTES.red[0] の "#c62828" を使う

// ✅ 正しいパターン
import { generateBarChartSvg } from "@stats47/svg-builder";
import { toSplitItems } from "@stats47/svg-builder";
const items = toSplitItems(data, 5, 5);
const svg = generateBarChartSvg(items, { title: "...", palette: "red", ... });
```

---

## 8. 新規チャートタイプ追加フロー

```
1. カタログ確認（本ファイル §2）→ 既存で対応可能か？
   ├─ YES → 既存を使う
   └─ NO  → chart-author agent に設計を依頼

2. packages/svg-builder/src/charts/ に実装
   - svgThemeStyle() を使う
   - PALETTES / FONT_FAMILY を使う
   - データ命名パターンを決めて §2 に追記

3. packages/svg-builder/src/charts/index.ts にエクスポート追加

4. generate-article-charts.mjs で命名パターンから自動ディスパッチする分岐追加

5. /audit-blog-svg-charts スキルで違反ゼロを確認

6. 本カタログ（§2）を更新して SSoT を維持
```

---

## 9. 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-06-17 | 初版作成（svg-builder 全チャートをカタログ化・SSoT 確立） |

---

## 関連

- エージェント: `.claude/agents/chart-author.md`
- 監査スキル: `.claude/skills/ui/audit-blog-svg-charts/SKILL.md`
- ビルダーライブラリ: `packages/svg-builder/src/`
- 生成 CLI: `.claude/scripts/blog/generate-article-charts.mjs`
- 目視レビューギャラリー: `.claude/scripts/blog/build-svg-gallery.mjs`（全 SVG を HTML 一覧化）
- ブログ品質基準: `.claude/rules/blog-quality-standards.md`

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
  .claude/scripts/blog/generate-article-charts.ts  ← Layer 1 を呼ぶ
  .claude/skills/blog/generate-article-charts/       ← スキル定義
```

**原則**: 新規チャートは必ず Layer 1 に実装してから CLI から呼ぶ。
CLI 内にインライン生成ロジックを書かない（重複・ドリフトの温床）。

---

## 2. チャートカタログ（全量）

### 2-A. チャートコンポーネント（`packages/svg-builder/src/charts/`）

実データ（611枚 / 2026-06-17 集計）の出現頻度を「実出現」列に併記する。共通化の優先度判定に使う。

| 関数 | ファイル | 入力型 | データ命名パターン | 実出現 | 用途 |
|---|---|---|---|---|---|
| `generateBarChartSvg` | `bar-chart.ts` | `BarItem[]` + `BarChartOptions` | `*-ranking.json` / `*-top5-bottom5.json` | ~239 | ランキングはカード型のみ・**上位5+下位5固定**（10件廃止）。`layout:"columns"`=横長2列カード（左=上位/右=下位、`960×404`、ブログ本文+X 用）/ `layout:"portrait"`=縦長スタックカード（上位5↓下位5、`1080×1350` 4:5、Instagram 用 `-ig.svg`）/ `layout:"single"`=縦1列+「…中略…」(680幅)。`generate-article-charts.ts` が `*-ranking.json` から columns(`<name>.svg`)+portrait(`<name>-ig.svg`)を自動両出力 |
| `generateScatterSvg` | `scatter.ts` | `ScatterPoint[]` + `ScatterOptions` | `*-scatter.json` | ~166 | 散布図（全都道府県・相関可視化） |
| `generateChoroplethSvg` | `choropleth.ts` | `ChoroplethItem[]` + `ChoroplethOptions` | `*-map.json` / `*-tile-grid.json` | ~84 | タイルグリッド 47 都道府県マップ |
| `generateLineSvg` | `line.ts` | `StatsSchema[]` + `LineOptions` | `*-timeseries.json` / `*-trend.json` | ~39 | 多系列折れ線（時系列・年齢階級）|
| `generateStackedBarSvg` | `stacked-bar.ts` | `StackedData` + `StackedBarOptions` | `*-stacked.json` / `*-breakdown.json` | ~5 | 積み上げ棒グラフ（構成比）|
| `generateFindingsCardSvg` | `findings-card.ts` | `FindingsCardData`（`{ findings: string[] \| FindingsCardItem[], title?: string }`） | `*-summary-findings.json` / `*-findings.json` | ~54 | 「この記事でわかったこと」要点カード（番号付き circle + テキスト行） |

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
| `PALETTES.purple` | 中立的・嗜好品（アルコール等） | `#7b1fa2`（濃）〜`#fdf7ff`（薄） |
| `PALETTES.green` | 中立的・自然/環境 | `#2e7d32`（濃）〜`#f7fcf8`（薄） |
| `SCATTER_COLORS.mid` | 散布図ドット（均一色） | fill `#6b8fc9` / stroke `#3b6fa0` |

> **CARD_THEMES（カード型2列ランキング専用）**: `bar-chart.ts` の `layout:"columns"` は header/bar/cardAlt の
> 専用色セット（`CARD_THEMES`、red=`#dc2626`/`#ef4444`/`#fef2f2` 等の Tailwind 系）を使う。カードはライト固定の
> 島として描画し、外枠 (`svg-bg`/`svg-title`) のみ dark 追従する（手本 aging-solo / alcohol に忠実）。

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

**canonical サフィックス**（新規は必ずこれを使う）と、実データに頻出する **alias**（既存の許容形・CLI が同型にディスパッチ）を併記する。

| canonical | alias（実出現） | 対応チャート関数 |
|---|---|---|
| `*-ranking.json` | `*-prefecture-rankings` / `*-top5-bottom5` / `*-top-bottom` / `*-rate-ranking` / `*-income-ranking` 等 | `generateBarChartSvg` |
| `*-scatter.json` | `*-rate-scatter` 等 | `generateScatterSvg` |
| `*-map.json` | `*-tile-grid` / `*-income-map` / `*-ratio-map` 等 | `generateChoroplethSvg` |
| `*-timeseries.json` | `*-trend` / `*-national-trend` 等 | `generateLineSvg` |
| `*-stacked.json` | `*-breakdown` / `*-composition` 等 | `generateStackedBarSvg` |
| `*-summary-findings.json` | `*-findings` 等 | `generateFindingsCardSvg` ★ |

> **alias の扱い**: `generate-article-charts.ts` の型判定（`classifyChartType`）が alias を canonical 関数にディスパッチする。
> alias は「既存資産の許容」であり、**新規記事は canonical を使う**こと。`inline-chart-N` / `chart-1` のような
> **無意味名は禁止**（型が判別不能・監査で F 違反）。

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

幅は型ごとに固定し、高さのみデータ件数で可変にする（現状 viewBox が断片化しているため標準幅に収斂させる）。
「実出現の最頻」は 611 枚集計（2026-06-17）の最頻 viewBox。新規は **標準幅** 列に揃える。

| チャート種 | 標準幅 | 高さ | 実出現の最頻 |
|---|---|---|---|
| ランキング横長（columns・ブログ/X） | `960` | `404`（上位5+下位5固定） | カード型2列（aging-solo / alcohol スタイル） |
| ランキング縦長（portrait・IG `-ig.svg`） | `1080` | `1350`（4:5固定） | 縦長スタック（上位5↓下位5） |
| ランキング（single・1列） | `680` | 可変（1行 ~30px） | `680×300`（95枚） |
| 散布図（scatter） | `960` | `624` | `960×624`（80枚） |
| タイルマップ（map） | `600` | `700` | `600×700`（47枚） |
| 要点カード（findings） | `960` | 可変（要点数 × ~80px） | `960×478`（26枚） |
| 折れ線（timeseries） | `680` | `420` | `680×420`（19枚） |
| 積み上げ棒（stacked） | `680` | 可変 | `680×420` |

`width` と `height` 属性は viewBox と必ず一致させる（svg-lint が検査）。
**svg-builder の各チャートは §5 標準幅に収斂済（2026-06-17 Step 5）**: bar single=680（width/height も 680 に一致、旧 DISPLAY_W=780 スケーリングは廃止）/ **ランキングカード 横長columns=960×404・縦長portrait=1080×1350（2026-06-20）** / scatter=960×624 / map=600×700 / line=680×420 / stacked=680 / findings=960。新規生成は自動的にこの規格になる。
**標準幅から外れる既存 SVG は再生成で是正**（`regenerate-blog-svgs.yml`・§10 Step 4）。

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

4. generate-article-charts.ts で命名パターンから自動ディスパッチする分岐追加

5. /audit-blog-svg-charts スキルで違反ゼロを確認

6. 本カタログ（§2）を更新して SSoT を維持
```

---

## 10. 現状ベースライン & 共通化ロードマップ

611 枚の実測（2026-06-17 `analyze-svg-patterns` 集計）から、**6 つの型に収斂する**ことが確定した。
実物の大半は svg-builder ではなく `generate-article-charts.ts` のインライン生成・旧スクリプト由来で、
命名・配色・viewBox・ダークモードが不統一。以下が是正ベースラインと共通化ロードマップ。

### 計測ベースライン（611枚）

| 指標 | 実態 | 目標 |
|---|---|---|
| 6 型への分類可能性 | bar~239 / scatter~166 / map~84 / findings~54 / line~39 / stacked~5 | — |
| canonical 命名準拠 | **34%**（404枚が alias/無意味名） | 100%（新規）/ alias 許容（既存） |
| ダークモード対応（`svgThemeStyle`） | **21%**（482枚が未対応） | 100% |
| viewBox の標準幅準拠 | 断片化（15+ パターン） | 型ごとに標準幅へ収斂 |

### 共通化ロードマップ（優先度順）

1. ✅ **`generateFindingsCardSvg` を svg-builder に新設**（2026-06-17 完了）
   → `packages/svg-builder/src/charts/findings-card.ts` 実装済。`svgThemeStyle()` 準拠。`generate-article-charts.ts` に `summary` タイプのディスパッチ追加・alias 命名パターン対応済
2. ✅ **CLI のインライン生成器を svg-builder 呼び出しに置換**（`genBarChartSvg` 等 5 関数 → `@stats47/svg-builder`）（2026-06-17 完了）
   → `generate-article-charts.mjs` を `.ts` にリネームし tsx 実行に変更（tsx の ESM hook が `.mjs` entry の imported `.ts` を変換しないため）。5 つのインライン生成器を削除し svg-builder を直接 import する adapter に置換。`svgThemeStyle()` が全チャートに自動付与される。CI（`generate-article-charts.yml`）も `npx tsx` に更新。視覚変更（1列+セパレータ vs 旧2列）を伴うため既存 SVG の是正は Step 4 で dry-run 確認後に実施。
3. ✅ **`detectChartType` に alias ディスパッチを実装**（§4 alias 表を機械化）（2026-06-17 完了）
4. 🔄 **ダークモード未対応 SVG の再生成**（svg-builder 経由で一括再生成 → R2）
   → ワークフロー `regenerate-blog-svgs.yml` 追加済（2026-06-17）。R2 `app/blog` をダウンロード → 各 slug で `generate-article-charts.ts --base .local/r2/app/blog` を実行し data/*.json から *.svg を再生成（dark mode 自動付与）。**dry_run=true 既定**でギャラリー artifact を出力、本番 R2 push は `dry_run=false` 明示時のみ。`data/*.json` を持たない無意味名 SVG（inline-chart-N）は対象外で手動 brushup が必要。**実行には develop への配備 + workflow dispatch が必要**。まず dry-run でギャラリーを視覚確認してから本番反映する。
5. **viewBox 標準幅への収斂**（再生成時に §5 標準幅を適用）

> 進捗は是正のたびに本表の「実態」を更新する。再生成は CI（`regenerate-blog-svgs.yml` / `sync-snapshots.yml`）経由（ローカル R2 書き込み禁止）。

---

## 9. 変更履歴

| 日付 | 変更内容 |
|---|---|
| 2026-06-17 | 初版作成（svg-builder 全チャートをカタログ化・SSoT 確立） |
| 2026-06-17 | 611枚実測で実態是正: findings-card 型追加・命名 alias 表・viewBox 実態反映・共通化ロードマップ（§10）追加 |

---

## 関連

- エージェント: `.claude/agents/chart-author.md`
- 監査スキル: `.claude/skills/ui/audit-blog-svg-charts/SKILL.md`
- ビルダーライブラリ: `packages/svg-builder/src/`
- 生成 CLI: `.claude/scripts/blog/generate-article-charts.ts`
- 目視レビューギャラリー: `.claude/scripts/blog/build-svg-gallery.mjs`（記事別に全 SVG を HTML 一覧化）
- カタログ別タブ切替ギャラリー: `.claude/scripts/blog/build-svg-gallery-tabbed.mjs`（6カタログ+未分類にタブ分類。`--source r2` 既定で公開 URL から取得。カタログ内の見た目統一を確認する用途）
- ブログ品質基準: `.claude/rules/blog-quality-standards.md`

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

| 関数                      | ファイル           | 入力型                                                                               | データ命名パターン                            | 実出現 | 用途                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------- | ------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `generateBarChartSvg`     | `bar-chart.ts`     | `BarItem[]` + `BarChartOptions`                                                      | `*-ranking.json` / `*-top5-bottom5.json`      | ~239   | ランキングはカード型のみ・**上位5+下位5固定**（10件廃止）。`layout:"columns"`=横長2列カード（左=上位/右=下位、`960×404`、ブログ本文+X 用）/ `layout:"portrait"`=縦長スタックカード（上位5↓下位5、`1080×1350` 4:5、Instagram 用 `-ig.svg`）/ `layout:"single"`=縦1列+「…中略…」(680幅)。`generate-article-charts.ts` が `*-ranking.json` から columns(`<name>.svg`)+portrait(`<name>-ig.svg`)を自動両出力                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `generateScatterSvg`      | `scatter.ts`       | `ScatterPoint[]` + `ScatterOptions`                                                  | `*-scatter.json`                              | ~166   | 散布図（全都道府県・相関可視化）。**720×720固定、実プロット領域も正方形、全点をニュートラル単色、地域凡例なし**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `generateChoroplethSvg`   | `choropleth.ts`    | `ChoroplethItem[]` + `ChoroplethOptions`                                             | `*-map.json` / `*-tile-grid.json`             | ~84    | タイルグリッド47都道府県マップ。**720×720固定（正方形・地図を最大化）・透過背景・テーマ非依存・左上にタイトル+上位3県・凡例は右下**（既定ラベル 低い/高い + 実数値スケール。安全/危険 等の意味的ラベルは json `legendLabels` 明示時のみ＝2026-07-13 是正）。タイル内は**県名+値の2行**（`showValue` 既定 true）・**字の大きさは1マスタイル基準で全タイル共通**（2マス幅だけ大きくしない）・表示名はコードから決定的に作る（北海道を「北海」にしない）。タイル内テキストはタイル色の明度で白/濃紺を切り替え+縁取り（2026-07-31 改訂。単色白は淡色タイルで読めなかった）。色は **D3カラースキーム** `scheme`(`Blues`/`Viridis`/`RdYlGn`/`RdBu`/`Spectral`/`YlOrRd`…d3-scale-chromatic、未指定時 Reds)、`reverse`/`showValue`/`showRankList` 可。データは SSOT(R2 app/ranking)。一括再生成: `regenerate-tile-maps.ts`。**不変量の gate = `lintTileGridQuality`（§6-2）**。正典 `blog-data-schema.md` §1.6 |
| `generateLineSvg`         | `line.ts`          | `StatsSchema[]` + `LineOptions`                                                      | `*-timeseries.json` / `*-trend.json`          | ~39    | 多系列折れ線（時系列・年齢階級）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `generateStackedBarSvg`   | `stacked-bar.ts`   | `StackedData` + `StackedBarOptions`                                                  | `*-stacked.json` / `*-breakdown.json`         | ~5     | 積み上げ棒グラフ（構成比）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `generateFindingsCardSvg` | `findings-card.ts` | `FindingsCardData`（`{ findings: string[] \| FindingsCardItem[], title?: string }`） | `*-summary-findings.json` / `*-findings.json` | ~54    | 「この記事でわかったこと」要点カード（番号付き circle + テキスト行）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

### 2-B. テーブルコンポーネント（`packages/svg-builder/src/tables/`）

| 関数                      | ファイル           | 用途                                             |
| ------------------------- | ------------------ | ------------------------------------------------ |
| `generateRankingTableSvg` | `ranking-table.ts` | ランキング表（数値比較・数値が多い場合のみ使用） |

> **注意**: markdown 表は記事本文に禁止（`blog-quality-standards.md` §可視化）。
> 表が必要な場合は `generateRankingTableSvg` を使う。ただし棒グラフで代替できる場合はそちらを優先。

### 2-C. 共有ユーティリティ（`packages/svg-builder/src/shared/`）

| モジュール        | 主な export                                                 | 用途                                                                    |
| ----------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `theme.ts`        | `svgThemeStyle()`                                           | ダークモード CSS ブロック（必ず `<svg>` 直後に挿入）                    |
| `color.ts`        | `PALETTES`, `colorByIndex`, `SCATTER_COLORS`, `FONT_FAMILY` | 色パレット・フォント（ハードコード hex — 静的 SVG のため CSS 変数不可） |
| `axis.ts`         | `niceScale`, `formatTick`, `niceTicks`, `linearScale`       | 軸スケール計算・ラベルフォーマット                                      |
| `layout.ts`       | `makePlotArea`, `px`                                        | プロットエリア座標計算                                                  |
| `regression.ts`   | `linearRegression`                                          | 散布図の回帰直線                                                        |
| `stats-schema.ts` | `toSplitItems`, `toChoroplethItems`, `joinStats`            | StatsSchema → Chart 入力変換                                            |

---

## 3. 色・スタイル規約

### パレット（`PALETTES` — static SVG 用ハードコード hex）

静的 SVG は `<img>` サンドボックス内でレンダリングされるため、CSS 変数（`hsl(var(--primary))`）は使用不可。
代わりに `PALETTES` の固定色を使う。

| パレット             | 用途                                      | 色範囲                            |
| -------------------- | ----------------------------------------- | --------------------------------- |
| `PALETTES.red`       | 多い・危険・ワースト順（1位が最悪の指標） | `#c62828`（濃）〜`#ef9a9a`（薄）  |
| `PALETTES.blue`      | 少ない・安全・ベスト順（1位が最良の指標） | `#1565c0`（濃）〜`#f0f8ff`（薄）  |
| `PALETTES.orange`    | 中立的に多い（消費量・観光客数等）        | `#e65100`（濃）〜`#fff8f0`（薄）  |
| `PALETTES.purple`    | 中立的・嗜好品（アルコール等）            | `#7b1fa2`（濃）〜`#fdf7ff`（薄）  |
| `PALETTES.green`     | 中立的・自然/環境                         | `#2e7d32`（濃）〜`#f7fcf8`（薄）  |
| `SCATTER_COLORS.mid` | 散布図ドット（均一なニュートラル色）      | fill `#64748b` / stroke `#475569` |

> **CARD_THEMES（カード型2列ランキング専用）**: `bar-chart.ts` の `layout:"columns"` は header/bar/cardAlt の
> 専用色セット（`CARD_THEMES`、red=`#dc2626`/`#ef4444`/`#fef2f2` 等の Tailwind 系）を使う。カードはライト固定の
> 島として描画し、外枠 (`svg-bg`/`svg-title`) のみ dark 追従する（手本 aging-solo / alcohol に忠実）。

**選択基準**（棒グラフ等の静的 SVG）:

- 指標が高い = 悪い（死亡率・犯罪率・失業率） → `red`
- 指標が高い = 良い（収入・平均寿命） → `blue`
- 指標が高い = 中立（生産量・観光客数） → `orange`
- 相関可視化（散布図）→ `SCATTER_COLORS.mid`（単色均一）

### コロプレス（タイルマップ）の配色 — 正典はコード（2026-07-31 SSOT 化）

上の選択基準を**コロプレスについては `packages/data-configs/src/color-scheme-policy.ts` の
`resolveColorScheme` が実装する**。文章のルールと実装が乖離しないよう、判断はこの関数に一本化する。

| 層                                            | 正典                                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| 配色の語彙（46 種・短縮名 ⇄ 正式名・d3 実名） | `packages/types/src/color-scheme.ts`（`COLOR_SCHEME_CATALOG`）                |
| どの配色を選ぶか（決定規則）                  | `packages/data-configs/src/color-scheme-policy.ts`（`resolveColorScheme`）    |
| 指標の極性（高いほど良い/悪い）               | `packages/data-configs/src/metric-polarity.ts`（`METRIC_POLARITY`）           |
| 配信への焼き込み                              | `build-ranking-item-from-metric.ts` → R2 `app/ranking/<key>/item.json`        |
| ブログ地図への伝搬                            | `regenerate-tile-maps.ts` が item.json から読み、地図 JSON に `scheme` を焼く |

**決定順序**（`reason` として返るので分布を機械集計できる）:

1. `explicit` — config の明示指定が **Blues 以外**なら採用（deliberate）
2. `diverging` — `colorSchemeType: "diverging"` → `interpolateRdBu`
3. `polarity` — 極性が確定していれば worse→Reds / better→Blues
4. `category` — topical 色（agriculture→Greens / landweather・energy→Oranges）
5. `default` — `interpolateBlues`

> **明示 Blues を「選択」として扱わない理由**: `interpolateBlues` は 2,295 metric 中 1,960 件（85%）に
> 書かれており、**選択ではなく全 config に焼かれた既定値**。deliberate 扱いすると極性を入れても
> どの色も変わらず、カタログが飾りになる。
>
> **polarity を category から推定しない理由**: category は粗すぎて同じ軸に「高いほど良い」と
> 「高いほど悪い」が同居する（safetyenvironment に犯罪件数と検挙率が両方いる）。
> 一方 topical 色は良し悪しを主張しないので粗さが問題にならない。
> 極性は**証拠のある分だけ収載**し、未収載は未割当のまま（推測で埋めない）。

**禁止**:

| NG                                               | OK                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| 語彙外の配色名を config に書く                   | `validate:config` の `[color-scheme]` が error で弾く                          |
| svg-builder に正式名（`interpolateBlues`）を渡す | `toShortColorScheme` で短縮名に直す（渡すと**全部赤**になる）                  |
| 凡例のグラデーションを CSS リテラルで書く        | `legendGradientCss(colorScheme)` で interpolator から導出する                  |
| 極性を推測で埋める                               | 証拠のある分だけ収載。判断が割れたものは `EXCLUDED_FROM_SEED` に理由付きで残す |

**ゲート**: `npm run validate:polarity --workspace=@stats47/data-configs`（pre-commit + CI の
Colorscheme Policy Gate）。幽霊キー・evidence 空・カバレッジの減少（増加専用ラチェット）・
決定規則が語彙外の色を返す、を error にする。

### ダークモード（`svgThemeStyle()`）

**タイルマップ（choropleth）を除く**全チャートで必須。`<svg>` の直後（`<title>` の後）に挿入する。

> **★タイルマップは `svgThemeStyle()` を使わない（2026-07-29）。** サイトのテーマは next-themes の
> class 方式で `enableSystem={false}` / `defaultTheme="light"`、つまり **OS の `prefers-color-scheme` を
> 意図的に無視する**。一方 `<img>` 内の SVG から親ページの `.dark` class は見えない。この 2 つが重なると
> `@media (prefers-color-scheme:dark)` は「OS はダーク・サイトはライト」のユーザーで
> **SVG だけを反転させる**（明るい記事の中に濃紺の箱が出る）。タイルマップは背景を敷かず
> テーマ非依存の配色にすることでライト/ダーク双方に対応する。gate = `lintTileGridQuality`（§6-2）。
>
> 他チャート（bar / scatter / line / stacked / findings）は現状 `svgThemeStyle()` のままで、
> 同じ不整合を抱えている。移行するかは別途判断する（本改訂ではタイルマップのみ対象）。

```ts
svg += svgThemeStyle();
// → <style>.svg-bg{...}@media(prefers-color-scheme:dark){.svg-bg{fill:#0f172a}...}</style>
```

テーマ依存要素には inline fill の代わりに以下の class を付与:

| class             | 用途               | light     | dark      |
| ----------------- | ------------------ | --------- | --------- |
| `svg-bg`          | 背景 rect          | `#ffffff` | `#0f172a` |
| `svg-plot`        | プロットエリア     | `#f9fafb` | `#1e293b` |
| `svg-plot-border` | プロットエリア枠線 | `#d1d5db` | `#334155` |
| `svg-title`       | タイトル文字       | `#1f2937` | `#e2e8f0` |
| `svg-axis`        | 軸ラベル文字       | `#374151` | `#cbd5e1` |
| `svg-tick`        | 目盛り・凡例文字   | `#6b7280` | `#94a3b8` |
| `svg-grid`        | グリッド線         | `#e5e7eb` | `#334155` |

データ色（棒・ドット）は vivid 色のため inline fill で良い（テーマ非依存）。

### フォント

`FONT_FAMILY = "'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', sans-serif"`
全チャートで統一。ウェブフォント読み込みなし。

### 数値の桁揃え（2026-07-31 確定・決定的ガードあり）

**小数桁は 1 つの値では決まらず、データセット全体で決まる。** 同じ図の中に `60.4` があるなら
`44` は `44.0` と表示しないと読み比べられない。値ごとに整形している限り揃わないので、
**描画の前にデータセット全体から 1 度だけ解決**する。

```ts
import {
  resolveValuePrecision,
  formatValueWithPrecision,
} from '@stats47/utils';

const precision = resolveValuePrecision(values); // 図を描く前に 1 度だけ
const labels = values.map((v) => formatValueWithPrecision(v, precision));
```

| NG                                                      | なぜ                                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `toLocaleString("ja-JP", { maximumFractionDigits: 1 })` | **`44.0` は number では `44`** なので max 指定だけでは小数が消える。min とセットで指定する |
| `value.toLocaleString()` を素で呼ぶ                     | 桁数が制御されずデータセット内で揃わない                                                   |
| 呼び出し側で桁数を `1` に決め打ち                       | 整数だけの指標（人口など）に余計な `.0` が付く                                             |

- 実体は `@stats47/utils`（`resolveValuePrecision` / `formatValueWithPrecision`）に **1 つだけ**置く。
  svg-builder の `shared/axis.ts` と apps/web ランキングはそこを re-export / import する。
- **例外**: 率・倍率・偏差値・変化率など、その場で意味が閉じる派生値はデータセットの桁数と無関係。
- ガード: `node .claude/scripts/lib/check-value-format.cjs --baseline`
  （pre-commit + `pr-quality-check.yml`）。既存違反は baseline に固定し、新規混入だけを止める
  （baseline は縮小専用）。派生値の汎用フォーマッタは意図が呼び出し元にしかなく行の近傍から
  機械的に判別できないため、キーワード推測ではなく baseline で扱う。

---

## 4. ファイル命名規則

### データ JSON（`data/*.json`）

**canonical サフィックス**（新規は必ずこれを使う）と、実データに頻出する **alias**（既存の許容形・CLI が同型にディスパッチ）を併記する。

| canonical                 | alias（実出現）                                                                                        | 対応チャート関数            |
| ------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------- |
| `*-ranking.json`          | `*-prefecture-rankings` / `*-top5-bottom5` / `*-top-bottom` / `*-rate-ranking` / `*-income-ranking` 等 | `generateBarChartSvg`       |
| `*-scatter.json`          | `*-rate-scatter` 等                                                                                    | `generateScatterSvg`        |
| `*-map.json`              | `*-tile-grid` / `*-tilemap` / `*-income-map` / `*-ratio-map` 等                                        | `generateChoroplethSvg`     |
| `*-timeseries.json`       | `*-trend` / `*-national-trend` 等                                                                      | `generateLineSvg`           |
| `*-stacked.json`          | `*-breakdown` / `*-composition` 等                                                                     | `generateStackedBarSvg`     |
| `*-summary-findings.json` | `*-findings` 等                                                                                        | `generateFindingsCardSvg` ★ |

> **alias の扱い**: `generate-article-charts.ts` の型判定（`classifyChartType`）が alias を canonical 関数にディスパッチする。
> alias は「既存資産の許容」であり、**新規記事は canonical を使う**こと。`inline-chart-N` / `chart-1` のような
> **無意味名は禁止**（型が判別不能・監査で F 違反）。

### 出力 SVG（`data/*.svg`）

```
{json-basename-without-extension}.svg
```

例: `mortality-prefecture-rankings.json` → `mortality-prefecture-rankings.svg`

### プロベナンスコメント（必須）

全 SVG の**冒頭**に埋め込む（`generate-article-charts.ts` が `provenance + svg` で前置する。
以前この節は「末尾」と書いていたが実装は一貫して冒頭で、記述の方が誤りだった）:

```svg
<!-- data-source: mortality-prefecture-rankings.json | generated: 2026-06-17T10:00:00.000Z -->
```

**再生成の byte 比較からはこの行を外す**（2026-08-12）。`generated` は実行のたびに変わるので、
生バイトで比べると**内容が同一でも必ず「不一致」**になる。実測では公開 78 散布図のうち
provenance 付き 9 枚だけが恒久的に rerender 判定になっており、日次 cron
(`blog-remediation-daily.yml`) がそれを上書きすると **provenance が消えて劣化する**構図だった
（gate の役目は「点や軸が変わったか」= 内容ドリフトの検出なので metadata は比較対象外）。

扱いは `.claude/scripts/lib/svg-provenance.mjs` に一本化する（`stripProvenance` /
`sameSvgContent` / `withProvenance`）。テスト `__tests__/svg-provenance.test.mjs` が
①provenance 差は無視 ②**内容差は必ず検出**（座標・点数・キャンバス・色）の両方向を固定する
— ①だけ入れると「全部 already-canonical」を返す無検査 gate に化けるため。

---

## 5. viewBox 規格

幅は型ごとに固定し、高さのみデータ件数で可変にする（現状 viewBox が断片化しているため標準幅に収斂させる）。
「実出現の最頻」は 611 枚集計（2026-06-17）の最頻 viewBox。新規は **標準幅** 列に揃える。

| チャート種                               | 標準幅 | 高さ                     | 実出現の最頻                                       |
| ---------------------------------------- | ------ | ------------------------ | -------------------------------------------------- |
| ランキング横長（columns・ブログ/X）      | `960`  | `404`（上位5+下位5固定） | カード型2列（aging-solo / alcohol スタイル）       |
| ランキング縦長（portrait・IG `-ig.svg`） | `1080` | `1350`（4:5固定）        | 縦長スタック（上位5↓下位5）                        |
| ランキング（single・1列）                | `680`  | 可変（1行 ~30px）        | `680×300`（95枚）                                  |
| 散布図（scatter）                        | `720`  | `720`                    | `960×624`（80枚、旧形式）                          |
| タイルマップ（map）                      | `720`  | `720`                    | `720×720`（2026-07-31 改訂。旧 780×560 / 600×700） |
| 要点カード（findings）                   | `960`  | 可変（要点数 × ~80px）   | `960×478`（26枚）                                  |
| 折れ線（timeseries）                     | `680`  | `420`                    | `680×420`（19枚）                                  |
| 積み上げ棒（stacked）                    | `680`  | 可変                     | `680×420`                                          |

`width` と `height` 属性は viewBox と必ず一致させる（svg-lint が検査）。
**svg-builder の各チャートは §5 標準幅に収斂済**: bar single=680（width/height も 680 に一致、旧 DISPLAY_W=780 スケーリングは廃止）/ **ランキングカード 横長columns=960×404・縦長portrait=1080×1350（2026-06-20）** / scatter=720×720（2026-08-02）/ map=720×720 / line=680×420 / stacked=680 / findings=960。新規生成は自動的にこの規格になる。
**標準幅から外れる既存 SVG は再生成で是正**（`regenerate-blog-svgs.yml`・§10 Step 4）。

---

## 6. 品質チェック（`svg-lint.mjs`）

`packages/svg-builder` の全出力は `.claude/scripts/lib/svg-lint.mjs` で検査。

**配線先 (2026-07-31 に公開前 gate へ拡張)**: `quality-gate.mjs`（pre-commit + publish-blog.yml で公開前
blocker）+ `audit-chart-quality.mjs`（バッチ）+ `generate-article-charts.ts --validate`。
従来 `lintSvgContent` はバッチと生成時にしか配線されておらず、**公開前 gate は SVG 本体の構造を
見ていなかった**。実測影響は公開済み 424 記事中 1 記事（0.2%）で、error はそのまま blocker に昇格できた。
dark mode 非対応 / theme 色 inline の 2 つは 140 枚該当のため warning のまま（再生成で解消する）。

加えて公開前 gate は SVG まわりで次の 2 つも見る（`quality-gate.mjs` 側の実装）:
**①参照先の実在** — `![](data/x.svg)` と書いてファイルが無ければ本番で画像切れになる。系譜 gate は
`.json`/`.source.json` しか見ておらず SVG 本体の欠落は誰も検査していなかった（実測 3 記事 / 8 枚）。
**②型を判別できる basename** — `chart-1` / `inline-chart-2` は §4 が禁止する無意味名で、型が
判定できないと再生成もサイズ検査もディスパッチできない（実測 19 枚）。suffix 規約全体の遵守は
既存負債 14.9% かつ `-quintile` 等の正当名を巻き込むため gate にせず critic の判断に委ねる。

| 重大度                    | チェック項目                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **error**                 | viewBox 未設定 / width・height 属性なし / 閉じタグなし / `<text>` に未解決のテンプレート値（undefined・NaN・[object Object]）/ **XML コメントの違法性**（本文に `--` を含む or 末尾が `-`。`<img>` は SVG を厳格 XML 解析するため broken image になる。相関 scatter のファイル名 `--` が典型・2026-08-13 追加）/ **カタログ別 非正規サイズ（統一済みカタログ）**                                                                                                                                                                                   |
| **warning**               | ダークモード非準拠（`svgThemeStyle()` なし） / テーマ色のインライン指定 / **カタログ別 非正規サイズ（未統一カタログ）**。※ **tile-grid はこの 2 つの warning を出さない**（仕様上テーマ非依存のため。`lintSvgContent(content, filename)` に filename を渡すと抑止される）                                                                                        |
| **error (json ペア検査)** | **choropleth 凡例の意味的ラベル誤用**（安全/危険 等が json `legendLabels` 明示なしに焼き込み）/ **findings の内容パリティ**（json の heading/text が SVG に未描画 = renderer の heading 脱落バグ再発防止）— `lintChoroplethLegend` / `lintFindingsParity`（2026-07-13 追加）。配線先 = `quality-gate.mjs`（公開前 blocker）+ `audit-chart-quality.mjs`（バッチ） |

### 6-2. タイルマップ品質 gate（`lintTileGridQuality` / 2026-07-29 追加・**2026-07-31 に 720×720 へ改訂**）

「プロジェクト内のタイルマップを全て同じ品質に保つ」ための決定的ゲート。旧デザインの残存を検出する。
配線先は `lintSvgSize` と同じ **`quality-gate.mjs`（公開前 blocker）+ `audit-chart-quality.mjs`（バッチ）**。

| #   | 不変量                                                  | 理由                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | キャンバス **720×720**（正方形）                        | 記事内は `md:max-w-2xl`=672px 幅の `<img>`。画面上の高さは `672×H/W` で決まる。780×560 は地図そのものが小さく県名と値が読めなかった（2026-07-31 の指摘）。正方形にして**地図を最大化**し、余る左上と右下にタイトル・上位3県・凡例を置く |
| 2   | **背景 rect を敷かない**（透過）                        | 不透明な地色はページの地色と食い違う。透過ならライト/ダーク双方に馴染む                                                                                                                                                                 |
| 3   | `prefers-color-scheme` を含まない                       | §3 の理由（OS とサイトのテーマが食い違うと SVG だけ反転する）                                                                                                                                                                           |
| 4   | `svg-*` テーマ class を使わない                         | 同上                                                                                                                                                                                                                                    |
| 5   | **凡例が右下**（グラデーションバーの座標で判定）        | 左上は上位3県リストが使う                                                                                                                                                                                                               |
| 6   | 上位3県のリストがある（タイル 3 枚以上のとき・warning） | 左上の空白を埋め、地図では読めない実数値を出す。**下位3県は出さない**（地図を最大化した分スペースが減り、上位だけの方が読みやすい）                                                                                                     |
| 7   | **旧見出し（高い順/低い順/多い順）が残っていない**      | 見出しを持たず「1. 宮崎県」の形で並べる。780×560 世代の確実な検出手段                                                                                                                                                                   |
| 8   | **テキストがキャンバス内に収まる**（2026-08-12 追加）   | 文字が切れて読めないのは明確な欠陥。判定は `findTextOverflows`（svg-lint）で、文字幅は svg-builder の `textUnits` と同じ半角 0.55em / 全角 1.0em で推定する                                                                              |

> **不変量 #8 を足した理由**: 2026-08-11 に凡例の右端ラベル「高い」が x=704 から左揃えで置かれ、
> CJK 2 文字（font-size 11 で約 22px）が 720 のキャンバスを **6px はみ出して切れていた**。
> **不変量 1–7 はどれもこれを検出できなかった** — 寸法・背景・配色・凡例の"位置"しか見ておらず、
> 「文字がどこまで伸びるか」を誰も測っていなかった。実測スクリプトを書いて初めて判明した。
> グリフの実測ではなく推定幅なので **2px の許容**を置き、「ラベルがまるごと切れる」級だけを
> error にする（1px 精度を追うと誤検知が出て、誤検知を出すゲートは運用で無効化される）。
> 右端ラベルは svg-builder 側で **実測幅ぶん内側に寄せる**（固定マージンだと
> `legendLabels` のカスタム値で再発する）。

#### ゲート自体の検証（2026-07-31 実測・★数値は実データ）

全 PASS は「ゲートが何も見ていない」状態と区別がつかないため、**両方向**を実測する。

| 検体                                                              | 実測                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 旧 2 世代前（600×700・`docs/21` の 2 検体）                       | **error 5 / 4**（キャンバス・背景 rect・prefers-color-scheme・svg-\* class・凡例位置） |
| 旧 1 世代前（780×560・**本番 R2 の実物**）                        | **error 2**（キャンバス + 旧見出し）— 不変量 #7 が本番集団を捉えることの確認           |
| 現行（720×720・svg-builder の実出力）                             | **error 0 / warning 0**                                                                |
| 再生成した実データ **85 枚**（`regenerate-tile-maps.ts` dry-run） | **error 0 / warning 0**・viewBox は全件 720×720                                        |

**母集団の実測（2026-07-31 dry-run）**: 公開記事 430 本 / タイルマップ **123 枚**。うち SSOT 照合
（`app/ranking/<key>/values.json` と旧 SVG の表示値を突合・一致率 ≥ 0.8）を通った **85 枚**を再生成し、
**38 枚は flag のまま**（記事内に `/ranking/<key>` 候補が無い 11 枚 + 候補はあるが値が一致しない 27 枚）。
flag は個別に metric→key を特定する必要があり、**SVG の絵から値を逆復元しない**（捏造防止）。

恒久テストは 2 本。`docs/21` は公開後に自動削除される ephemeral outbox なので、実ファイルに依存させない:

- `.claude/scripts/lib/__tests__/svg-lint.tile-grid.test.mjs` — 不変量ごとに 1 つだけ壊した合成検体で
  **ゲートの感度**を固定（mutation testing）。検査自体も検証済み（見出しチェックを 1 つ無効化すると落ちる）
- `packages/svg-builder/src/charts/__tests__/choropleth.gate.test.ts` — 生成器の**実出力**がゲートを通ることを
  固定（**配線**）。片方だけ更新すると「生成した瞬間に公開できない SVG」ができる

### カタログ別サイズ統一 gate（`lintSvgSize` / 2026-06-21 追加・★再発防止）

`lintSvgSize(filename, content)` が **filename→chartType→正規 viewBox 幅（§5）** を照合する。
新規記事・校正で非正規サイズの SVG が混入するのを公開前に止める（ranking が 760×532 / 960×624（旧10+10）等に
分裂していた事故の再発防止）。配線先＝**`quality-gate.mjs`（pre-commit + publish-blog.yml で発火）** と
`audit-chart-quality.mjs`（バッチ）。`classifyChartTypeFromName` で型判定。

| chartType              | 正規幅                        | 重大度    |
| ---------------------- | ----------------------------- | --------- |
| `bar`（ranking）       | 960（columns）/ 680（single） | **error** |
| `tile-grid`（tilemap） | 720                           | **error** |
| `summary`（findings）  | 960                           | **error** |
| `line`                 | 680                           | **error** |
| `scatter`              | 720                           | **error** |
| `stacked-bar`          | 680                           | **error** |

**全 6 カタログ統一完了（2026-06-21）→ 全て error**。both（json+source あり）の全 SVG が正規幅。
是正ツール: ranking=`rerender-ranking-columns.mts`（960×404 columns）/ scatter=`rerender-scatter-canonical.mts`（720×720・単色）。
いずれも既存検証済み json から svg-builder で再描画（値不変・サイズのみ正規化）。line/stacked は generateLineSvg/generateStackedBarSvg が固定幅 680 を出すため新規は自動的に正規。

> ★ R2 反映は **S3 API 経由（diff-push-r2）が確実**。`push-r2-wrangler`（wrangler put）は稀に「Upload complete」と言いつつ永続化しない flaky 挙動があり、S3 GET で検証すること（2026-06-21 scatter 統一時に発生）。
> **幅は不変量**（高さは件数/内容で可変）なので幅で判定する。分類不能名（`inline-chart-N` 等）は対象外。

バッチ監査: `.claude/scripts/blog/audit-chart-quality.mjs` で全記事を一括チェック（内容 lint + サイズ lint）。

### 6-3. 散布図品質・データ完全性 gate（2026-08-02 追加）

散布図は次の不変量を公開前 blocker として検査する。`quality-gate.mjs`、`audit-chart-quality.mjs`、
`generate-article-charts.ts --validate` に配線済み。

1. `lintScatterQuality`: キャンバスが **720×720**、実プロット領域も正方形
2. `lintScatterQuality`: 全点が `SCATTER_COLORS.mid` の単色で、地域別凡例を持たない
3. `lintScatterData`: 全点に有限数の x/y と都道府県ラベルがあり、識別子が重複しない
4. `lintScatterData`: 原則47点。除外時は `excludedAreas`・理由・期待点数を明示して相互一致させる
5. `lintScatterData`: 計算値は `source.json` に入力参照と `formula` を残す
6. `lintScatterParity`: data JSON の有効点数と SVG に描画された点数が一致する
7. `chart-provenance.mjs`: source manifest が既知 kind で再取得に必要な参照を持つ
8. JSON / source JSON の解析失敗はスキップせず blocker にする

公開後は `blog-remediation-daily.yml` の `rerender-scatter-canonical.mts --probe-only
--require-canonical --verify-sources` が全件を再生成して公開 SVG との完全一致を要求する。
既知7件は一次ソースから点集合も再計算する。ゲートの感度は
`.claude/scripts/lib/__tests__/svg-lint.scatter.test.mjs` と
`quality-gate.svg-gates.test.mjs`、生成器との配線は
`packages/svg-builder/src/charts/__tests__/scatter.gate.test.ts` で固定する。

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

611 枚の実測（2026-06-17 `.claude/scripts/blog/analyze-svg-patterns.mjs` 集計）から、**6 つの型に収斂する**ことが確定した。
実物の大半は svg-builder ではなく `generate-article-charts.ts` のインライン生成・旧スクリプト由来で、
命名・配色・viewBox・ダークモードが不統一。以下が是正ベースラインと共通化ロードマップ。

### 計測ベースライン（611枚）

| 指標                                | 実態                                                               | 目標                             |
| ----------------------------------- | ------------------------------------------------------------------ | -------------------------------- |
| 6 型への分類可能性                  | bar~239 / scatter~166 / map~84 / findings~54 / line~39 / stacked~5 | —                                |
| canonical 命名準拠                  | **34%**（404枚が alias/無意味名）                                  | 100%（新規）/ alias 許容（既存） |
| ダークモード対応（`svgThemeStyle`） | **21%**（482枚が未対応）                                           | 100%                             |
| viewBox の標準幅準拠                | 断片化（15+ パターン）                                             | 型ごとに標準幅へ収斂             |

### 共通化ロードマップ（優先度順）

1. ✅ **`generateFindingsCardSvg` を svg-builder に新設**（2026-06-17 完了）
   → `packages/svg-builder/src/charts/findings-card.ts` 実装済。`svgThemeStyle()` 準拠。`generate-article-charts.ts` に `summary` タイプのディスパッチ追加・alias 命名パターン対応済
2. ✅ **CLI のインライン生成器を svg-builder 呼び出しに置換**（`genBarChartSvg` 等 5 関数 → `@stats47/svg-builder`）（2026-06-17 完了）
   → `generate-article-charts.mjs` を `.ts` にリネームし tsx 実行に変更（tsx の ESM hook が `.mjs` entry の imported `.ts` を変換しないため）。5 つのインライン生成器を削除し svg-builder を直接 import する adapter に置換。`svgThemeStyle()` が全チャートに自動付与される。CI（`generate-article-charts.yml`）も `npx tsx` に更新。視覚変更（1列+セパレータ vs 旧2列）を伴うため既存 SVG の是正は Step 4 で dry-run 確認後に実施。
3. ✅ **`detectChartType` に alias ディスパッチを実装**（§4 alias 表を機械化）（2026-06-17 完了）
4. 🔄 **ダークモード未対応 SVG の再生成**（svg-builder 経由で一括再生成 → R2）
   → ワークフロー `regenerate-blog-svgs.yml` 追加済（2026-06-17）。R2 `app/blog` をダウンロード → 各 slug で `generate-article-charts.ts --base .local/r2/app/blog` を実行し data/_.json から _.svg を再生成（dark mode 自動付与）。**dry_run=true 既定**でギャラリー artifact を出力、本番 R2 push は `dry_run=false` 明示時のみ。`data/*.json` を持たない無意味名 SVG（inline-chart-N）は対象外で手動 brushup が必要。**実行には develop への配備 + workflow dispatch が必要**。まず dry-run でギャラリーを視覚確認してから本番反映する。
5. **viewBox 標準幅への収斂**（再生成時に §5 標準幅を適用）

> 進捗は是正のたびに本表の「実態」を更新する。再生成は CI（`regenerate-blog-svgs.yml` / `sync-snapshots.yml`）経由（ローカル R2 書き込み禁止）。

---

## 9. 変更履歴

| 日付       | 変更内容                                                                                                  |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| 2026-06-17 | 初版作成（svg-builder 全チャートをカタログ化・SSoT 確立）                                                 |
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

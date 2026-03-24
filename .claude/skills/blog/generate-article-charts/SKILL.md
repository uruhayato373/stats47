ブログ記事の `data/` ディレクトリにある JSON データから SVG チャートを生成し、記事の Markdown に埋め込む。

## 用途

- `/fetch-article-data` で取得した JSON からチャート SVG を生成したいとき
- 記事のチャートプレースホルダー（`<!-- chart:xxx -->`）を SVG 画像参照に差し替えたいとき

## 前提

- `docs/21_ブログ記事原稿/<slug>/data/` に JSON データファイルが配置済みであること
- 記事の `article.md` にチャート仕様（種類・軸・データソース）が記載されていること

## 引数

ユーザーから以下を確認すること:

- **articleSlug**: 記事スラッグ（必須）
- **チャート一覧**: 生成するチャートの名前・種類・使用データ

## 手順

### Phase 1: データ読み込み・チャート設計

1. `data/` ディレクトリの JSON を読み込み、データの範囲・件数を確認
2. 記事の `article.md` からチャートプレースホルダーの仕様を確認
3. 各チャートの軸範囲・スケール・色を設計

### Phase 2: SVG 生成スクリプト作成

4. 一時スクリプトを作成し、全チャートを一括生成:

```js
// scripts/temp-generate-charts.mjs
import fs from "fs";
import path from "path";

const dataDir = "docs/21_ブログ記事原稿/<SLUG>/data";
// JSON 読み込み
const data = JSON.parse(fs.readFileSync(path.join(dataDir, "national-timeseries.json"), "utf8"));
const pref = JSON.parse(fs.readFileSync(path.join(dataDir, "prefecture-rankings.json"), "utf8"));

// --- チャート生成関数をここに定義 ---

// --- 全チャート生成 ---
const charts = [
  { name: "chart-name", gen: () => genChartX() },
];
for (const c of charts) {
  const svg = c.gen();
  fs.writeFileSync(path.join(dataDir, `${c.name}.svg`), svg);
  console.log(`Generated: ${c.name}.svg (${(svg.length / 1024).toFixed(1)} KB)`);
}
```

```bash
node scripts/temp-generate-charts.mjs
```

### Phase 3: 記事への埋め込み

5. 記事内のチャートプレースホルダーを画像参照に差し替え:

```markdown
<!-- 変更前 -->
<!-- chart:chart-name -->
**[チャート: ...]**
- 種類: ...
- ...

<!-- 変更後 -->
![チャートの説明](data/chart-name.svg)

> 出典：[e-Stat ...](URL)　年度
```

6. データ取得方針メモ（`> [!NOTE]` の「データ取得方針:」）も取得済みに更新

### Phase 4: 検証・後処理

7. 生成 SVG をブラウザで目視確認（`open data/xxx.svg`）
8. 記事本文中の数値がチャートの実データと一致するか確認し、乖離があれば更新
9. 一時スクリプトを削除

## SVG 規約

### 共通属性

```xml
<svg width="780" height="..." xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {logicalW} {logicalH}"
     font-family="'Hiragino Sans','Noto Sans JP',sans-serif"
     role="img" aria-label="チャートタイトル">
  <rect width="{logicalW}" height="{logicalH}" fill="#fafafa" rx="8"/>
  ...
</svg>
```

| 属性 | 値 |
|---|---|
| `width`/`height` | **`viewBox` の幅・高さと一致させること**（不一致だと `preserveAspectRatio` で左右に余白ができる） |
| `viewBox` | 論理座標。バー: `0 0 680 480`, 折れ線: `0 0 680 400〜460`, 散布図: `0 0 560 560`, タイルグリッド: `0 0 600 665〜700` |
| `rx` | バー/折れ線: `8`, タイルグリッド: なし |
| `font-family` | `'Hiragino Sans','Noto Sans JP',sans-serif`（タイルグリッド内テキストは `'Noto Sans JP',sans-serif`） |

### タイトル・サブタイトル

```xml
<text x="{W/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">タイトル</text>
<text x="{W/2}" y="46" text-anchor="middle" font-size="10" fill="#888">サブタイトル（任意。出典・データソース名・年度はSVGに含めず、md側の <data-source> で記載する。全国平均/男女別などチャート固有の補足のみ記載可）</text>
```

### 色パレット

| 用途 | 色 |
|---|---|
| タイトル | `#333` |
| サブタイトル・二次テキスト | `#888` |
| 軸ラベル・目盛り | `#6b7280` |
| グリッド線 | `#e5e7eb`（`stroke-dasharray="3,3"` or なし） |
| 軸線 | `#999` |
| プロット背景 | `#f9fafb`（`stroke="#d1d5db"`） |
| 全体背景 | `#fafafa` |

**データ色:**

| 系統 | 色例 |
|---|---|
| 青（男性・出生） | `#90caf9` → `#42a5f5` → `#1565c0` |
| 赤（女性・死亡） | `#ef9a9a` → `#ef5350` → `#b71c1c` |
| 緑（正・増加） | `#a5d6a7` → `#2e7d32` |
| 散布図ドット | `fill="#6b8fc9" fill-opacity="0.8" stroke="#3b6fa0"` |
| 平均線 | `stroke="#9ca3af" stroke-dasharray="4,3" opacity="0.6"` |

**コロプレスマップ（段階色）:**

指標の性質に応じて色スキームを選択すること:

| スキーム | 使い分け | 色例 |
|---|---|---|
| 順次（Sequential） | 値が一方向に増減する指標（人口、比率、金額など大半の指標） | 下記参照 |
| 発散（Diverging） | 中心値に意味がある指標（前年比増減、偏差、全国平均との差など） | 下記参照 |

**順次スキーム（最もよく使う）:**
```
オレンジ→赤: ["#fff3e0", "#ffe0b2", "#ffcc80", "#ff9800", "#e65100", "#bf360c"]  ← デフォルト推奨
青系:       ["#e3f2fd", "#bbdefb", "#90caf9", "#42a5f5", "#1565c0", "#0d47a1"]
緑系:       ["#e8f5e9", "#c8e6c9", "#a5d6a7", "#66bb6a", "#2e7d32", "#1b5e20"]
```

**発散スキーム（中心値がある場合のみ）:**
```
赤←→青:    ["#b71c1c", "#e53935", "#ff8a65", "#fff176", "#90caf9", "#1565c0"]
赤←→緑:    ["#b71c1c", "#e53935", "#ff8a65", "#fff176", "#a5d6a7", "#2e7d32"]
```

### チャート種別テンプレート

#### 上位10・下位10ランキング（2カラム）

「上位10・下位10」を表示するランキングチャートは **必ずこの2カラムレイアウトを使う**。1カラムの横棒チャートは使わない。

- viewBox: `0 0 960 624`（固定）
- 左カラム（青系）: 上位10（値が大きい方）
- 右カラム（赤系）: 下位10（値が小さい方）
- 各行: 順位円 + 都道府県名 + 値テキスト + 横バー
- 行背景は白と薄い色を交互に（上位: `#e3f2fd`/`#fff`、下位: `#fef2f2`/`#fff`）

構造:
```xml
<svg width="960" height="624" viewBox="0 0 960 624" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{タイトル}">
  <title>{タイトル}</title>
  <rect width="960" height="624" fill="#f9fafb"/>
  <text x="480" y="38" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="20" font-weight="bold" fill="#1f2937">{タイトル}</text>
  <text x="480" y="60" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="13" fill="#6b7280">上位10・下位10</text>

  <!-- 左カラム: 上位10 -->
  <rect x="30" y="80" width="432" height="40" rx="8" fill="{headerColor}"/>
  <text x="246" y="106" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="15" font-weight="bold" fill="#ffffff">{上位ラベル}</text>
  <!-- 各行 i=0..9: y = 124 + 44*i -->
  <rect x="30" y="{rowY}" width="432" height="44" rx="6" fill="{交互色}"/>
  <circle cx="60" cy="{rowY+22}" r="14" fill="{headerColor}"/>
  <text x="60" y="{rowY+26.32}" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="12" font-weight="bold" fill="#ffffff">{順位}</text>
  <text x="84" y="{rowY+26.68}" font-family="'Noto Sans JP',sans-serif" font-size="13" font-weight="bold" fill="#1f2937">{県名}</text>
  <text x="229.68" y="{rowY+26.32}" text-anchor="end" font-family="'Noto Sans JP',sans-serif" font-size="12" fill="{headerColor}" font-weight="600">{値}{単位}</text>
  <rect x="241.68" y="{rowY+15}" width="{barW}" height="14" rx="4" fill="{barColor}" opacity="0.8"/>

  <!-- 右カラム: 下位10（x を +468 シフト） -->
  <rect x="498" y="80" width="432" height="40" rx="8" fill="#b71c1c"/>
  ...同様の構造...

  <!-- フッター -->
  <text x="480" y="594" text-anchor="middle" font-family="'Noto Sans JP',sans-serif" font-size="11" fill="#6b7280">{補足テキスト}</text>
</svg>
```

色の使い分け:
| 指標の性質 | 上位ヘッダー | 上位バー | 下位ヘッダー | 下位バー |
|---|---|---|---|---|
| 多い方がポジティブ（収入・経済指標） | `#1565c0` | `#42a5f5` | `#b71c1c` | `#ef5350` |
| 多い方がポジティブ（財政・行政） | `#2e7d32` | `#66bb6a` | `#b71c1c` | `#ef5350` |
| 中立的（人口・面積など） | `#1565c0` | `#42a5f5` | `#b71c1c` | `#ef5350` |

バー幅の計算: `barW = (value / maxValue) * maxBarWidth`（maxBarWidth は約200px）

参考実装: `.local/r2/blog/fiscal-strength-ranking/data/fiscal-strength-ranking.svg`

#### 折れ線グラフ

```xml
<!-- プロット領域 -->
<rect x="{ml}" y="{mt}" width="{pw}" height="{ph}" fill="#f9fafb" stroke="#d1d5db"/>
<!-- グリッド -->
<line x1="{ml}" y1="{y}" x2="{ml+pw}" y2="{y}" stroke="#e5e7eb" stroke-width="0.5"/>
<!-- 折れ線 -->
<polyline points="x1,y1 x2,y2 ..." fill="none" stroke="{color}" stroke-width="2.5" stroke-linejoin="round"/>
<!-- データ点（始点・終点・注目点のみ） -->
<circle cx="{x}" cy="{y}" r="3.5" fill="#fff" stroke="{color}" stroke-width="2"/>
```

**X軸単位ラベル（時系列チャート共通ルール）**:
- 時系列の X 軸の**最後のラベル**に `年` または `年度` を付ける（例: `2020` → `2020年`）
- e-Stat データの時間軸メタデータから「年」か「年度」かを判定する
- 別要素で `（年）` を追加するとはみ出すため、最後のラベルのテキスト自体に含める

### 凡例

凡例は**チャート下部の中央揃え**で統一する。**上部やプロットエリア内に凡例を置いてはいけない。** viewBox の高さを凡例分（+20〜24px）拡張してスペースを確保すること。X軸ラベルと凡例の間隔は**20px以上**確保する（X軸ラベル y=388 なら凡例 y=410 程度）。

```xml
<!-- 凡例（中央揃え）: 全体幅を計算して x を調整 -->
<!-- 例: 2系列、各系列=線20px+gap4px+テキスト幅、系列間gap=20px -->
<!-- legendW = (20+4+textW1) + 20 + (20+4+textW2) -->
<!-- startX = (viewBoxW - legendW) / 2 -->
<line x1="{startX}" y1="{ly}" x2="{startX+20}" y2="{ly}" stroke="{color1}" stroke-width="2.5"/>
<text x="{startX+24}" y="{ly+4}" font-size="11" fill="{color1}">系列1</text>
<line x1="{startX+item1W+20}" y1="{ly}" x2="{startX+item1W+40}" y2="{ly}" stroke="{color2}" stroke-width="2.5"/>
<text x="{startX+item1W+44}" y="{ly+4}" font-size="11" fill="{color2}">系列2</text>
```

- 散布図でドット色が地方ブロック別の場合、凡例は2〜3行に分けてもよい
- 凡例が1系列のみの場合は省略可（タイトルで自明な場合）

#### タイルグリッドマップ

**重要**: タイルグリッドの配置は `packages/visualization/src/d3/constants/tile-grid-layout.ts` の `TILE_GRID_LAYOUT` が**唯一の正（canonical source）**。ハードコードした座標を使わず、以下のグリッド定義から計算すること。

```js
// --- 正規レイアウト定義（tile-grid-layout.ts と同一） ---
// { id: 都道府県コード, name: 短名, x: グリッドX, y: グリッドY, w?: 幅(default 1), h?: 高さ(default 1) }
const TILE_GRID_LAYOUT = [
  { id:1,  name:"北海道", x:12, y:0,  w:2, h:2 },
  { id:2,  name:"青森",   x:12, y:3,  w:2 },
  { id:3,  name:"岩手",   x:13, y:4 },
  { id:5,  name:"秋田",   x:12, y:4 },
  { id:4,  name:"宮城",   x:13, y:5 },
  { id:6,  name:"山形",   x:12, y:5 },
  { id:7,  name:"福島",   x:12, y:6,  w:2 },
  { id:15, name:"新潟",   x:10, y:6,  w:2 },
  { id:16, name:"富山",   x:9,  y:6 },
  { id:17, name:"石川",   x:8,  y:6 },
  { id:18, name:"福井",   x:8,  y:7 },
  { id:21, name:"岐阜",   x:9,  y:7,  h:2 },
  { id:20, name:"長野",   x:10, y:7,  h:2 },
  { id:10, name:"群馬",   x:11, y:7 },
  { id:9,  name:"栃木",   x:12, y:7 },
  { id:8,  name:"茨城",   x:13, y:7 },
  { id:19, name:"山梨",   x:11, y:8 },
  { id:11, name:"埼玉",   x:12, y:8 },
  { id:12, name:"千葉",   x:13, y:8,  h:2 },
  { id:13, name:"東京",   x:12, y:9 },
  { id:14, name:"神奈川", x:12, y:10 },
  { id:22, name:"静岡",   x:10, y:9,  w:2 },
  { id:23, name:"愛知",   x:9,  y:9 },
  { id:25, name:"滋賀",   x:8,  y:8 },
  { id:24, name:"三重",   x:8,  y:9,  h:2 },
  { id:26, name:"京都",   x:6,  y:8,  w:2 },
  { id:28, name:"兵庫",   x:5,  y:8,  h:2 },
  { id:27, name:"大阪",   x:6,  y:9 },
  { id:29, name:"奈良",   x:7,  y:9 },
  { id:30, name:"和歌山", x:6,  y:10, w:2 },
  { id:31, name:"鳥取",   x:4,  y:8 },
  { id:33, name:"岡山",   x:4,  y:9 },
  { id:32, name:"島根",   x:3,  y:8 },
  { id:34, name:"広島",   x:3,  y:9 },
  { id:35, name:"山口",   x:2,  y:8,  h:2 },
  { id:38, name:"愛媛",   x:3,  y:11 },
  { id:37, name:"香川",   x:4,  y:11 },
  { id:39, name:"高知",   x:3,  y:12 },
  { id:36, name:"徳島",   x:4,  y:12 },
  { id:40, name:"福岡",   x:1,  y:10 },
  { id:41, name:"佐賀",   x:0,  y:10 },
  { id:44, name:"大分",   x:1,  y:11 },
  { id:42, name:"長崎",   x:0,  y:11 },
  { id:45, name:"宮崎",   x:1,  y:12 },
  { id:43, name:"熊本",   x:0,  y:12 },
  { id:46, name:"鹿児島", x:0,  y:13, w:2 },
  { id:47, name:"沖縄",   x:0,  y:15 },
];

// --- グリッド座標 → ピクセル座標 変換 ---
const BASE_X = 35, BASE_Y = 45, PITCH = 38, CELL = 36, GAP = 2;

const tileGrid = TILE_GRID_LAYOUT.map(c => ({
  id: c.id,
  name: c.name,
  x: BASE_X + c.x * PITCH,
  y: BASE_Y + c.y * PITCH,
  w: ((c.w || 1) * PITCH) - GAP,
  h: ((c.h || 1) * PITCH) - GAP,
}));
```

> **絶対にやってはいけないこと**: tileGrid の座標を手入力・推測で書くこと。必ず上記の `TILE_GRID_LAYOUT` + 変換式を使うこと。

各タイルの構造:
```xml
<g aria-label="{短名} {値}{単位}">
  <title>{正式名}：{値}{単位}</title>
  <rect x="{x}" y="{y}" width="{w}" height="{h}" rx="3" fill="{色}" stroke="#ffffff" stroke-width="1"/>
  <text font-family="'Noto Sans JP',sans-serif" fill="{テキスト色}" text-anchor="middle">
    <tspan x="{cx}" y="{cy-2}" font-size="{7-9}" font-weight="700">{短名}</tspan>
    <tspan x="{cx}" y="{cy+11}" font-size="7">{値}</tspan>
  </text>
</g>
```

テキスト色の自動判定: 背景の明度 `(R*0.299 + G*0.587 + B*0.114)` > 150 なら `#374151`、それ以外は `#ffffff`。

#### 散布図

```xml
<rect x="{ml}" y="{mt}" width="{pw}" height="{ph}" fill="#f9fafb" stroke="#d1d5db"/>
<!-- 平均線（4象限分割） -->
<line ... stroke="#9ca3af" stroke-dasharray="4,3" opacity="0.6"/>
<!-- ドット -->
<circle cx="{x}" cy="{y}" r="4.5" fill="{地方色}" fill-opacity="0.75" stroke="#fff" stroke-width="1">
  <title>{県名}：X={xVal} Y={yVal}</title>
</circle>
<!-- 注目県のラベル -->
<text ... font-size="8" fill="#374151">{短名}</text>
<!-- X軸ラベル（指標名＋年度） -->
<text x="{cx}" y="{mt+ph+45}" text-anchor="middle" font-size="10" fill="#6b7280">指標名（2020年）</text>
<!-- Y軸ラベル（指標名＋年度、回転） -->
<text x="{ml-40}" y="{cy}" text-anchor="middle" font-size="10" fill="#6b7280" transform="rotate(-90,{ml-40},{cy})">指標名（2023年）</text>
```

**散布図の軸ラベル（必須ルール）**:
- X軸・Y軸の両方に「指標名（年度）」形式のラベルを必ず付ける
- 散布図は2つの異なるデータを組み合わせるため、年次が異なることが多い。軸ラベルで明示する
- viewBox の高さを +20px 程度拡張して X軸ラベルのスペースを確保する

**散布図の凡例（共通ルール）**:
- 凡例は必ず **下側中央** に配置する（上部やプロットエリア内に置かない）
- viewBox の高さを凡例分（+24px）拡張してスペースを確保する
- `svg-builder` の `generateScatterSvg` を使う場合: `colorByRegion: true` で自動配置される
- 手書き SVG の場合: X軸ラベルの下、SVG 下端から 14px 上に横並びで中央揃え

地方ブロック色:
```
北海道・東北: #42a5f5    関東: #66bb6a    中部: #fdd835
近畿: #ffa726            中国・四国: #ef5350    九州・沖縄: #ab47bc
```

`svg-builder` での使い方:
```ts
import { generateScatterSvg, REGION_BLOCKS } from "@stats47/svg-builder";

// 標準6ブロック色分け + 下部中央凡例
const svg = generateScatterSvg(points, {
  title: "...",
  xLabel: "...",
  yLabel: "...",
  colorByRegion: true,         // REGION_BLOCKS を使用
  // colorByRegion: REGION_BLOCKS, // 同じ結果（カスタム定義も可）
});
```

#### コンボチャート（棒+折れ線）

左軸（棒）と右軸（折れ線）を持つ二軸チャート:
```xml
<!-- 左軸 -->
<line x1="{ml}" y1="{mt}" x2="{ml}" y2="{mt+ph}" stroke="#999"/>
<!-- 右軸 -->
<line x1="{W-mr}" y1="{mt}" x2="{W-mr}" y2="{mt+ph}" stroke="#999"/>
<!-- 棒グラフ（2系列を並べる） -->
<rect x="{x-barW}" ... fill="#4a90d9" rx="1" opacity="0.85"/>  <!-- 左棒 -->
<rect x="{x}" ... fill="#e05a46" rx="1" opacity="0.85"/>       <!-- 右棒 -->
<!-- 折れ線（右軸スケール） -->
<polyline ... stroke="#2e7d32" stroke-width="2.5"/>
<!-- X軸: 最後のラベルに「年」/「年度」を含める -->
```

#### まとめ表（ファインディング）

記事末尾の「まとめ」セクション用。文章で結論を記述した後に配置する。

- md 側のテーブル（`| # | ... |`）の代わりに SVG で視覚的に表現
- ミニチャートは不要（数値は記事本文やチャートで既に読み取れる）。結論テキストのみ
- 各行は「番号（色付き円）＋太字タイトル＋説明文」の2行構成
- 行の背景色は白と `#f9fafb` を交互に

```markdown
<!-- まとめセクションの構成（①導入文 → ②SVG → ③考察文） -->
## まとめ

（SVGへの導入文。1〜2文で簡潔に）

![この記事でわかったこと](data/xxx-summary-findings.svg)

（まとめの考察・結論を記述）
```

```xml
<svg width="960" height="{80*行数+78}" viewBox="0 0 960 {80*行数+78}" ...>
  <rect width="960" height="{H}" fill="#f9fafb"/>
  <text x="480" y="48" text-anchor="middle" font-size="26" font-weight="bold" fill="#1f2937">この記事でわかったこと</text>

  <!-- 各行: y = 78 + 80*i -->
  <rect x="50" y="{rowY}" width="860" height="80" fill="{白 or #f9fafb 交互}" rx="8"/>
  <circle cx="94" cy="{rowY+40}" r="20" fill="{行ごとの色}"/>
  <text x="94" y="{rowY+47}" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">{番号}</text>
  <text x="130" y="{rowY+32}" font-size="18" font-weight="bold" fill="#1f2937">{タイトル}</text>
  <text x="130" y="{rowY+58}" font-size="16" fill="#4b5563">{説明文}</text>
</svg>
```

番号円の色パレット（5行の場合）: `#dc2626`, `#ea580c`, `#0284c7`, `#7c3aed`, `#059669`

### 都道府県名のマッピング

JSON の `areaName`（例: `東京都`）からタイルグリッドの短名（例: `東京`）へ変換が必要:

```js
const prefShortName = {
  "北海道": "北海道", "青森県": "青森", "岩手県": "岩手", "宮城県": "宮城", "秋田県": "秋田",
  "山形県": "山形", "福島県": "福島", "茨城県": "茨城", "栃木県": "栃木", "群馬県": "群馬",
  "埼玉県": "埼玉", "千葉県": "千葉", "東京都": "東京", "神奈川県": "神奈川", "新潟県": "新潟",
  "富山県": "富山", "石川県": "石川", "福井県": "福井", "山梨県": "山梨", "長野県": "長野",
  "岐阜県": "岐阜", "静岡県": "静岡", "愛知県": "愛知", "三重県": "三重", "滋賀県": "滋賀",
  "京都府": "京都", "大阪府": "大阪", "兵庫県": "兵庫", "奈良県": "奈良", "和歌山県": "和歌山",
  "鳥取県": "鳥取", "島根県": "島根", "岡山県": "岡山", "広島県": "広島", "山口県": "山口",
  "徳島県": "徳島", "香川県": "香川", "愛媛県": "愛媛", "高知県": "高知", "福岡県": "福岡",
  "佐賀県": "佐賀", "長崎県": "長崎", "熊本県": "熊本", "大分県": "大分", "宮崎県": "宮崎",
  "鹿児島県": "鹿児島", "沖縄県": "沖縄"
};
```

## ユーティリティ関数

### 色補間

```js
function hexToRgb(h) {
  const v = parseInt(h.replace("#", ""), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(c => Math.round(c).toString(16).padStart(2, "0")).join("");
}
function colorInterp(colors, t) {
  t = Math.max(0, Math.min(1, t));
  const idx = t * (colors.length - 1);
  const lo = Math.floor(idx), hi = Math.min(lo + 1, colors.length - 1);
  const f = idx - lo;
  const a = hexToRgb(colors[lo]), b = hexToRgb(colors[hi]);
  return rgbToHex(a[0]+(b[0]-a[0])*f, a[1]+(b[1]-a[1])*f, a[2]+(b[2]-a[2])*f);
}
```

## ランキング表のバースケール

ランキング表の横バーは、データ値の範囲が狭い場合（例: 全県が39〜52%に集中）、0起点だとバーの差が視認しにくい。

**ベースライン調整ルール**:
- データ範囲が広い場合（最小値が最大値の50%以下）: 0起点で `maxBarValue` を設定
- データ範囲が狭い場合（最小値が最大値の70%以上）: ベースラインを設定して差を強調
  - `baseline`: 最小値より少し低い切りの良い値（例: 最小39.3%なら baseline=35）
  - `maxBarValue`: 最大値より少し高い切りの良い値（例: 最大51.8%なら maxBarValue=55）
  - バー幅 = `(value - baseline) / (maxBarValue - baseline) * barAreaWidth`

## 注意

- **記事内の数値更新**: SVG 生成後、記事本文中の数値が実データと一致するか必ず確認する。古いデータで書かれた下書きの数値は新しいデータに更新すること
- **一時スクリプト**: 生成完了後に必ず削除する
- **SVG サイズ**: 1 ファイル 30KB 以下を目安とする。大きくなりすぎる場合はデータ点を間引く

## 関連スキル

- `/fetch-article-data` — チャート用データの一括取得（このスキルの前に使用）
- `/md-syntax` — 記事内で使えるマークダウン記法一覧

---
title: "1つの県をレーダーチャートで多角的に｜複数指標の正規化を Claude Code に頼む"
seoTitle: "[2026]レーダーチャート｜Claude Codeで複数指標を都道府県別に正規化"
subtitle: "Claude Code 未経験エンジニアのための実例集 Part 9"
slug: cc-estat-09-radar-prefecture
description: "人口・所得・教育費など複数指標を 1 つの県のレーダーチャートに集約。単位が異なる指標を Claude Code に正規化させるレシピ。"
category: ict
tags:
  - ClaudeCode
  - e-Stat
  - レーダーチャート
  - 正規化
  - D3
publishedAt: 2026-05-17
updatedAt: 2026-05-17
published: true
ogImage: /blog/cc-estat-09-radar-prefecture/og.png
---

棒グラフは「1 指標を 47 県で比べる」のが得意でした（Part 3）。ヒートマップは「2 軸 × 時間」を 1 枚に圧縮するのが得意でした（[Part 4: 高齢化率ヒートマップ](https://stats47.jp/blog/cc-estat-04-aging-heatmap)）。コロプレスは「空間分布」を、散布図は「2 変数の関係」を得意としていました（Part 5・[Part 6: 県民所得 × 大学進学率の散布図](https://stats47.jp/blog/cc-estat-06-income-scatter)）。

ではこんな問いに、どのチャートで答えるべきでしょう。

> **「東京都って結局どんな県なの？ 全国と比べて、何が強くて何が弱い？」**

棒グラフを 6 枚並べるのは情報の物量で殴る感じで、読み手はすぐ疲れます。テーブルは数字が並ぶだけで「形」が見えません。ここで効くのが **レーダーチャート** です。1 つの県の特性を 1 枚の多角形で表現し、形の歪み方で「県のキャラクター」を瞬時に伝えられます。

ただしレーダーには 1 つだけ重い宿題があります。**軸ごとに単位が違う指標を、同じスケールに揃える「正規化」** です。人口（人）、所得（円）、教育費（円/世帯）、医療費（円/人）、犯罪率（件/千人）、観光客数（人）——単位も桁数もバラバラ。これを 0〜1 にスケールしないと多角形が「ほぼ 1 軸だけ突き出した針」になります。

本記事では、Claude Code に **6 指標 × 47 都道府県のデータを並列取得 → min-max 正規化 → D3 でレーダー描画** までを依頼します。Part 9 のゴールは、東京都と京都府の 2 県を 1 枚のレーダーで重ね描きして「東京と京都ってこんなに性格が違うんだ」と言える状態です。所要時間 90 分。コードは Claude Code が書きます。連載の基礎（環境構築や e-Stat の叩き方）から確認したい方は、[Claude Code で 47 都道府県分析を自動化する総合ガイド](https://stats47.jp/blog/ai-claude-code-pref-analysis) を先に読むと流れがつかめます。

## 使う指標と「県の多角的プロフィール」設計

レーダーチャートで一番悩むのが軸の選定です。軸が多すぎる（10 以上）と見づらく、少なすぎる（3 軸以下）と三角形ばかりで個性が出ません。経験則として **5〜8 軸が読める上限** です。

今回は「県の暮らしと経済」を多角的に捉える 6 軸で設計します。それぞれの軸の「元データ・単位・方向（外側 = 良い に揃えるための向き）」は次のとおりです。

- **人口規模**（人口推計、単位: 人）— 中立な規模指標。高い・低いに優劣はありません
- **県民所得**（県民経済計算、単位: 千円/人）— 高い方が良い指標
- **教育費**（家計調査、単位: 円/世帯）— 高い方が良い指標
- **医療費**（国民医療費、単位: 千円/人）— **低い方が良い**ため正規化時に反転が必要
- **犯罪率**（犯罪統計、単位: 件/千人）— **低い方が良い**ため正規化時に反転が必要
- **観光客数**（観光入込客統計、単位: 千人/年）— 高い方が良い指標

ここに **重要なポイント** が 2 つあります。

第一に、**指標方向の正負を統一する** こと。レーダーは「外側に張り出すほど良い」と直感的に読まれるチャートなので、医療費や犯罪率のような「低い方が良い」指標はそのままだと混乱します。正規化のときに **1 から引いて反転** させて、すべての軸を「外側が良い」に揃えます。

第二に、**桁数のレンジを揃える** こと。人口（百万単位）と犯罪率（10 件単位）を生値のまま重ねたら、人口軸だけが満点に張り付いて他軸が潰れます。これを解決するのが min-max 正規化です。具体的には次の式。

```text
x_normalized = (x - x_min) / (x_max - x_min)
```

47 都道府県の中での最小値を 0、最大値を 1 にする線形変換です。Claude Code に頼むときも「**全 47 県の中での min-max 正規化で 0〜1 にスケール、医療費と犯罪率は 1 から引いて反転**」と一文書けば、ロジックを書いてくれます。

この 6 軸が揃うと、東京都なら「人口規模・県民所得・教育費が外側に大きく張り出し、犯罪率（反転後）の軸だけ内側に深くえぐれる」という多角形が描けます。数値の羅列では伝わらない「県のキャラクター」が、1 枚の歪んだ形として立ち上がるわけです。

## Step 1: 6 つの statsDataId を取得 → Claude Code に並列リクエスト

まず 6 指標分の e-Stat 統計表 ID を集めます。連載 Part 2 で作った `/search-estat` スキルを使うと、Claude Code に対話的に頼めます。

```bash
claude
```

```
あなた: e-Stat で次の 6 指標について最新年の都道府県別データが取れる
       statsDataId を一覧で出して。
       1. 人口（人口推計）
       2. 1人当たり県民所得（県民経済計算）
       3. 1世帯当たり教育費（家計調査）
       4. 1人当たり国民医療費
       5. 刑法犯認知件数（犯罪統計）
       6. 観光入込客数（観光庁観光入込客統計）

Claude: /search-estat スキルで照会します...

       | # | 指標 | statsDataId | 最新年 | 補足 |
       |---|---|---|---|---|
       | 1 | 人口 | 0003448237 | 2024 | 人口推計 |
       | 2 | 県民所得 | 0003448900 | 2022 | 名目 |
       | 3 | 教育費（家計） | 0002070010 | 2024 | 二人以上世帯 |
       | 4 | 国民医療費 | 0003411652 | 2022 | 都道府県別 |
       | 5 | 刑法犯認知件数 | 0003445120 | 2024 | 警察庁集計 |
       | 6 | 観光入込客数 | 0003200200 | 2023 | 観光庁 |

       (※ statsDataId は架空例。実際は最新版を確認してください)
```

ID が揃ったら、6 リクエストを並列で投げます。Part 1 でも触れた **同時並列 5 本ルール**（e-Stat は 10 超で 503 が増える）を守るため、`p-limit` で concurrency=5 にします。

```bash
npm install p-limit
```

Claude Code に書かせるスクリプトはこんな雰囲気です。

```javascript
// fetch-six-indicators.mjs
import pLimit from "p-limit";
import fs from "node:fs/promises";

const APP_ID = process.env.ESTAT_APP_ID;
const TARGETS = [
  { key: "population", id: "0003448237", year: "2024" },
  { key: "income", id: "0003448900", year: "2022" },
  { key: "education", id: "0002070010", year: "2024" },
  { key: "medical", id: "0003411652", year: "2022" },
  { key: "crime", id: "0003445120", year: "2024" },
  { key: "tourism", id: "0003200200", year: "2023" },
];

const limit = pLimit(5);

async function fetchOne({ key, id, year }) {
  const url = new URL(
    "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"
  );
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("statsDataId", id);
  url.searchParams.set("limit", "5000");

  const res = await fetch(url).then((r) => r.json());
  const values = res.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE;
  const arr = Array.isArray(values) ? values : [values];

  // 47 都道府県 × 指定年だけに絞る
  const filtered = arr.filter(
    (v) => /^\d{2}000$/.test(v["@area"]) && v["@time"].startsWith(year)
  );

  return [
    key,
    Object.fromEntries(
      filtered.map((v) => [v["@area"], Number(v["$"])])
    ),
  ];
}

const results = await Promise.all(
  TARGETS.map((t) => limit(() => fetchOne(t)))
);

const merged = Object.fromEntries(results);
await fs.writeFile("six-indicators-raw.json", JSON.stringify(merged, null, 2));
console.log("✓ wrote six-indicators-raw.json");
```

実行するとこんな JSON が生まれます。

```json
{
  "population": {
    "01000": 5111000,
    "13000": 14086000,
    "26000": 2502000,
    "47000": 1457000
  },
  "income": {
    "01000": 2830,
    "13000": 5780,
    "26000": 3210,
    "47000": 2390
  },
  "education": {
    "01000": 9800,
    "13000": 24500,
    "26000": 18700,
    "47000": 7200
  }
}
```

> [!TIP]
> Claude Code に「6 つの JSON を 1 ファイルに merge して、トップレベル key は指標名にして」と頼めば、上の構造を勝手に組み立ててくれます。e-Stat の生 JSON は `GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE` のようにネストが深くて手で触ると辛い API ほど、整形を任せる効果が大きくなります。

ここまでで「**指標 × 都道府県 → 生値**」の dict が手元に揃いました。次が本記事の本丸、正規化です。

## Step 2: 全県のデータで min-max 正規化（0-1 にスケール）

正規化の式は冒頭で書いた通りシンプルです。**ただし「全 47 県の min/max」を使う** ことが重要。1 県だけのデータで正規化してしまうと、その県のなかでの最小最大に張り付いてしまい、全国比較になりません。

Claude Code に頼むときのプロンプトはこう。

```
あなた: six-indicators-raw.json を読み込んで、各指標について
       全 47 都道府県の min-max 正規化を実行して。
       ただし以下 2 指標は「低い方が良い」ので 1 から引いて反転して:
         - medical (国民医療費)
         - crime (刑法犯認知件数)
       出力は six-indicators-normalized.json に書き出して、
       各県 6 指標の 0〜1 値が並んだ構造にして。
```

返ってくるスクリプトはおおむねこんな感じになります。

```javascript
// normalize.mjs
import fs from "node:fs/promises";

const raw = JSON.parse(await fs.readFile("six-indicators-raw.json", "utf8"));

const INVERT = new Set(["medical", "crime"]); // 低い方が良い

const normalized = {};

for (const [indicator, values] of Object.entries(raw)) {
  const nums = Object.values(values);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min || 1; // ゼロ割防止

  for (const [area, v] of Object.entries(values)) {
    let n = (v - min) / range; // 0..1
    if (INVERT.has(indicator)) n = 1 - n; // 反転
    if (!normalized[area]) normalized[area] = {};
    normalized[area][indicator] = Number(n.toFixed(3));
  }
}

await fs.writeFile(
  "six-indicators-normalized.json",
  JSON.stringify(normalized, null, 2)
);
console.log("✓ wrote six-indicators-normalized.json");
```

出来上がる JSON は東京と京都を抜粋するとこんな感じ。

```json
{
  "13000": {
    "population": 1.000,
    "income": 1.000,
    "education": 0.920,
    "medical": 0.780,
    "crime": 0.230,
    "tourism": 0.860
  },
  "26000": {
    "population": 0.110,
    "income": 0.420,
    "education": 0.610,
    "medical": 0.520,
    "crime": 0.510,
    "tourism": 1.000
  }
}
```

この正規化後の値を、生値と並べて東京・京都で読み比べると次のようになります（数値はいずれも記事のロジック説明用の例です）。

- **人口** — 東京は約 1,408 万人で正規化 1.00、京都は約 250 万人で 0.11。規模軸では大差がつきます
- **県民所得** — 東京 5,780 千円で 1.00、京都 3,210 千円で 0.42
- **教育費** — 東京 24,500 円で 0.92、京都 18,700 円で 0.61
- **医療費（反転後）** — 東京は 0.78、京都は 0.52。医療費が低いほど外側に来る向きです
- **犯罪率（反転後）** — 東京 0.23、京都 0.51。東京は犯罪率が高めなので反転後は内側にえぐれます
- **観光客数** — 東京 0.86、京都は 1.00 で満点

ここで気づくこと。**東京は「経済規模・所得・教育費」で外に張り出すが、犯罪率（反転後 0.23）が内側に深くえぐれています**。逆に **京都は「観光」が満点、医療と犯罪が中位、所得規模は控えめ** という形。数字だけだとピンと来ない違いが、レーダー化するとシルエットの違いとして一目でわかります。

> [!NOTE]
> 本記事の statsDataId や生値・正規化値は、レーダーチャートの作り方（取得 → 正規化 → 描画）を説明するための **架空の例** です。実際の最新値で同じ形になるとは限りません。stats47 の確定値で県を眺めたいときは、本文中の各ランキングページ（[人口](https://stats47.jp/ranking/japanese-population)・[刑法犯認知件数](https://stats47.jp/ranking/criminal-recognition-count) など）を参照してください。

> [!TIP]
> 正規化のときに「外れ値が 1 県だけある」場合は要注意です。たとえば沖縄の観光客数は離島の集計事情で他県と桁が違う年があり、その年は沖縄だけ 1.0、他はほぼ 0 に潰れてしまいます。対策は後述の「つまずきポイント」セクションでパーセンタイル正規化・log 変換として詳しく扱います。

## Step 3: D3 でレーダーチャート（polygon + axes + grid）

D3 でレーダーを描くコアは **極座標変換** です。各軸を中心から等角度で放射状に配置し、その軸上の正規化値を半径として点を打ち、点同士を polygon で結ぶ。書き下すと 60 行ちょいで収まります。

```javascript
// radar.mjs (D3 v7 想定)
import * as d3 from "d3";
import { JSDOM } from "jsdom";
import fs from "node:fs/promises";

const data = JSON.parse(
  await fs.readFile("six-indicators-normalized.json", "utf8")
);
const AXES = [
  { key: "population", label: "人口規模" },
  { key: "income", label: "県民所得" },
  { key: "education", label: "教育費" },
  { key: "medical", label: "医療費(低い方が良)" },
  { key: "crime", label: "治安(犯罪率の逆)" },
  { key: "tourism", label: "観光客数" },
];

const W = 600;
const H = 600;
const R = 220; // 半径
const CX = W / 2;
const CY = H / 2;
const N = AXES.length;

const dom = new JSDOM("<!DOCTYPE html><body></body>");
const body = d3.select(dom.window.document.body);
const svg = body
  .append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .attr("width", W)
  .attr("height", H);

// グリッド円（0.2, 0.4, 0.6, 0.8, 1.0）
for (const level of [0.2, 0.4, 0.6, 0.8, 1.0]) {
  svg
    .append("circle")
    .attr("cx", CX)
    .attr("cy", CY)
    .attr("r", R * level)
    .attr("fill", "none")
    .attr("stroke", "#e5e7eb");
}

// 軸線とラベル
AXES.forEach((axis, i) => {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  const x = CX + Math.cos(angle) * R;
  const y = CY + Math.sin(angle) * R;
  svg
    .append("line")
    .attr("x1", CX)
    .attr("y1", CY)
    .attr("x2", x)
    .attr("y2", y)
    .attr("stroke", "#9ca3af");
  svg
    .append("text")
    .attr("x", CX + Math.cos(angle) * (R + 24))
    .attr("y", CY + Math.sin(angle) * (R + 24))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", 13)
    .text(axis.label);
});

// polygon（東京: 13000）
function drawPoly(areaCode, color, alpha) {
  const values = data[areaCode];
  const points = AXES.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
    const r = R * (values[axis.key] ?? 0);
    return `${CX + Math.cos(angle) * r},${CY + Math.sin(angle) * r}`;
  }).join(" ");
  svg
    .append("polygon")
    .attr("points", points)
    .attr("fill", color)
    .attr("fill-opacity", alpha)
    .attr("stroke", color)
    .attr("stroke-width", 2);
}

drawPoly("13000", "#2563eb", 0.35); // 東京 blue

await fs.writeFile("radar-tokyo.svg", body.html());
console.log("✓ wrote radar-tokyo.svg");
```

実行すると `radar-tokyo.svg` がカレントに生まれます。ブラウザで開けば 6 軸レーダーが描画されているはず。

```bash
node radar.mjs
open radar-tokyo.svg
```

Claude Code に「`radar.mjs` をそのまま動くように修正して、JSDOM が無ければ install コマンドも提示して」と頼めば、依存関係の入れ漏れもケアしてくれます。

## Step 4: 2 県比較（東京 vs 京都など、polygon overlay）

レーダーは 1 県だけだと「絶対値感」が伝わりにくいので、**2 県を重ねる** と一気に物語が立ち上がります。コードは `drawPoly` を 2 回呼ぶだけ。

```javascript
drawPoly("13000", "#2563eb", 0.30); // 東京 青
drawPoly("26000", "#dc2626", 0.30); // 京都 赤

// レジェンド
svg
  .append("rect")
  .attr("x", 20)
  .attr("y", 20)
  .attr("width", 14)
  .attr("height", 14)
  .attr("fill", "#2563eb");
svg
  .append("text")
  .attr("x", 40)
  .attr("y", 32)
  .attr("font-size", 13)
  .text("東京都");

svg
  .append("rect")
  .attr("x", 20)
  .attr("y", 42)
  .attr("width", 14)
  .attr("height", 14)
  .attr("fill", "#dc2626");
svg
  .append("text")
  .attr("x", 40)
  .attr("y", 54)
  .attr("font-size", 13)
  .text("京都府");
```

これで 1 枚の SVG に東京と京都の多角形がオーバーレイされます。重なる部分は色が混ざって紫っぽくなり、ずれている部分は青と赤が独立して見えます。**人間の脳は「形の差分」を数値の差分よりずっと速く検知する** ので、レーダーの overlay は強力なコミュニケーション手段です。東京は人口・所得・教育費の方向へ大きく伸び、京都は観光の頂点だけが突出して経済軸は控えめ——という対照的なシルエットが、説明文なしで一目で伝わります。

> [!TIP]
> 比較する 2 県は「規模が違う組」（東京 vs 鳥取）より「性格が違う組」（東京 vs 京都、大阪 vs 沖縄）の方が話が広がります。規模違いだけだと「大きい方が全部勝ち」の自明な形になりがちで、レーダーの強みである「形の個性」が出ません。意図的に方向性の異なる 2 県を選ぶと差分が際立ちます。

3 県以上の overlay も技術的には可能ですが、5 県を超えると線が混雑して読めなくなります。**3 県までが実用上限** と覚えてください。

## Step 5: 軸ラベルと数値ツールチップ

正規化値（0〜1）だけだと「で、東京の所得って結局いくらなの？」が分かりません。読み手のために **生値も併記** する設計を入れます。3 つの方法があります。

### 方法 A: 軸ラベルに最大値を併記

```text
県民所得
(0〜5,780千円)
```

軸ラベルの 2 行目に「全国の min〜max」を入れる方法です。シンプルで実装も楽ですが、ラベルが長くなるので 6 軸が限界になります。

### 方法 B: 頂点に数値ラベル

各 polygon の頂点（県のスコアが乗る位置）に小さく生値テキストを置きます。1 県だけなら読めますが、2 県以上 overlay すると数字が被るのでおすすめしません。

### 方法 C: ホバー時ツールチップ（Web 描画時のみ）

ブラウザで描く場合は SVG の各軸末端に透明な `rect` を重ね、`mouseenter` で生値を出すのが王道です。Claude Code に頼むコードはこんな構成。

```javascript
// ブラウザ用 (D3 ライブ描画)
axis.append("rect")
  .attr("x", x - 30).attr("y", y - 12)
  .attr("width", 60).attr("height", 24)
  .attr("fill", "transparent")
  .on("mouseenter", (e) => showTooltip(e, axis, rawValue, normValue))
  .on("mouseleave", hideTooltip);
```

stats47 では用途ごとに次のように方法を使い分けています。

- **Web ページに埋め込むとき**は方法 C（ホバーツールチップ）。マウス操作で生値を出せるのでインタラクションが効きます
- **ブログ記事に png/svg 静止画で貼るとき**は方法 A（軸ラベルに min〜max 併記）。静止画はホバーできないため、最初からラベルに数値を載せます
- **印刷 PDF にするとき**は方法 A に加えて末尾に数値の補足を添える。紙の上では文章で補完するのが確実です

## つまずきポイント（指標方向の正負、外れ値正規化、軸数の限界）

### 1. 指標方向の正負を統一しないと読めない

冒頭で書いた通り、レーダーは「外側 = 良い」と直感で読まれます。**「医療費が高い」を内側に潰す処理** を入れないと、医療費の高い大都市が「医療軸が満点 → 良い都市」と誤読されます。

具体策は normalize 時に `INVERT` セットを使うか、取得段階で `(- 生値)` の符号反転で扱うかの 2 通りがあります。Claude Code に頼むときは **「方向の意味付け」までを必ず伝えてください**。「数値を 0〜1 に正規化して」だけだと、Claude Code は方向を解釈しません。

### 2. 外れ値 1 県で全体が潰れる問題

47 県中 1 県だけが極端な値だと、min-max 正規化はその県が 1.0、残りが 0.0〜0.3 あたりに張り付き、レーダーが「ほぼ正多角形 0.1」になる事故が起きます。対策は次の 3 つがあります。

- **percentile 正規化** — 5%〜95% パーセンタイルを 0〜1 に割り当てます。外れ値の影響を抑えられるので、一般的にはこれをおすすめします
- **log 変換** — log(x) してから min-max にかけます。人口や観光客数のように桁数の差が大きい指標で効果的です
- **ranking 正規化** — 47 県の順位を 47→0 にスケールします。値の分布が大きく偏っているときに向いています

Claude Code への頼み方の例は次のとおりです。

```
あなた: tourism (観光客数) は沖縄が外れ値で他県が潰れるので、
       log10 してから min-max 正規化に変更して。
       他の指標は通常 min-max のまま。
```

### 3. 軸数の限界は「6〜8」

3 軸ではただの三角形でキャラクターが出ません。10 軸を超えると軸ラベルが詰まって読めません。**6〜8 軸が経験則上のスイートスポット**です。本記事の 6 軸も読みやすさ重視で設計しています。

もし「もっと多軸で見たい」場合は **2 枚に分割** するのが王道です。経済系 6 軸と暮らし系 6 軸を別レーダーにして隣に並べると、1 枚に詰め込むより読み手に優しくなります。

### 4. 軸の順番で印象が変わる

レーダーは **隣り合う 2 軸が囲む面積** として目に入ります。たとえば「教育費」と「観光客数」を隣同士に置くと、両方高い県はその一帯が大きく膨らむ形として強調されます。

意味的に関連の薄い 2 軸を隣に置くと、形の意味が読み取りにくくなります。本記事では「規模系（人口・所得）→ 暮らし系（教育・医療）→ 治安・観光」の流れで並べていて、これは意図した設計です。

### 5. 軸ごとの「重み」を勝手に揃えない

レーダーは見た目上 6 軸が等価値に見えますが、本来は **どの軸がより重要か** は読者の関心次第です。記事や用途によって「治安だけ重み 2 倍」のような重み付けが必要なときは、レーダーをやめて重み付き総合スコア（棒グラフ）に切り替えた方が誠実です。

レーダーは「軸間に優劣をつけない」という前提が崩れたら使うべきではない、ということだけ覚えておけば大丈夫です。

## 次回予告（Part 10: ボックスプロット）

Part 9 では「**1 県の多面性を 1 枚にまとめる**」レーダーを扱いました。Part 10 では視点を裏返して、「**1 指標の分布を 47 県でまとめて見る**」ボックスプロットに進みます。

ボックスプロットは平均・中央値・四分位範囲・外れ値を 1 つの図に詰め込めるチャートで、**「全国平均だけ見て満足してませんか？」** という問いに刺さります。たとえば「教育費の全国平均は 18,000 円」と聞いても、東京だけ 25,000 で他県が 8,000〜15,000 なら平均はミスリード。ボックスプロットなら **分布の歪み** が一目でわかります。

Claude Code には「**47 県の値から quartile（Q1/Q2/Q3）と IQR を計算して、外れ値の判定式 1.5×IQR で外れ県をハイライト**」までを頼みます。複数指標を縦に並べた「multi-boxplot」も Part 10 で扱う予定です。

## データ出典

本記事で扱った 6 指標は、いずれも政府統計の総合窓口 e-Stat を経由して整備された統計を題材にしています。レーダーの軸として組み合わせやすい代表的な指標は次のとおりです。

- 人口推計（総務省統計局）— 「人口規模」軸の元データ
- 県民経済計算（内閣府）— 「県民所得」軸の元データ
- 家計調査（総務省統計局）— 「教育費」軸の元データ
- 国民医療費（厚生労働省）— 「医療費」軸の元データ（反転して使用）
- 犯罪統計（警察庁）— 「犯罪率」軸の元データ（反転して使用）
- 観光入込客統計（観光庁）— 「観光客数」軸の元データ

なお本文中の statsDataId・生値・正規化値は、取得 → 正規化 → 描画の流れを説明するための架空例です。確定値で各県を眺めたいときは、stats47 のランキングページ（[人口ランキング](https://stats47.jp/ranking/japanese-population)・[刑法犯認知件数ランキング](https://stats47.jp/ranking/criminal-recognition-count)・[1 人あたり教育費](https://stats47.jp/ranking/per-capita-education-expenditure-pref-municipal) など）でご確認ください。

---

次回 Part 10 でお会いしましょう。レーダーで県の「形」を見たあとは、ボックスプロットで指標の「分布」を見にいきます。`claude` を立ち上げて、続きを一緒に作っていきましょう。

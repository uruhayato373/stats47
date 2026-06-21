---
title: "商業販売額バブルチャート｜人口で重み付けする Claude Code"
seoTitle: "[2026]商業販売額バブルチャート｜Claude Code×D3で多変量可視化"
subtitle: "Claude Code 未経験エンジニアのための実例集 Part 16"
slug: cc-estat-16-commerce-bubble
description: "商業統計調査の販売額・従業者数を人口と組み合わせ、3 軸バブルチャートで都道府県格差を可視化。半径スケールとラベル衝突回避を Claude Code で解決。"
category: commercial
archetype: A
tags:
  - ClaudeCode
  - e-Stat
  - 商業販売額
  - バブルチャート
  - D3
publishedAt: 2026-05-17
updatedAt: 2026-05-17
published: true
ogImage: /blog/cc-estat-16-commerce-bubble/og.png
---

## バブルチャートは「3 軸を 1 枚にたたみ込む」最終兵器

棒グラフ、折れ線、散布図と続けてきたこの連載も Part 16 です。データ可視化を続けていると、必ず一度はぶつかる壁があります。「軸が足りない」問題です。

たとえば商業販売額のランキングを作ろうとすると、すぐに気になることが出てきます。「東京の販売額がデカいのは当たり前じゃないか? 人口が多いんだから」「いや、人口当たりで割ったら鳥取の方が高いんじゃないの?」「従業者数で割るとどうなる?」。こうした疑問に答えるには、1 つの棒グラフでは足りません。少なくとも 3 つの数字を同時に見せる必要があります。

ここで登場するのがバブルチャートです。x 軸、y 軸、そして円の半径(実質「面積」)の 3 軸で、3 つの変数を同時にエンコードできます。色を加えれば 4 軸、形状を加えれば 5 軸まで拡張できますが、人間の認識が破綻するので 3 〜 4 軸が現実的な上限だと思っておきましょう。

この記事では商業統計調査の販売額・従業者数と人口推計を組み合わせ、47 都道府県を 3 軸で可視化します。Claude Code を使えば、3 つの統計表を取ってきて結合し、D3 でバブルチャートを描き、ラベル衝突を回避するところまで一気通貫で実装できます。[Part 6 の県民所得 × 平均寿命の散布図](/blog/cc-estat-06-income-scatter)で 2 軸の相関を扱いましたが、今回はそれを次元拡張したバージョンと考えてもらえればと思います。

横軸に人口、縦軸に商業販売額、円の大きさを商業従業者数で表現すると、東京の巨大バブルが右上に飛び抜けます。これは想像通りです。ですが面白いのは、沖縄や福井のように「人口の割に販売額が多い／少ない」県が y = x の対角線から外れて見えてくることです。バブルチャートは、こういう「比率の外れ値」を直感的に発見させてくれます。

ちなみにバブルチャートの祖と言えば Hans Rosling の Gapminder です。あれが衝撃的だったのは、200 カ国の所得・寿命・人口を 1 枚のチャートに動的に詰め込んで「世界の見え方」を変えてしまったからでした。今回作るのは、あの 47 都道府県版です。

> [!NOTE]
> 本記事で扱う「商業年間商品販売額」は、卸売業と小売業の年間商品販売額の合計です(統計上は経済センサス・活動調査が出典)。卸売は「企業から企業への取引」を含むため、流通ハブである都市部に大きく集中します。「販売額が大きい=その県の住民が豊かに消費している」ではない点が、最初の読み違いポイントです。

## 実データで見る商業販売額の県格差

理屈の前に、実物の数字を見ておきましょう。下のチャートは stats47 の「商業年間商品販売額」ランキング(2022 年度)から、上位 5 県と下位 5 県を抜き出したものです。

![商業年間商品販売額の上位5県・下位5県(2022年度・百万円)](data/commerce-sales-ranking.svg)

1 位は東京都で 211,933,731 百万円(約 212 兆円)。2 位の大阪府(64,319,587 百万円)に 3 倍以上の差をつけて飛び抜けています。3 位は愛知県(44,886,931 百万円)、4 位は神奈川県(24,986,048 百万円)、5 位は福岡県(24,122,047 百万円)と続きます。一方、最下位の鳥取県は 1,302,355 百万円、46 位の島根県は 1,428,670 百万円で、東京と鳥取の差は実に 162.7 倍です。

この「東京が桁違いに大きい」という分布こそが、後で軸スケールの設計を悩ませる元になります。これだけ差があると、ふつうの線形軸では下位 40 県が一塊に潰れて読めなくなるからです。バブルチャートで人口や従業者数と並べて初めて、「東京の大きさは人口由来なのか、それとも流通構造由来なのか」を腑分けできるようになります。

<source-link href="/ranking/annual-sales-amount">商業年間商品販売額ランキングをもっと見る</source-link>

## 使うデータ: 商業統計 + 人口推計の合わせ技

ここからは実装の話です。まずデータソースの確認から進めます。商業販売額のデータは、経済産業省が出している「商業動態統計」と、総務省統計局・経済産業省の「経済センサス活動調査」のどちらでも取れますが、都道府県別の細かい数字は経済センサスの方が網羅性が高いです。今回は次の 3 種類の統計を使います。

- **経済センサス活動調査(卸売業・小売業) 都道府県別 年間商品販売額** — バブルの y 軸に使う本命の数字です(statsDataId は調査ラウンドで変わるため、検索で都度確認します)。
- **経済センサス活動調査(卸売業・小売業) 都道府県別 従業者数** — バブルの半径に使い、事業所規模感を表現します。
- **人口推計 都道府県別 総人口** — バブルの x 軸に使い、販売額を人口で重み付けする分母になります。

statsDataId は時点や調査ラウンドで変わるので、実際には `/search-estat` スキルで「商業販売額 都道府県」のような検索を最初にかけてから、メタ情報を確認するのが鉄則です。Part 2 でやった検索スキルがここで効いてきます。

データの粒度を揃えるため、今回は経済センサス活動調査の数字に統一します。商業統計のデータは年次更新ではなく、センサス系(数年に 1 度)が多いので、最新年が偏ることに注意が必要です。人口推計だけが毎年更新されるので、合わせる年を間違えると「分母だけ最新、分子は数年前」というキメラデータになってしまいます。

なお、商業販売額には「卸売」と「小売」があります。今回は卸売 + 小売の合計値(年間商品販売額)を使います。卸売だけ取ると東京・大阪・愛知に超偏重するため、小売を含めることで地方のバブルも見えるバランスになります。

## Step 1: 3 つの統計表を Claude Code に取らせる

ここからが本題です。3 つの統計表を順に取得していきます。Claude Code に投げるプロンプトは、次のような感じで十分に動きます。

```bash
claude "e-Stat API から以下 3 つの統計表を取得して JSON で /tmp/raw/ に保存して:
1. 経済センサス活動調査 卸売業・小売業 都道府県別 年間商品販売額
2. 同 都道府県別 従業者数
3. 人口推計 都道府県別 総人口

すべて 47 都道府県分が揃うこと。レスポンスから VALUE 配列だけ抽出して
prefCode（5桁）と value を持つ配列にして。"
```

Claude Code は内部で `/fetch-estat-data` 系のスキルを使って 3 回 API を叩き、JSON を吐き出します。注意点として、e-Stat API は時点指定をしないと全年度が返ってくるため、`.claude/rules/estat-api.md` のルール通り `cdTime` パラメータは投げず、全部取ってからメモリ上で年度をフィルタするのが正しい使い方です。キャッシュヒット率が段違いに上がります。

取得後、`/tmp/raw/commerce_sales.json` には次のような形のデータが入っているはずです(値は構造を示すためのサンプルです)。

```json
[
  { "prefCode": "01000", "prefName": "北海道", "value": 12030456 },
  { "prefCode": "13000", "prefName": "東京都", "value": 211933731 },
  { "prefCode": "27000", "prefName": "大阪府", "value": 64319587 },
  { "prefCode": "47000", "prefName": "沖縄県", "value": 1234567 }
]
```

単位は百万円です。東京の約 212 兆円という規模は、上のランキングチャートで見た通りで、2 位の大阪に 3 倍以上の差をつける独走状態です。これはあとでバブルチャートを描くと、x 軸の人口と並べてさらに一目で分かるようになります。

従業者数 JSON はもっとシンプルで、`value` が人数(人)です。人口推計は `value` が千人単位なので、後で 1000 倍するのを忘れないようにしましょう。単位の食い違いは、バブルチャートの「半径を radius にして実は面積で何倍にもなっていた」という事故と並ぶ古典的バグなので、最初に単位を `unit` フィールドで明示しておくと事故が減ります。

## Step 2: 都道府県コードで 3 つを結合

データが揃ったら、prefCode をキーに結合します。Node.js でやるなら、こんな感じになります。

```javascript
// /tmp/merge-bubble-data.js
const fs = require("node:fs");

const PREF_NAMES = {
  "01000": "北海道",
  "02000": "青森県",
  // ... 47 件
  "47000": "沖縄県",
};

const sales = JSON.parse(fs.readFileSync("/tmp/raw/commerce_sales.json"));
const workers = JSON.parse(fs.readFileSync("/tmp/raw/commerce_workers.json"));
const population = JSON.parse(fs.readFileSync("/tmp/raw/population.json"));

const toMap = (rows) => Object.fromEntries(rows.map((r) => [r.prefCode, r.value]));
const salesMap = toMap(sales);
const workersMap = toMap(workers);
const popMap = toMap(population);

const merged = Object.keys(PREF_NAMES).map((code) => ({
  prefCode: code,
  prefName: PREF_NAMES[code],
  // 単位を全部基本単位に揃える
  salesYen: (salesMap[code] ?? 0) * 1_000_000, // 百万円 → 円
  workers: workersMap[code] ?? 0,               // 人
  population: (popMap[code] ?? 0) * 1000,       // 千人 → 人
}));

// 派生指標も計算しておく
const enriched = merged.map((d) => ({
  ...d,
  salesPerCapita: d.population > 0 ? d.salesYen / d.population : 0,
  salesPerWorker: d.workers > 0 ? d.salesYen / d.workers : 0,
}));

fs.writeFileSync("/tmp/bubble-data.json", JSON.stringify(enriched, null, 2));
console.log(`merged ${enriched.length} prefectures`);
```

「単位を全部基本単位に揃える」のがポイントです。バブルチャートでは半径計算で `Math.sqrt(value)` を使うので、桁が混ざっていると半径計算がカオスになります。早めに「すべて円」「すべて人」と単位を統一しておきましょう。

これを実行すると `/tmp/bubble-data.json` に 47 件のレコードができます。東京の「1 人当たり販売額」が極端に大きく出るのは、卸売を含むため、周辺県の事業所が東京の卸から仕入れている分も入っているからです。だから「東京は儲かっている」ではなく「東京は流通のハブ」と読むのが正しい解釈になります。これで描画用データが揃いました。

> [!TIP]
> 派生指標(salesPerCapita / salesPerWorker)を結合の段階で先に計算しておくと、後で「やっぱり 1 人当たりで見たい」となったときにチャート側を作り直さずに済みます。生の絶対量と、人口・従業者数で割った比率の両方を保持しておくのが、多変量可視化の常套手段です。

## Step 3: D3 でバブルを描く(d3.scaleSqrt が半径計算の正解)

ここから描画フェーズに入ります。SVG を描く基本骨格は、次の通りです。

```javascript
// /tmp/bubble-chart.js (Node でレンダリング → SVG 出力)
const d3 = require("d3");
const { JSDOM } = require("jsdom");
const fs = require("node:fs");

const data = JSON.parse(fs.readFileSync("/tmp/bubble-data.json"));

const W = 960;
const H = 600;
const M = { top: 40, right: 40, bottom: 60, left: 80 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

const dom = new JSDOM("<!DOCTYPE html><body></body>");
const body = d3.select(dom.window.document.body);
const svg = body.append("svg")
  .attr("xmlns", "http://www.w3.org/2000/svg")
  .attr("viewBox", `0 0 ${W} ${H}`)
  .attr("width", W).attr("height", H);

const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);

// スケール定義
const x = d3.scaleLog()
  .domain([d3.min(data, (d) => d.population) * 0.9, d3.max(data, (d) => d.population) * 1.1])
  .range([0, innerW]);

const y = d3.scaleLog()
  .domain([d3.min(data, (d) => d.salesYen) * 0.9, d3.max(data, (d) => d.salesYen) * 1.1])
  .range([innerH, 0]);

// 半径は scaleSqrt で「面積比例」にする
const r = d3.scaleSqrt()
  .domain([0, d3.max(data, (d) => d.workers)])
  .range([0, 50]); // 最大半径 50px

// 軸
g.append("g").attr("transform", `translate(0,${innerH})`)
  .call(d3.axisBottom(x).ticks(6, "~s"));
g.append("g").call(d3.axisLeft(y).ticks(6, "~s"));

// バブル
g.selectAll("circle")
  .data(data)
  .join("circle")
  .attr("cx", (d) => x(d.population))
  .attr("cy", (d) => y(d.salesYen))
  .attr("r", (d) => r(d.workers))
  .attr("fill", "#2563eb")
  .attr("fill-opacity", 0.45)
  .attr("stroke", "#1e40af")
  .attr("stroke-width", 1);

fs.writeFileSync("/tmp/bubble.svg", body.html());
console.log("wrote /tmp/bubble.svg");
```

ここで一番大事なのは `d3.scaleSqrt()` を使っているところです。多くの人は半径を直接 value に比例させようとします(`scaleLinear`)が、これは間違いです。

なぜでしょうか。人間の目は円の「半径」ではなく「面積」で大きさを認識します。半径を 2 倍にすると面積は 4 倍になります。だから value を半径に直接マップすると、見た目の差が実際の値の 2 乗で誇張されてしまいます。`scaleSqrt` を使うことで「value が 4 倍 → 半径が 2 倍 → 面積が 4 倍」と、認識通りの比例関係になります。

これは可視化の世界で「Apple の円グラフ問題」とか「USA Today バブル事件」とか呼ばれる古典的な失敗で、`r = scaleLinear(value)` で描いた瞬間に分析の信頼が地に落ちます。Claude Code に書かせるときも「半径は scaleSqrt で面積比例にしてくれ」と一言添えるか、レビュー段階で必ずチェックしましょう。

## Step 4: 軸スケールは対数 or 線形?

次に悩むのが軸スケールです。商業販売額は東京の約 212 兆円から鳥取の約 1.3 兆円まで、162.7 倍の幅があります(上のランキングチャートで見た通りです)。これを線形軸で描くと、東京以外の 46 県が左下のスパゲッティ団子になって判別不能になります。

軸の選び方は次のトレードオフになります。

- **線形軸**: 「絶対量の差」が直感的に伝わる反面、上位 1 〜 2 県だけで描画領域を占有し、他が潰れます。
- **対数軸**: 47 県が均等にばらける反面、倍率の差が見えにくく、0 値が描けません。

今回は「分布を見たい」目的なので、両軸とも `d3.scaleLog()` を採用します。これで東京・大阪・愛知の御三家と、地方の県がほぼ等間隔で並んでくれます。

対数軸の罠は 1 つだけです。値に 0 や負数があると `log(0) = -Inf` で爆死します。47 都道府県の販売額・人口・従業者数は基本ゼロになりませんが、市区町村別データを扱う場合は要注意です。`Math.max(value, 1)` で下限を切るか、データソース段階で「値が 0 の県は除外する」かを決めておきましょう。

x が人口、y が販売額の場合、対角線(y = ax の傾き)が「1 人当たり販売額」を表現します。対角線の上にいる県は人口の割に販売が多く、下にいる県はその逆です。これがバブルチャートを散布図的に読むときの基本パターンです。[Part 6 の散布図](/blog/cc-estat-06-income-scatter)でも同じ読み方をしましたが、バブルチャートではさらにバブルの大きさで「事業所規模感」が加わります。

> [!WARNING]
> 卸売を含む販売額を人口で割った「1 人当たり販売額」は、東京のような流通ハブで極端に大きく出ます。これは住民の消費水準ではなく、企業間取引の集積を反映した数字です。対角線の上側に飛び抜けた県を見つけても、「県民が豊かに買い物している」と短絡せず、卸売拠点・物流拠点の有無を疑うのが正しい読み筋です。

## Step 5: ラベル衝突回避(d3-force vs annealing)

47 都道府県のラベルをそのまま打つと、首都圏で 5 個くらい重なって読めなくなります。これを解決する手法は、大きく 3 つあります。

### 手法 A: d3.forceSimulation でラベルを押し合いへし合いさせる

d3-force を使うと「ラベル同士が衝突したら反発する」物理シミュレーションが書けます。バブル本体は固定して、ラベルだけが動くようにします。

```javascript
const labelNodes = data.map((d) => ({
  prefName: d.prefName,
  x: x(d.population),
  y: y(d.salesYen) - r(d.workers) - 8, // バブルの上に初期配置
  targetX: x(d.population),
  targetY: y(d.salesYen),
}));

const sim = d3.forceSimulation(labelNodes)
  .force("collide", d3.forceCollide().radius(18))
  .force("x", d3.forceX((d) => d.targetX).strength(0.3))
  .force("y", d3.forceY((d) => d.targetY - 20).strength(0.3))
  .stop();

for (let i = 0; i < 200; i++) sim.tick();

g.selectAll("text.label")
  .data(labelNodes)
  .join("text")
  .attr("class", "label")
  .attr("x", (d) => d.x)
  .attr("y", (d) => d.y)
  .attr("text-anchor", "middle")
  .attr("font-size", 10)
  .text((d) => d.prefName);

// バブルからラベルまでの引き出し線
g.selectAll("line.leader")
  .data(labelNodes)
  .join("line")
  .attr("class", "leader")
  .attr("x1", (d) => d.targetX)
  .attr("y1", (d) => d.targetY)
  .attr("x2", (d) => d.x)
  .attr("y2", (d) => d.y)
  .attr("stroke", "#94a3b8")
  .attr("stroke-width", 0.5);
```

`forceCollide` の半径を 18 ピクセルにしておくと、ラベルがそこそこ離れた状態に落ち着きます。`forceX` `forceY` で「本来の位置に戻ろうとする力」を与え、`forceCollide` で「重なったら反発」させることでバランスを取ります。

### 手法 B: simulated annealing で配置を最適化

もう少し丁寧にやるなら、ラベル位置を「8 方向」のうちどれに置くかを simulated annealing で探索する手法もあります。`d3-labeler` というプラグインが有名です(オリジナルは Evan Wang の論文実装)。47 ラベル程度なら手法 A で十分ですが、100 件以上のスキャタープロットで使うときは d3-labeler の方が綺麗にまとまります。

### 手法 C: 主要県のみラベル表示

そして 3 つめは「諦めて主要県だけラベルを出す」やり方です。実際、これが一番読みやすかったりします。

```javascript
const TOP_LABELS = ["東京都", "大阪府", "愛知県", "神奈川県", "福岡県", "北海道", "沖縄県", "鳥取県"];
const visibleLabels = data.filter((d) => TOP_LABELS.includes(d.prefName));
```

外れ値や上位下位だけラベルを出し、それ以外は hover tooltip に逃がす、というのが実務的にはバランス良い落とし所です。

## Step 6: tooltip と凡例(半径の意味)

最後に仕上げです。バブルチャートで絶対に忘れてはいけないのが「半径の凡例」です。x 軸と y 軸はティックで意味が分かりますが、半径だけはユーザーに「これが何を意味するのか」を必ず示さないと、見た目だけインパクトのあるグラフになって解釈不能になります。

凡例は右下や左上に「半径 = 従業者数」のサンプル円を 2 〜 3 個並べるのが定番です。

```javascript
const legendValues = [100_000, 500_000, 1_000_000];
const legend = svg.append("g")
  .attr("transform", `translate(${W - 200},${H - 120})`);

legend.append("text").text("半径 = 従業者数（人）").attr("font-size", 11);
legendValues.forEach((v, i) => {
  legend.append("circle")
    .attr("cx", 25)
    .attr("cy", 20 + i * 35)
    .attr("r", r(v))
    .attr("fill", "none")
    .attr("stroke", "#475569");
  legend.append("text")
    .attr("x", 60)
    .attr("y", 20 + i * 35)
    .attr("dy", "0.35em")
    .attr("font-size", 10)
    .text(v.toLocaleString() + " 人");
});
```

tooltip はクライアント側で SVG にイベントを付ければ実現できます。Next.js なら `onMouseEnter` でステートを更新して、別の div に「東京都: 販売額 約 212 兆円 / 従業者 ◯◯ 万人 / 人口 ◯◯ 万人」のように出します。半径の凡例と tooltip がそろって初めて、バブルチャートは「眺めるグラフ」から「読めるグラフ」になります。

## つまずきポイント 3 連

ここまでで一通りの完成形ですが、実装中に必ず踏むであろう罠を 3 つ挙げておきます。

### 罠 1: 半径を radius にする(scaleLinear で割り当て)

すでに書きましたが、本当に多い失敗です。`.attr("r", (d) => d.value / 1000)` のような直線比例で半径を決めると、見た目で値の 2 乗のスケールで誇張されます。**必ず `d3.scaleSqrt` を経由しましょう**。

たとえば value が 1 → 4 → 16 → 100 と増えるとき、`scaleLinear` で半径を割り当てると半径そのものが 1 → 4 → 16 → 100 倍に膨らみます。`scaleSqrt` を使えば半径は 1 → 2 → 4 → 10 倍に収まり、その結果として面積が 1 → 4 → 16 → 100 と value に正しく比例します。「面積が value に比例」する状態が正解です。

### 罠 2: 対数スケールで 0 値が爆死

`d3.scaleLog()` の domain に 0 や負数が混ざると、`log(0) = -Infinity` で `cy` が `NaN` になり、バブルが「どこかへ消える」現象が起きます。市区町村別データや業種別の細分化で 0 件カテゴリが出ると、よくやらかします。対策は次の通りです。

- データ取得直後に `value > 0` でフィルタリングする
- どうしても残すなら `Math.max(value, 1)` で下限を 1 に切る
- もしくは線形軸 + zoom UI に切り替える設計判断をする

### 罠 3: 統計年度の食い違い

商業統計は数年に 1 度の経済センサスで取りますが、人口推計は毎年更新されます。「人口は最新年、販売額は数年前」みたいなキメラデータでバブルチャートを作ると、東京の人口が伸びている分だけ「東京の 1 人当たり販売額が下がった」ように見える、というおかしな解釈になります。

`/fetch-estat-data` で取るときは Claude Code に「同じ年で全部揃えて」と明示するか、JSON の `year` フィールドを必ず保持してチャート凡例に「◯◯ 年データ」と明示します。これは Bar Chart Race の回でも触れた話ですが、時点を揃えるのは多変量可視化の生命線です。商業統計そのものをじっくり眺めたい場合は、[商業・流通カテゴリのランキング一覧](/category/commercial)も合わせてどうぞ。

## まとめ

商業販売額バブルチャートを作る勘所を、最後に箇条書きでまとめます。

- バブルチャートは x 軸・y 軸・半径で 3 変数を同時に見せる手法。今回は人口・販売額・従業者数を割り当てました。
- 商業年間商品販売額は東京が約 212 兆円で 1 位、鳥取が約 1.3 兆円で最下位、その差は 162.7 倍(2022 年度)。卸売を含むため都市部に集中します。
- 半径は必ず `d3.scaleSqrt` で「面積比例」にする。`scaleLinear` で割り当てると値の 2 乗で誇張されます。
- 162.7 倍の幅を 1 枚に収めるには対数軸が有効。ただし 0 値は `log(0) = -Inf` で爆死するので下限処理が必要です。
- ラベル衝突は d3-force / d3-labeler / 主要県のみ表示の 3 択。47 県なら主要県だけ出すのが実務的に読みやすいです。
- 半径の凡例と tooltip をそろえて初めて「読めるバブルチャート」になります。

次回 Part 17 は、2 時点の比較に強い Slope Graph を扱う予定です。「順位の入れ替わり」を可視化する手法で、Edward Tufte が好んだスタイルです。バブルチャートが「多軸の静止画」だとすれば、Slope Graph は「2 時点の動きを見せる」ためのデバイスで、対比として面白いものになります。

## データ出典

- 商業年間商品販売額: 経済産業省・総務省統計局「経済センサス活動調査」(2022 年度)を e-Stat 経由で整備。
- 人口・従業者数: 総務省統計局「人口推計」「経済センサス活動調査」を e-Stat 経由で取得。
- 本記事のコード例中の JSON 値の一部は、構造を示すためのサンプルです。チャートおよびまとめの数値は stats47 のランキングデータ(2022 年度)に準拠しています。

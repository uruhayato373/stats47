---
type: trend-discovery
date: 2026-06-20
source: all
tags: [trend-discovery, blog-planning]
---

# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-06-20 (JST) ／ 取得スナップショット時刻基準
> ソース: all（google-trends / google-news / yahoo / hatena / note / gsc）
> トレンド総数: 約 145 件 ／ 採用（★★☆ 以上）: 13 件 ／ ★☆☆（データ未整備）: 5 件 ／ 除外: 約 95 件
> クロスソースヒット: 3 件（物価・出生/人口・外国人）
> ※ GSC は wow（直近 7 日 vs 前 7 日、endDate=3日前）。小規模サイトのため rising は薄いが content gap シグナルとして採用

---

## 最優先候補（🎯 content gap × timely × データ即用）

### 候補1: 猛暑・最高気温（マッチ度: ★★★ / ソース: google-news）🎯content-gap

- **トレンド概要**: 「19日は東海で35℃に迫る猛暑」「猛暑への長期曝露が認知症リスク」など、梅雨明け前から猛暑報道が始動。台風7号・梅雨前線の大雨報道も並走（landweather クラスタ）。
- **注目度**: google-news 猛暑2件＋認知症4件（猛暑×健康の合わせ技）
- **分類カテゴリ**: landweather（国土・気象）
- **タイミング**: 6〜7月の猛暑入りは毎年の季節検索ピーク。今年は「猛暑×認知症」という健康フックが新規に立っている。
- **重複**: 気温テーマの記事は**未作成**（降水量は `annual-precipitation-rainy-season-gap` で既出だが気温は空白）。

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 最高気温 | DB既存 | `maximum-temperature` | 主役 |
| 年平均気温 | DB既存 | `average-temperature` | 比較・温暖化文脈 |
| 最低気温 | DB既存 | `lowest-temperature` | 寒暖差の対比 |
| 認知症死亡率 | DB既存 | `dementia-death-rate` | 「猛暑×健康」クロス（候補4と接続） |

> ⚠ 「猛暑日数 / 真夏日 / 熱帯夜」「熱中症搬送数」の metric は**未整備**。気温そのものの絶対値ランキングで構成するか、`/search-estat` で猛暑日数を補完取得する。

#### 記事の切り口（案）
1. **アーキタイプA**: 最高気温の上位5・下位5を可視化し「なぜ盆地（京都・岐阜・山梨）と北関東が極端に暑いのか」を地形で説明。
2. **アーキタイプB（相関）**: 最高気温 × 認知症死亡率の散布図で「猛暑への長期曝露」報道を都道府県データで検証。見かけの相関 vs 高齢化交絡に注意。

#### 推奨チャート
- 上位5+下位5 横棒（最高気温）／ tile-grid マップ（気温の地理分布）／ 散布図（気温×認知症）

#### 次のアクション
- [ ] `node .claude/scripts/blog/fetch-ranking-data-r2.mjs maximum-temperature`（必要なら average-temperature / dementia-death-rate も）
- [ ] `/search-estat "猛暑日数 都道府県"` で熱中症・猛暑日を補完（任意）
- [ ] `/generate-article-charts` → 執筆（archetype A or B）

---

### 候補2: 納豆消費量（マッチ度: ★★☆ / ソース: gsc）🎯search-demand-gap

- **トレンド概要**: GSC 新規クエリ「納豆 消費 量 ランキング 2026」がクリック3・表示13・**掲載順位2位**で出現。検索需要があるのに専用記事が無い純粋なコンテンツギャップ。
- **注目度**: gsc 新規クエリ（cur clicks 3 / impr 13 / position 2.0）
- **分類カテゴリ**: economy（家計・消費）
- **タイミング**: 既に2位で表示されている＝記事化すれば即クリック獲得が見込める（gsc.md「コンテンツギャップが最重要」該当）。
- **重複**: 納豆の記事は**未作成**。

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 納豆消費支出額 | DB既存 | `natto-consumption-expenditure` | 家計調査・金額ベース |
| 納豆消費「数量(g)」 | e-Stat候補 | （要 `/fetch-estat-data`） | クエリは「消費量」＝数量。家計調査の購入数量を補完すると検索意図に直撃 |

#### 記事の切り口（案）
1. **アーキタイプD（生活含意）**: 「納豆王者は本当に茨城か？」金額 vs 数量で順位が変わるか、西日本での消費の薄さを可視化。
2. 既出の食卓ギャップ記事（`beef-consumption-prefecture-gap` 等）と同じ「産地と食卓のズレ」フォーマットを横展開。

#### 推奨チャート
- 上位5+下位5 横棒（納豆支出額）／ tile-grid マップ（東日本偏在）

#### 次のアクション
- [ ] `node .claude/scripts/blog/fetch-ranking-data-r2.mjs natto-consumption-expenditure`
- [ ] 検索意図に合わせ購入「数量」を `/fetch-estat-data`（家計調査 品目別 数量）で補完すると◎
- [ ] `/generate-article-charts` → 執筆（archetype D）

---

### 候補3: 在留外国人の都道府県分布（マッチ度: ★★★ / ソース: yahoo + gsc）🎯クロスソース×timely

- **トレンド概要**: yahoo「外国人ビザ手数料 7月以降値上げ」＋ GSC「外国人 滋賀」（表示32・前期比+100%）。在留外国人への関心が政策・検索の両面で上昇。
- **注目度**: yahoo 2件 ＋ gsc 表示急増（content gap, position 46＝今は流入取れていない）
- **分類カテゴリ**: international（国際）／ population
- **タイミング**: ビザ手数料改定（7月）で「外国人がどこに住んでいるか」需要が高まる時期。
- **重複**: `brazilian-resident-population-prefecture-gap`（ブラジル特化）はあるが、**在留外国人全体の分布記事は未作成**。「外国人 滋賀」は既存記事が拾えていない（position 46）。

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 外国人人口（10万人当たり） | DB既存 | `foreign-population-per-100k` | 主役（密度比較） |
| 外国人人口（実数） | DB既存 | `foreign-resident-count-per-100k` | 国籍別（中国/韓国/米国）も既存 |

#### 記事の切り口（案）
1. **アーキタイプA**: 「外国人が多い県は東京だけではない」群馬・愛知・滋賀など製造業集積県の集中を地形・産業で説明。GSC「外国人 滋賀」を直接回収。
2. **アーキタイプD**: ビザ手数料改定を導入に、在留外国人比率の地域差＝労働需要の地図として読む。

#### 推奨チャート
- tile-grid マップ（外国人人口10万人当たり）／ 上位5+下位5 横棒

#### 次のアクション
- [ ] `node .claude/scripts/blog/fetch-ranking-data-r2.mjs foreign-population-per-100k`
- [ ] `/generate-article-charts` → 執筆（滋賀・群馬・愛知を本文で明示し GSC クエリ回収）

---

### 候補4: 健康寿命（マッチ度: ★★★ / ソース: note）🎯content-gap

- **トレンド概要**: note の統計クリエイター（data_analyst_jp）が「健康寿命を決める5つの因子／疾患負荷スコア」を上位掲載。健康寿命は note 競合の主戦場。
- **注目度**: note rank7（競合が継続的に投下するテーマ）
- **分類カテゴリ**: socialsecurity（社会保障・衛生）
- **タイミング**: 競合が抑えているテーマで、stats47 に専用記事が無い＝差別化の取りこぼし。
- **重複**: `healthy-life-expectancy-*` の metric はあるが、**現行 R2 公開記事に健康寿命の記事が存在しない**（品質基準で言及される health-life-expectancy 系は現公開セットに不在）。要・新規作成。

#### 使えるデータ
| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 健康寿命（男性） | DB既存 | `healthy-life-expectancy-male` | 主役 |
| 健康寿命（女性） | DB既存 | `healthy-life-expectancy-female` | 男女差の対比 |
| 平均余命 | DB既存 | `average-life-expectancy-male` 他 | 「寿命 - 健康寿命 = 不健康期間」の算出 |

#### 記事の切り口（案）
1. **アーキタイプB/D**: 「長生き ≠ 健康に長生き」平均寿命と健康寿命の差（不健康期間）を県別に可視化。curiosity gap「寿命は延びたが不健康期間も延びた」（品質基準の推奨パターン）。
2. 男女差・上位（山梨・静岡等）と下位の構造を生活習慣で説明。

#### 推奨チャート
- 上位5+下位5 横棒（健康寿命）／ diverging（不健康期間＝寿命−健康寿命）／ 散布図（健康寿命×別指標）

#### 次のアクション
- [ ] `node .claude/scripts/blog/fetch-ranking-data-r2.mjs healthy-life-expectancy-male`（female / average-life-expectancy も）
- [ ] `/generate-article-charts` → 執筆（archetype B）

---

## 採用候補（★★☆ / content gap 中心）

### 候補5: 認知症・糖尿病死亡率（★★☆ / google-news）
- **概要**: news「猛暑曝露で認知症リスク」「糖尿病患者のBMI研究」。健康・疾病クラスタ。**記事未作成**。
- **データ**: `dementia-death-rate`(認知症死亡率) / `deaths-diabetes-per-100k`(糖尿病死亡) / `deaths-cerebrovascular-disease-per-100k`(脳血管疾患)。
- **切り口**: 候補1（猛暑）と接続して「猛暑×認知症」をデータ検証、または生活習慣病の西高東低を可視化（archetype B）。
- **次**: `fetch-ranking-data-r2.mjs dementia-death-rate`

### 候補6: 生活保護（★★☆ / hatena）
- **概要**: hatena「生活保護×薬の転売」「トー横」。**記事未作成**で metric は豊富。
- **データ**: `persons-on-public-assistance-per-1000` / `per-capita-public-assistance-expenditure-protected-pref-municipal` / `elderly-on-public-assistance-per-1000-65plus`。
- **切り口**: 生活保護率の地域差＝高齢化・産業構造の鏡（archetype A）。大阪・北海道上位の構造説明。
- **次**: `fetch-ranking-data-r2.mjs persons-on-public-assistance-per-1000`

### 候補7: 労働時間・働き方（★★☆ / hatena）
- **概要**: hatena「どれだけ自由に働けるか」がブクマ436（当日最高クラス）。働き方への強い関心。**記事未作成**。
- **データ**: `monthly-average-actual-working-hours-male` / `-female`（月間平均実労働時間）。
- **切り口**: 「長く働く県・短く働く県」を産業構成（第1次/第3次）で説明。男女差（archetype A/D）。
- **次**: `fetch-ranking-data-r2.mjs monthly-average-actual-working-hours-male`

### 候補8: 図書館・博物館（★★☆ / hatena）
- **概要**: hatena「現役レガシー機材」「印刷博物館VR」「図書館」など文化施設の話題が複数。**記事未作成**。
- **データ**: `library-count-per-million`(図書館数) / `library-lending-books`(貸出冊数) / `art-museum-count`(美術博物館) / `history-museum-count`。
- **切り口**: 「文化資本の地図」図書館・博物館の人口当たり密度。意外な上位県（archetype A/E）。
- **次**: `fetch-ranking-data-r2.mjs library-count-per-million`

### 候補9: 大学進学率・専修学校（★★☆ / note）
- **概要**: note「高卒就職率が高い県ほど若者が流出」「職業教育が充実する県」。教育×人口動態。**記事未作成**。
- **データ**: `high-school-advancement-rate`(高校卒進学率) / `specialized-school-count`(専修学校数) / `junior-college-count`。
- **切り口**: 進学率と県外流出の相関（archetype B）。「進学率が高い県ほど人が出ていく」逆説。
- **次**: `fetch-ranking-data-r2.mjs high-school-advancement-rate`

### 候補10: 地方財政・財政力指数（★★☆ / note）
- **概要**: note「人口を数えても財政は読めない／地方衰退の正体」。**部分カバー**（`expenditure-structure-comparison` は土木費特化）。財政力指数の正面記事は未作成。
- **データ**: `fiscal-strength-index`(財政力指数) / `current-balance-ratio-city`(経常収支比率) / `local-debt-current-ratio`。
- **切り口**: 「自立できる県・できない県」財政力指数1.0超の自治体（archetype A）。品質基準の推奨タイトル例に合致。
- **次**: `fetch-ranking-data-r2.mjs fiscal-strength-index`

### 候補11: がん受療率（★★☆ / google-news）
- **概要**: news「子宮頸がん死亡ゼロ（HPVワクチン）」「岡山大ウイルス製剤」。がん関心の高まり。**記事未作成**。
- **データ**: `treatment-rate-cancer-inpatient` / `-outpatient`（がん受療率）。※子宮頸がん単体 metric は無し。
- **切り口**: がん受療率の地域差＝医療アクセス・高齢化の地図（archetype A）。HPVワクチンは出典補強に。
- **次**: `fetch-ranking-data-r2.mjs treatment-rate-cancer-inpatient`

### 候補12: 単身世帯の生活費・家賃（★★☆ / note）
- **概要**: note「一人暮らしの生活費 都道府県別」「地方都市の賃料3年分」。**部分重複**（`consumer-price-regional-gap` が物価全体、`communication-cost-burden` が交通通信）。家賃・単身に絞った記事は未作成。
- **データ**: `disposable-income-after-rent`(家賃控除後可処分所得) / `company-housing-rent-consumption-expenditure` / `land-rent-consumption-expenditure`。
- **切り口**: 「家賃を引いた後に手元に残るお金」の県別ランキング＝移住の実質コスト（archetype D）。
- **次**: `fetch-ranking-data-r2.mjs disposable-income-after-rent`

### 候補13: 建物火災（★★☆ / yahoo, 季節）
- **概要**: yahoo「都内小学校火事」「原子力機構施設で火災 6月3件目」。火災報道。**記事未作成**。
- **データ**: `building-fire-count-per-100-thousand-people`(火災出火件数) / `fire-damage-casualties-per-accident`(火災死傷)。
- **切り口**: 火災出火件数の地域差（archetype A）。空気乾燥・暖房文化との関係。優先度は低め（季節性は冬寄り）。
- **次**: `fetch-ranking-data-r2.mjs building-fire-count-per-100-thousand-people`

---

## クロスソースヒット（複数ソースで出現 ＝ 既出テーマの再燃）

| # | キーワード | ヒット | ソース | カテゴリ | 状態 |
|---|---|---|---|---|---|
| A | 物価・値上げ・生活コスト | 3+ | news(アイス/食品値上げ), yahoo(食品値上げ), note(消費者物価/生活コスパ/単身費) | economy | **既出**（`consumer-price-regional-gap` / `cpi-change-regional-pattern`）→ 候補12（家賃特化）で差別化 |
| B | 出生率・人口減少・少子化 | 2+ | yahoo(出生率), note(合計特殊出生率/人口減少/人口流出/少子高齢化) | population | **既出**（`birth-death-gap-decline` / `divorces-per-total-population`） |
| C | 外国人・在留外国人 | 2 | yahoo(在留外国人/ビザ), gsc(外国人 滋賀) | international | **候補3で採用**（一般分布は未カバー） |

> A・B は需要が厚いが既出。新規執筆より既存記事の brushup / 内部リンク強化が費用対効果高い（`/brushup-blog`）。

---

## ★☆☆（データ未整備 ＝ 今回は見送り／将来の e-Stat 追加待ち）

| トレンド | ソース | 不足 | メモ |
|---|---|---|---|
| 宝くじ | news | 宝くじ販売額/購入額 metric なし | `--deep` で家計調査の宝くじ支出を補完すれば昇格可 |
| 食中毒・水難事故 | yahoo | 食中毒/水難 metric なし | 季節需要あり。e-Stat（食中毒統計）補完で救済余地 |
| スタートアップ・起業 | hatena | 開業率/起業率 metric なし | 事業所規模 metric のみ。経済センサス開業率の取得が必要 |
| 魅力度ランキング | note | 民間ブランド調査（e-Stat外） | 出典がブランド総研。stats47 の方針外 |
| 持続可能性/生活コスパ スコア | note | 合成指標（単一 metric なし） | 競合の独自スコア。複数 metric の合成記事として設計は可能だが重い |

---

## 除外トレンド（Phase 2 フィルタ）

| カテゴリ | 例 | 除外理由 |
|---|---|---|
| 芸能・スポーツ個人 | モロッコ代表/ハキミ, ジャンポケ太田, 秋元杏月, 藤井聡太, アン・ハサウェイ | 個人ニュース・統計化不可 |
| 海外ニュース | ヒズボラ停戦, ロシア・ウクライナ, G7, デング熱(タイ), エボラ, 中国プロパガンダ | 都道府県データと無関係 |
| 国政・政局 | 皇室典範改正/皇位継承, 高市内閣/支持率, 副首都法案, 郵政民営化, 兵庫県知事, 麻生養子案 | 都道府県粒度データなし（政策個別） |
| マクロ金融・企業 | 日銀利上げ, 円安, 日経平均, SSD/メモリ値上げ, ニデック, スペースX, TOB, GO上場, moomoo | 全国/企業レベル・pref データなし |
| エンタメ・新製品 | GTA6, 学研の学習復刊, アニメ「地元最高！」, カメラ機材, ChatGPT広告, iPhoneアプリストア | 統計テーマ化困難 |
| 個別事件・事故 | 小学校火災(個別), オービス盗難, 特殊詐欺, 再審冤罪, 新幹線人身事故 | 速報・統計化困難（※テーマ化できる火災は候補13で採用） |

---

## 推奨アクション

1. **最優先で書く: 候補1（猛暑・最高気温）** — 季節検索ピーク直前＋気温テーマの完全な content gap。`maximum-temperature` は即データ取得可。猛暑×認知症（候補5）を相関節に組み込めば archetype B で差別化。
2. **即クリック回収: 候補2（納豆消費量）** — GSC で既に position 2。記事化＝確実な流入。購入数量の補完取得を推奨。
3. **timely×content gap: 候補3（在留外国人分布）** — ビザ改定（7月）＋GSC「外国人 滋賀」を直接回収。
4. **競合差別化: 候補4（健康寿命）** — note 競合の主戦場で stats47 が空白。「不健康期間」の curiosity gap で勝負。
5. クロスソース A/B（物価・人口）は新規より **既存記事 brushup** が効率的（`/brushup-blog --target queue`）。

> 次工程: 候補1〜4 を `node .claude/scripts/blog/fetch-ranking-data-r2.mjs <key>` → `/generate-article-charts` → `/draft-from-trend` or article-writer で執筆 → quality-gate → blog-critic（review.md PASS）→ `published:true` で develop push。

---
type: trend-snapshot
date: 2026-06-14
source: all
tags: [trend, blog-planning]
---

# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-06-14 (JST)
> ソース: all（Google Trends / GSC / はてブ / Google News / Yahoo!ニュース / note.com の 6 ソース）
> トレンド総数: ~95件 / 採用（★★☆ 以上）: 6件 / ★☆☆: 5件 / 除外: 多数
> クロスソースヒット: 2件（ふるさと納税・家計金融資産/NISA、いずれも hitCount=2 の「注目候補」。hitCount≥3 のヒットは統計化困難なもの〔G7〕のみ）
> 白書エンリッチ: 未実行（`--whitepaper` 未指定）

## 推奨アクション（最優先順）

1. **豚肉消費の都道府県格差（★★★ / GSC コンテンツギャップ）** — 最優先。GSC で「家計調査、豚肉の支出額1位の県は？」が**新規クエリ**として出現し、流入先が `/ranking/pork-consumption-expenditure`（ランキングページのみ）= **ブログ記事が無い確実な機会**。`pork-consumption-expenditure` / `pork-consumption-quantity` のデータは既存。すぐ執筆可。
2. **転職が多い県ほど年収が高いのか（労働流動性 × 所得・★★★ / Type B）** — note 競合 `data_analyst_jp` が「労働流動性と所得」「離婚率と経済」等の**相関・真因シリーズ**で需要を実証。stats47 は `turnover-rate` / `job-change-rate` / `new-hire-count` + 県民所得データを保有し、未カバー。todo-ran 対抗の差別化主軸（Type B 相関記事）に最適。
3. **NISA時代の都道府県別「金融資産」格差（★★★ / クロスソース）** — 家計の株資産500兆円・NISA後押しが Trends/Yahoo/News で同時話題。`securities-balance` / `financial-assets-balance-multi-person-households` を保有し、**有価証券の地域差**は既存記事（savings/deposit 系）が扱っていない切り口。

---

## クロスソースヒット（複数ソースで出現）

| # | キーワード | ヒット数 | ソース | カテゴリ | マッチ度 | 備考 |
|---|---|---|---|---|---|---|
| 1 | ふるさと納税 | 2 | hatena(271), yahoo | administrativefinancial | ★★☆ | 24年度 自治体全体863億円赤字。受入額/流出額データは未整備（家計調査の寄付支出のみ）|
| 2 | 家計金融資産 / NISA | 2 | google-trends(家計), yahoo(NISA) | economy | ★★★ | 家計株資産500兆円超。`securities-balance` 等を保有 |

> ※ hitCount=3 で出たのは「G7サミット」(trends/yahoo/news) のみだが、都道府県データに結びつかず除外。クロスソースの「数の多さ」より「統計化可能性 × stats47 データ有無」を優先した。

---

## 候補一覧

| # | トレンド | ソース | マッチ度 | カテゴリ | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|
| 1 | 豚肉消費 | gsc | ★★★ | commercial/economy | 豚肉支出1位の意外な県・東西の食肉文化差 | すぐ執筆可 |
| 2 | 転職 × 年収 | note, (job-change データ) | ★★★ | laborwage | 「転職が多い県ほど年収が高い」は本当か（相関≠因果）| すぐ執筆可（Type B）|
| 3 | 金融資産/NISA | google-trends, yahoo | ★★★ | economy | NISA時代、有価証券保有の地域差は2極化したか | すぐ執筆可 |
| 4 | 保育料/保育所 | hatena | ★★☆ | socialsecurity/educationsports | 保育料は住む県でいくら違う・待機と充足の地図 | すぐ執筆可 |
| 5 | ふるさと納税 | hatena, yahoo | ★★☆ | administrativefinancial | 863億円赤字の正体・流出県と受入県の二極化 | データ取得必要（e-Stat外/総務省）|
| 6 | 消費税 × 農業所得 | yahoo | ★★☆ | agriculture | 消費税1%で手取り減る県・農業所得依存度の地図 | すぐ執筆可 |

---

## 候補詳細

### 候補 1: 豚肉消費（マッチ度: ★★★ / ソース: gsc）

- **トレンド概要**: GSC で「家計調査、豚肉の支出額1位の県は？」が**新規クエリ**（今期 clicks 9・14、前期ゼロ）として出現。
- **注目度**: GSC 新規クエリ 2 バリアント（合計 clicks 14 / impressions 112）。
- **分類カテゴリ**: commercial / economy（家計調査・消費）
- **タイミング**: 検索されているのに**流入先が `/ranking/` だけ**＝ブログ記事の空白。「豚肉といえば？」の食文化ネタは安定需要。

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 豚肉への支出額 | DB既存 | `pork-consumption-expenditure` | 家計調査 |
| 豚肉の購入数量 | DB既存 | `pork-consumption-quantity` | 数量 vs 金額で単価差も出せる |
| 牛肉・鶏肉（対比） | DB既存 | `beef-consumption-quantity` / `chicken-consumption-quantity` | 東西の食肉嗜好の対比 |

#### 記事の切り口（案）

1. **東西の食肉文化差**: 西日本＝牛、東日本＝豚 の通説をデータで検証（豚 vs 牛の購入数量を県別に重ねる）。
2. **支出額 vs 数量の乖離**: 「たくさん買う県」と「高い肉を買う県」のズレ＝単価の地域差。
3. 既存の `beef-consumption-prefecture-gap` 記事と内部リンクで回遊（牛と対の記事に）。

#### 推奨チャート

- 上位5+下位5 の SVG 横棒（豚肉支出額）。図直下に `<source-link href="/ranking/pork-consumption-expenditure">`。
- 豚 vs 牛 のグループ化横棒 or 散布図（東西差の可視化）。

#### 次のアクション
- [ ] `/fetch-article-data --metric pork-consumption-expenditure`（R2 values 直 fetch、rank=0 は再計算）
- [ ] `/generate-article-charts`（上位5+下位5・タイルマップ）
- [ ] 記事執筆（Type D: 食文化の生活含意・対比）

---

### 候補 2: 転職 × 年収（労働流動性と所得）（マッチ度: ★★★ / ソース: note 競合実証）

- **トレンド概要**: note の `data_analyst_jp` が「転職が多い県ほど年収が高いのか――47都道府県『労働流動性と所得』完全分析」をはじめ、**相関・真因スコアシリーズ**を量産中（離婚率と経済、産業構造と雇用、空き家×人口減 など）。競合が需要を実証している領域。
- **注目度**: note でクリエイター層が継続発信（スキ数は非公開だが投稿頻度が高い）。
- **分類カテゴリ**: laborwage
- **タイミング**: 「転職 当たり前」時代の関心。stats47 は**相関記事（Type B）が手薄**で差別化主軸にできる。

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 離職率 | DB既存 | `turnover-rate` | 労働流動性 |
| 転職率 | DB既存 | `job-change-rate` | 同上 |
| 入職者数 | DB既存 | `new-hire-count` | 流入 |
| 一人当たり県民所得 | DB既存 | `prefectural-income-per-capita` / `per-capita-prefectural-income-h27` | 所得軸 |

#### 記事の切り口（案）

1. **相関≠因果の検証**: 転職率と県民所得を散布図で重ね、「見かけの相関」を提示 → 真因（産業構造・東京圏の流動性）に踏み込む。todo-ran/competitor が出していない「相関の落とし穴」を主役に。
2. **逆説アングル**: 「流動性が高い＝豊か」とは限らない県（非正規流動が高い県）を抽出。

#### 推奨チャート

- 散布図（X=転職率 / Y=一人当たり県民所得、47点 + 回帰線）。Type B の核。
- 転職率 上位5+下位5 横棒、所得 上位5+下位5 横棒（同じ県が並ぶか対比）。

#### 次のアクション
- [ ] `/fetch-article-data` で turnover-rate / job-change-rate / prefectural-income を取得
- [ ] `/generate-article-charts`（散布図含む）
- [ ] 記事執筆（**Type B 相関・真因**、`[!WARNING]` で相関≠因果）

---

### 候補 3: NISA時代の金融資産格差（マッチ度: ★★★ / ソース: google-trends + yahoo・クロスソース）

- **トレンド概要**: 「家計の株資産、500兆円超に 10年で倍増、NISA後押し」が Trends・Yahoo・News で同時話題。
- **注目度**: Google Trends「家計」200+、Yahoo「家計金融資産」「NISA」。
- **分類カテゴリ**: economy
- **タイミング**: 新NISA 2年目、資産形成への関心がピーク。**有価証券保有の地域差**は既存記事（savings/deposit 系）の空白。

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 有価証券残高 | DB既存 | `securities-balance` / `current-securities-balance-ratio-multi-person-households` | 株・投信 |
| 金融資産残高 | DB既存 | `financial-assets-balance-multi-person-households` | 総資産 |
| 貯蓄現在高 | DB既存 | `savings-deposit-balance` / `deposit-balance-per-person` | 預貯金との対比 |

#### 記事の切り口（案）

1. **「現金 vs 投資」の地域差**: 預貯金偏重の県 vs 有価証券比率が高い県を対比。NISA で2極化したか。
2. 既存 `savings-rate-gap` / `bank-deposit-balance-shikoku-anomaly` と内部リンク（貯蓄→投資への発展記事に）。

#### 推奨チャート

- 有価証券残高 上位5+下位5 横棒。
- 預貯金 vs 有価証券比率の散布図（資産構成の地域差）。

#### 次のアクション
- [ ] `/fetch-article-data --metric securities-balance` ほか
- [ ] `/generate-article-charts`
- [ ] 記事執筆（Type D: 資産形成の生活含意）

---

### 候補 4: 保育料・保育所の都道府県格差（マッチ度: ★★☆ / ソース: hatena）

- **トレンド概要**: はてブ「働く親が支払う『保育料』なぜ"必要経費"と認めない?」（76 users）が話題。
- **分類カテゴリ**: socialsecurity / educationsports
- **タイミング**: 共働き・税制論争。保育の地域差は子育て世代の移住判断に直結。

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 保育料への支出 | DB既存 | `childcare-fee-consumption-expenditure` | 家計調査 |
| 保育所利用率 | DB既存 | `nursery-utilization-rate` | 充足/待機の代理 |
| 公立保育所比率 | DB既存 | `public-nursery-ratio` / `public-nursery-student-ratio` | 公私の地域差 |
| 保育士1人あたり園児数 | DB既存 | `nursery-children-per-nursery-teacher` | 手厚さ |
| 0-5歳人口あたり保育所数 | DB既存 | `nursery-count-per-100k-0-5` | アクセス |

#### 記事の切り口（案）

1. **「保育料は住む県でいくら違う」**: 支出額の地域差を読者の生活事として提示（Type D）。
2. **充足 vs 手厚さ**: 利用率（量）と保育士1人あたり園児数（質）のトレードオフ。

#### 推奨チャート
- 保育料支出 上位5+下位5 横棒、保育所アクセス（人口あたり）タイルマップ。

#### 次のアクション
- [ ] `/fetch-article-data`（childcare-fee ほか）
- [ ] 記事執筆（Type D）

---

### 候補 5: ふるさと納税（マッチ度: ★★☆ / ソース: hatena + yahoo・クロスソース）

- **トレンド概要**: 「ふるさと納税8百億円赤字 24年度決算、自治体全体で」（はてブ271 users + Yahoo）。
- **分類カテゴリ**: administrativefinancial
- **タイミング**: 制度の是非が再燃。流出県（都市部）と受入県（地方）の対立構造が curiosity gap に最適。

#### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| 寄付金への支出 | DB既存（代理のみ） | `donations-consumption-expenditure` | 家計調査の寄付支出。**ふるさと納税の受入額/控除流出額ではない** |
| ふるさと納税 受入額・控除額（県別） | **未整備** | 総務省「ふるさと納税に関する現況調査」 | e-Stat 外の総務省公開Excel。要別経路取り込み |

#### 記事の切り口（案）

1. **流出県 vs 受入県の二極化**: どの県が「持ち出し」でどの県が「稼いで」いるか。
2. 課題: 核となる受入額/控除額データが未整備。`--deep`（白書ドリブン補完）または総務省Excel取り込みが前提。

#### 次のアクション
- [ ] 総務省「ふるさと納税現況調査」Excel の取り込み可否を調査（`agriculture` の finance-cards 取り込みが手本）
- [ ] データ整備後に記事化（それまで ★☆☆ 据え置き）

---

### 候補 6: 消費税 × 農業所得（マッチ度: ★★☆ / ソース: yahoo）

- **トレンド概要**: 「消費税1%で農家の手取り減 試算」（Yahoo経済）。
- **分類カテゴリ**: agriculture
- **タイミング**: 消費税・インボイス論争と農業所得。

#### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 農業所得率 | DB既存 | `agricultural-income-ratio` | 産出に対する所得 |
| 農業産出額 | DB既存 | `agricultural-output` / `agricultural-output-per-employed-person` | 規模・生産性 |

#### 記事の切り口（案）
1. **農業依存度の地図**: 消費税の影響が大きい＝農業所得依存が高い県を抽出。
2. 政治色を抑え「どの県の農家が制度変更に敏感か」を構造で説明。

#### 次のアクション
- [ ] `/fetch-article-data --metric agricultural-income-ratio`
- [ ] 記事執筆（Type D）

---

## ★☆☆ 候補（簡易リスト・データ未整備 or 弱マッチ）

- **半導体・キオクシア時価総額**（google-news）→ `semiconductor-electronics-regional-map` 既存記事の改善/関連で吸収可。
- **スマホ料金・高齢者**（google-news）→ `communication-cost-burden` 既存。改善候補。
- **生成AI失業**（google-news + yahoo）→ 都道府県データ直結なし（IT集中の代理は弱い）。
- **気候変動・海面水温・津波**（hatena 222 + yahoo）→ ニュースが global/個別。`disaster-damage-per-person` 既存との結びつき弱い。
- **副首都構想/法案**（google-news + yahoo）→ 東京一極集中（人口/経済集中）の間接ネタ。クリーンな県別データなし。

## GSC 既存記事の改善候補（新規記事ではない）

| クエリ | gscType | 流入先 | アクション |
|---|---|---|---|
| うどん消費量ランキング | 急上昇（clicks 7, imp +192%）| /blog/noodle-consumption-prefecture-character | 既存記事の brushup（CTR改善）|
| 生活費 ランキング 都道府県 | 新規（clicks 3）| /blog/household-spending-prefecture-gap | 既存記事の brushup |

---

## 除外トレンド（主なもの）

| トレンド | 除外理由 |
|---|---|
| オリオンビール / ノーヒットノーラン / アリソン / ワールドカップ / ボノ / 闘莉王 / 杜このみ / スポーツナビ | 芸能・スポーツ個人/速報 |
| 皇族数・皇位継承 | 都道府県データに結びつかない |
| 再審制度・死刑執行・国旗損壊罪 | 司法個別論点、統計化困難 |
| G7サミット / 重要鉱物備蓄 / 次期戦闘機 | 国政・外交、県別データなし |
| H3ロケット打ち上げ | 県別統計に乗らない |
| Uber/配車・電動キックボード・路線バス故障 | 個別事案、県別データなし |
| 同性婚 | e-Stat に県別統計なし |
| 膵臓がん薬 / 卵×認知症 / はしか / 夏型肺炎 | 医療ニュース個別、県別化困難 |
| 赤い羽根募金使途不明 | 単発事案 |
| 北大西洋「冷たい斑点」 | 海外の気候現象 |

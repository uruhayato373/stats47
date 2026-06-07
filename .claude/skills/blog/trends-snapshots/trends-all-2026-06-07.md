---
type: trend-discovery
source: all
date: 2026-06-07
tags: [trend, blog-planning]
---

# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-06-07（GSC は 5/26–6/01 vs 5/19–5/25 の WoW）
> ソース: all（trends / gsc / hatena / news / yahoo / note の 6 ソース）
> トレンド総数: 約101件 / 採用: 11件（詳細8 + 簡易3）/ 除外: 約60件
> クロスソースヒット（2ソース以上で出現）: 5件
> 白書エンリッチ: skip（`--whitepaper` 未指定）
>
> ⚠ データ基盤は完全DBレス。マッチングは `packages/data-configs/src/metrics/*.ts`（2,209 metric key）と
> 既存169記事タイトル（`docs/21_ブログ記事原稿/`）に対して実施（SKILL.md の D1 SQL は読み替え）。

## クロスソースヒット（複数ソースで出現）

| # | キーワード | ヒット | ソース | カテゴリ | マッチ度 | 既存記事 |
|---|---|---|---|---|---|---|
| 1 | 大雨・線状降水帯・水害 | 3 | trends, news, yahoo | landweather | ★★★ | 降水量記事のみ（水害は空白）|
| 2 | がん死亡率・飲酒 | 2 | news, note | socialsecurity | ★★★ | なし（がん特化は空白）|
| 3 | 貧困・格差 | 2 | hatena, note | economy | ★★★ | 所得格差はあるが貧困率/Giniは空白 |
| 4 | 転入超過・人口移動 | 2 | note, hatena | population | ★★☆ | population-migration-tokyo-concentration（要差別化）|
| 5 | データセンター建設 | 2 | news, yahoo | energy/ict | ★☆☆ | なし（県別データ未整備）|
| (6)| 大阪都構想 | 2 | news, yahoo | administrativefinancial | ★☆☆ | 統計化困難（統治案）|
| (7)| 飛鳥・藤原 世界遺産/訪日誘致 | 2 | news, yahoo | tourism | ★★☆ | インバウンド記事多数（重複）|

---

## 候補詳細（★★☆ 以上）

### 候補 1: 大雨・線状降水帯・水害（マッチ度: ★★★ / ソース: google-trends, google-news, yahoo / 🎯クロスソース3）

- **トレンド概要**: 6/7 時点で鹿児島・宮崎に線状降水帯発生のおそれ、西日本太平洋側で警報級大雨。Google Trends で「天気」200,000+、「長崎天気」も急上昇。梅雨入りシーズンの定番需要。
- **注目度**: trends 200,000+ / news・yahoo で気象警戒トピックが複数
- **分類カテゴリ**: landweather（国土・気象）
- **タイミング**: 梅雨（6月）＋線状降水帯が実際に発生中。毎年6–7月に再燃する季節需要で評価が長い。
- **ヒットソース数**: 3 / 6 ／ **検出ソース**: google-trends, google-news, yahoo

#### 使えるデータ

| データ | ソース | key / 備考 |
|---|---|---|
| 水害被害額（一般資産・公共土木・総額）| DB既存 | `flood-damage-total` / `flood-damage-general-assets` / `flood-damage-public-infrastructure` |
| 1人あたり災害被害額 | DB既存 | `disaster-damage-amount-per-person` |
| 水害死者・浸水市区町村数 | DB既存 | `flood-casualties-total` / `flood-deaths` / `flood-affected-municipalities` / `flood-affected-rivers` |
| 年間降水量・降水日数 | DB既存 | `annual-precipitation` / `annual-precipitation-days` |

#### 記事の切り口（案）

1. **降水量と被害は一致しない**: 降水量トップ＝静岡（既存記事）でも、水害「被害額」最大は別県。降水量と被害額のズレ＝治水インフラ・地形の差を可視化（archetype B：相関・真因）。
2. **線状降水帯の常襲地**: 浸水市区町村数・水害死者で見る「毎年狙い撃たれる県」。
3. 1人あたり被害額で normalize すると人口の少ない県が上位に来る逆説（archetype A）。

#### 推奨チャート

- 上位5+下位5 横棒（`flood-damage-total` または `disaster-damage-amount-per-person`）
- 散布図：年間降水量 × 水害被害額（相関の弱さ＝治水力の差を示す）

#### 差別化（重複チェック）

- 既存 `annual-precipitation-rainy-season-gap`（降水量・雨日数）は **降水「量」**のみ。本候補は**水害「被害」**で完全に別アングル。重複なし。

#### 次のアクション

- [ ] `/fetch-article-data --metric flood-damage-total disaster-damage-amount-per-person annual-precipitation`
- [ ] `/generate-article-charts`（横棒 + 散布図）
- [ ] 記事執筆（archetype B、`[!WARNING]` で「年により被害が突出＝特定災害年の影響」を注記）

---

### 候補 2: がん死亡率 × 飲酒（マッチ度: ★★★ / ソース: google-news, note / 🎯クロスソース2）

- **トレンド概要**: Google News「がん予防、酒『控えて』少量でもリスク上昇」。note でも「都道府県別がん死亡率ランキングの真実」（がんスクール）が注目上位。
- **注目度**: news 健康トピック / note ランキング系上位
- **分類カテゴリ**: socialsecurity（社会保障・衛生）
- **タイミング**: 飲酒とがんの関係が報道で再燃。健康リテラシー需要は通年で底堅い。
- **ヒットソース数**: 2 / 6 ／ **検出ソース**: google-news, note

#### 使えるデータ

| データ | ソース | key / 備考 |
|---|---|---|
| がん（悪性新生物）死亡率 | DB既存 | `deaths-malignant-neoplasms-per-100k` |
| がん入院・外来受療率 | DB既存 | `treatment-rate-cancer-inpatient` / `treatment-rate-cancer-outpatient` |
| 飲酒量（清酒・ビール・焼酎・ワイン）| DB既存 | `sake-consumption-quantity` / `beer-consumption-quantity` / `shochu-consumption-quantity` / `wine-consumption-quantity` |
| 年齢調整死亡率（交絡補正用）| DB既存 | `age-adjusted-death-rate-male/female-h27-per-1000` |

#### 記事の切り口（案）

1. **「酒を飲む県ほどがんで死ぬ」は本当か**: 飲酒量とがん死亡率の相関を散布図で検証（archetype B：相関・真因）。報道の主張をデータで裏取り。
2. **見かけの相関 vs 真因**: がん死亡率は高齢化率に強く引っ張られる → 年齢調整死亡率で補正すると相関が消える/残るかを示す（`[!WARNING]` 相関≠因果の好例）。

#### 推奨チャート

- 散布図：飲酒量（清酒 or 合算）× がん死亡率（相関係数を明示）
- 上位5+下位5 横棒：`deaths-malignant-neoplasms-per-100k`

#### 差別化（重複チェック）

- 既存 `alcohol-prefecture-map`（飲酒地図の居住地ベース補正）と `health-life-expectancy-structure` は別テーマ。がん死亡率 × 飲酒の**相関検証**は新規。note 競合（がんスクール）に対し「相関≠因果」で差別化。

#### 次のアクション

- [ ] `/fetch-article-data --metric deaths-malignant-neoplasms-per-100k sake-consumption-quantity age-adjusted-death-rate-male-h27-per-1000`
- [ ] `/generate-article-charts`（散布図 + 横棒）
- [ ] 記事執筆（archetype B、相関≠因果を `[!WARNING]` で必須）

---

### 候補 3: 空き家率（マッチ度: ★★★ / ソース: note, hatena）

- **トレンド概要**: note ランキング上位「秋田県の空き家リスクが全国ワースト――空き家問題と人口減少の相関分析」。hatena「つくば市が急成長／地方都市の成長」も人口・住宅の文脈。
- **注目度**: note rank 9（直接競合が空き家でランキング記事化）
- **分類カテゴリ**: construction（住宅・土地・建設）
- **タイミング**: 住宅・土地統計調査ベースの定番テーマ。人口減少報道と連動して通年需要。
- **ヒットソース数**: 2 / 6（テーマ近接）／ **検出ソース**: note, hatena

#### 使えるデータ

| データ | ソース | key / 備考 |
|---|---|---|
| 空き家率 | DB既存 | `vacant-housing-rate` / `vacant-housing-ratio` |
| 1世帯あたり人員・持ち家率 | DB既存 | `average-persons-per-general-household` / `detached-house-ratio` |
| 人口移動（転出超過との相関用）| DB既存 | `moving-out-rate` / `population-migration-net-municipality` |

#### 記事の切り口（案）

1. **空き家率トップは別荘地ではない**: 観光地（山梨・長野の別荘）と地方過疎（秋田・高知）で「空き家」の意味が違う。空き家率 × 人口減少率の散布図で「リゾート型 vs 過疎型」を分離（archetype B/D）。
2. **空き家が増える順番**: 人口が減る「前」に空き家が増える県の構造。

#### 推奨チャート

- 上位5+下位5 横棒：`vacant-housing-rate`
- 散布図：空き家率 × 人口減少率（転出超過率）

#### 差別化（重複チェック）

- 既存169記事に空き家テーマ **なし**＝コンテンツギャップ。note 競合（秋田ワースト）に対し「別荘型 vs 過疎型の分離」で差別化。

#### 次のアクション

- [ ] `/fetch-article-data --metric vacant-housing-rate moving-out-rate detached-house-ratio`
- [ ] `/generate-article-charts`（横棒 + 散布図）
- [ ] 記事執筆（archetype B または D）

---

### 候補 4: 貧困・格差（生活保護率 / Gini）（マッチ度: ★★★ / ソース: hatena, note / 🎯クロスソース2）

- **トレンド概要**: hatena「低所得者ほど家計が破綻 セーフティーネットを守れ」「努力できるかは生まれで決まる（遺伝と格差）」「AIは頭が良い人をより賢く（知的格差）」が複数上位。note でも「貧困率の高い都道府県ランキング」「格差変動スコア」。
- **注目度**: hatena 81/45/97 ブクマ + note rank 3・10
- **分類カテゴリ**: economy（企業・家計・経済）
- **タイミング**: 格差・貧困は通年テーマ。物価高・セーフティーネット報道で底堅い。
- **ヒットソース数**: 2 / 6 ／ **検出ソース**: hatena, note

#### 使えるデータ

| データ | ソース | key / 備考 |
|---|---|---|
| Gini係数（可処分所得）| DB既存 | `gini-coefficient-disposable-income` |
| 生活保護世帯率 | DB既存 | `households-on-public-assistance-per-1000` / `households-on-public-assistance` |
| 高齢者の生活保護率 | DB既存 | `elderly-on-public-assistance-per-1000-65plus` |
| 県民所得（既存記事と接続）| DB既存 | `per-capita-income`（per-capita-income-gap 記事あり）|

#### 記事の切り口（案）

1. **「貧困率」と「県民所得」は別物**: 所得が高い都市部でも Gini（県内格差）が大きい逆説。所得水準（既存記事）に対し「分配のばらつき」を補完（archetype D：生活含意）。
2. **生活保護率は大阪が突出**: 最少県との倍率、高齢化との関係。`[!WARNING]` で「保護率は申請のしやすさ・行政運用差も反映」。

#### 推奨チャート

- 上位5+下位5 横棒：`households-on-public-assistance-per-1000`
- 散布図：県民所得 × Gini係数（豊かさと格差が一致しない）

#### 差別化（重複チェック）

- 既存 `per-capita-income-gap` `household-income-tokyo-okinawa` `wage-vs-living-cost` は**所得水準**。本候補は**格差の散らばり（Gini）・貧困（生活保護率）**で別軸。note 競合の貧困率ランキングに「Gini で分配を見る」で差別化。

#### 次のアクション

- [ ] `/fetch-article-data --metric households-on-public-assistance-per-1000 gini-coefficient-disposable-income per-capita-income`
- [ ] `/generate-article-charts`
- [ ] 記事執筆（archetype D、行政運用差を `[!WARNING]`）

---

### 候補 5: 転入超過・人口移動（マッチ度: ★★☆ / ソース: note, hatena）

- **トレンド概要**: note 注目上位を「転入超過数」「転入者数」「持続可能性スコア」が占める（直接競合 data_analyst_jp / gauchi_marketing）。hatena「つくば市が急成長、水戸に追いつくか」。
- **注目度**: note rank 1・4・5・8（人口・移動・消滅が上位独占）
- **分類カテゴリ**: population（人口・世帯）
- **タイミング**: 住民基本台帳人口移動報告（毎年1月公表）ベースで通年需要。競合の参入が濃い＝検索需要が大きい裏返し。
- **ヒットソース数**: 2 / 6 ／ **検出ソース**: note, hatena

#### 使えるデータ

| データ | ソース | key / 備考 |
|---|---|---|
| 転入超過率（総数・日本人）| DB既存 | `moving-in-excess-rate` / `moving-in-excess-rate-japanese` |
| 転入率・転出率 | DB既存 | `moving-in-rate` / `moving-out-rate` |
| 市区町村別 純移動（転入−転出）| DB既存 | `population-migration-net-municipality` |
| 都道府県間 移動フロー | DB既存 | `population-migration-inter-prefecture`（Sankey 着地ビューあり）|

#### 記事の切り口（案）

1. **市区町村粒度で「勝ち負け」**: 県単位では負けでも市区町村で勝つ自治体（つくば等）。`population-migration-net-municipality` で「県内の明暗」を可視化（既存の県レベル記事と差別化）。
2. 転入超過が続く数少ない地方県の共通項。

#### 差別化（重複チェック）

- 既存 `population-migration-tokyo-concentration`（首都圏3県の昼間人口逆説）と重複リスク。**市区町村粒度**または**最新年（2025/2026公表）の更新**で差別化する。新規より既存記事の年次更新 + 内部リンク強化が効率的な可能性。

#### 次のアクション

- [ ] 既存記事 `population-migration-tokyo-concentration` の最新年更新を先に検討（重複回避）
- [ ] 新規なら市区町村純移動アングルで `/fetch-article-data --metric population-migration-net-municipality moving-in-excess-rate`

---

## 簡易候補（★☆☆ ＝ データ未整備／統計化困難。将来の e-Stat 追加待ち）

- **クマ出没・鳥獣被害**（yahoo: クマ出没／サル出没）— safetyenvironment/agriculture。**県別の鳥獣被害額メトリクスが stats47 に未整備**（農水省「野生鳥獣による農作物被害」が候補）。公共の関心は高い → `--deep` 補完候補。
- **ふるさと納税（受入額）**（note rank15）— administrativefinancial。`donations-prefecture`（歳入の寄附金）はあるが**ふるさと納税受入額の専用メトリクスは未整備**。総務省「ふるさと納税に関する現況調査」が候補。
- **感染症流行（はしか/水痘/インフル）**（news: 水痘・はしか・ハンタ）— socialsecurity。**県別の感染症罹患率メトリクスが未整備**（NESID/感染症発生動向調査が候補）。
- **データセンター建設**（news+yahoo クロス）— energy/ict。県別データセンター数の公的統計が乏しく、`electricity-demand` での間接アプローチのみ。★☆☆。

---

## GSC からの示唆（新規記事より既存改善が有効）

GSC WoW で表示急増したクエリはほぼ 1 件に集約：

| クエリ | 種別 | 表示 | 流入先 |
|---|---|---|---|
| 中国地方5県のうち乳用牛の飼育頭数がもっとも多いのは…？ | 表示急増 | 465 | /ranking/dairy-cattle-count |
| 乳用牛 都道府県 ランキング | 表示急増 | 161 | /blog/dairy-cattle-hokkaido-monopoly |

- クイズ／教材系の検索（中国地方・乳用牛）が急増、表示465でクリックほぼ0＝**CTR/強調スニペット改善の機会**。
- → 新規記事ではなく、既存 `dairy-cattle-hokkaido-monopoly` の **brushup**（「中国地方で乳用牛が最も多いのは岡山/島根…」を本文・見出しで明示し snippet 化）を推奨。`/brushup-blog --target article dairy-cattle-hokkaido-monopoly`。

---

## 除外トレンド（主なもの）

| トレンド | 除外理由 |
|---|---|
| brasil x egito / マテウスブエノ / 鹿島移籍 | スポーツ・選手個人 |
| パラオ / サハラ砂漠 / NATO / レアメタル輸出規制 | 海外ニュース（県別データに接続しない）|
| 市川市動植物園サル / 海水浴溺水 / 詐欺グループ / 国旗損壊罪 / 不貞行為最高裁 | 個別事件・速報・司法個別 |
| 皇族数確保 / 議席削減 / 都構想 | 統治・制度案で県別統計化が困難（都構想は弱マッチで(6)に記載）|
| 神童・貧困 / 遺伝と格差 / 修学旅行 / フライドポテト死亡 | エッセイ・個人事象（テーマは候補4の格差に吸収）|
| ビットコイン / 円安 / 日経平均 / 日銀 | マクロ経済で県別粒度なし |
| ISS空気漏れ / 新種化石 / 腎臓病薬(ネコ) / スバル輸入 | 県別統計と無関係 |

---

## 推奨アクション（優先順）

1. **最優先：候補1「水害・線状降水帯」** — 季節需要が実際に発生中（6/7 鹿児島・宮崎に線状降水帯）。3ソースクロス＋データ充実＋既存記事と非重複。`flood-damage-total` × `annual-precipitation` の散布図で「降水量≠被害」を示す archetype B。今週中に着手すれば旬を捉えられる。
2. **候補3「空き家率」** — コンテンツギャップ（既存記事ゼロ）＋ note 競合が直接ランキング化＝検索需要の裏付け。データ（`vacant-housing-rate`）も完備。
3. **候補2「がん死亡率×飲酒」** — 報道フック＋note競合あり。相関≠因果で差別化できる良質な archetype B。
4. **候補4「貧困・格差（Gini/生活保護率）」** — 通年需要、既存所得記事を補完。
5. **GSC示唆：既存 `dairy-cattle-hokkaido-monopoly` の brushup**（中国地方クイズの snippet 化、低コスト高効率）。
6. データ未整備の「クマ出没・鳥獣被害」は需要が高く、`/discover-trends --whitepaper --deep` または `/search-estat 野生鳥獣 農作物被害` で将来の e-Stat 取り込みを検討。

# トレンド × stats47 マッチング結果（source: all）

> 調査日時: 2026-05-19 09:30 JST
> ソース: trends / gsc / hatena / news / yahoo / note （6ソース統合）
> トレンド総数: 約 140件 / 採用: 25件 / 除外: 約 90件
> クロスソースヒット (≥3 ソース): 3件
> 注目候補 (2 ソース): 7件

## クロスソースヒット (3 ソース以上で出現)

| # | キーワード | ヒット数 | ソース | カテゴリ | マッチ度 | 既存記事 |
|---|---|---|---|---|---|---|
| 1 | ナフサショック / ナフサ不足 | 4 | trends, hatena, news, yahoo | energy / commercial | ★★☆ | なし |
| 2 | マイナンバー取得義務化 | 3 | hatena, news, yahoo | administrativefinancial | ★☆☆ | なし |
| 3 | 真夏日・初猛暑日（5月） | 3 | trends(関連), news, yahoo(科学) | landweather | ★★★ | なし |

## 注目候補 (2 ソースで出現)

| # | キーワード | ソース | カテゴリ | マッチ度 |
|---|---|---|---|---|
| 4 | 日産横浜工場縮小 | news, yahoo(business) | miningindustry / laborwage | ★★★ |
| 5 | 飲食店倒産（居酒屋・ココイチ・書泉） | hatena, news, yahoo | commercial | ★★★ |
| 6 | ストレス検査義務化拡大（28年〜） | news, yahoo | laborwage / socialsecurity | ★★☆ |
| 7 | 補正予算編成（高市政権） | news, yahoo | administrativefinancial | ★☆☆ |
| 8 | エボラ / ハンタウイルス感染症 | news(健康), yahoo(科学) | socialsecurity | ★★☆ |
| 9 | 内閣支持率68% | news, yahoo | administrativefinancial | ★☆☆ |
| 10 | LIXIL住宅設備値上げ | hatena, news | construction / economy | ★★☆ |

## 単一ソース（注目度の高いもの）

| # | キーワード | ソース | popularity | カテゴリ | マッチ度 |
|---|---|---|---|---|---|
| 11 | 一般病床の病床利用率 | gsc | 5 clicks / 35+48 impr | socialsecurity | ★★★ |
| 12 | 西武池袋線・沿線格差 | trends | 200+ | construction / tourism | ★★☆ |
| 13 | スルメイカ漁獲枠231トン超過 | hatena | 32 ブクマ | agriculture | ★★★ |
| 14 | 無印良品 vs ニトリ 業績格差 | hatena | 468 ブクマ | commercial | ★★☆ |
| 15 | 学校が暑くて寒い問題 | hatena | 27 ブクマ | educationsports / construction | ★★☆ |
| 16 | クマ目撃多発（青森くまログ） | news, yahoo(科学) | - | safetyenvironment | ★★☆ |
| 17 | 大阪都構想・吉村洋文出馬 | news | - | administrativefinancial | ★☆☆ |
| 18 | エルニーニョでも日本猛暑か | yahoo(科学) | - | landweather | ★★★ |
| 19 | 47都道府県転入超過数 | note | - | population | ★★★ |
| 20 | 47都道府県 学級規模・教員配置 | note | - | educationsports | ★★★ |
| 21 | 転職と年収の相関（地域別） | note | - | laborwage | ★★☆ |

---

# 候補詳細

## 候補1: ナフサショック（マッチ度: ★★☆ / ヒット: 4 ソース）

- **ヒットソース数**: 4 / 6
- **検出ソース**: google-trends, hatena, google-news, yahoo
- **ソース別注目度**:
  - google-trends: 200+（急上昇 #3）
  - hatena: 36 ブクマ（靴製造ピンチ記事）
  - google-news: ナフサ不足の特集が複数（NHK・テレ朝・読売・FNN）
  - yahoo(business): 「ナフサ不足 暑さ対策グッズに影響」(12:03 GMT)
- **トレンド概要**: 中東情勢悪化で石油化学原料ナフサが不足し、エアコン・保冷剤・靴・接着剤など幅広い消費財に値上げ波及。LIXIL も住宅設備値上げを発表。
- **分類カテゴリ**: energy / commercial / construction
- **タイミング**: 中東情勢×ナフサショックは直近 1 週間で急速に話題化。具体的な値上げ製品リストが続々発表され、夏本番前の家計影響として読者関心が高い。

### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| 製造品出荷額 | DB既存 | manufacturing-shipment-amount | 化学工業の都道府県別出荷規模 |
| ガソリン販売量 | DB既存 | gasoline-sales-volume | 石油価格上昇連動 |
| ガソリン消費支出額 | DB既存 | gasoline-consumption-expenditure | 家計影響 |
| ルームエアコン所有数量 | DB既存 | room-aircon-ownership-multi-person-households-per-1000 | 値上げ影響対象 |
| ガラス室・プラスチックハウス設置状況 | e-Stat候補 | 0003364033 | 農業×プラ価格 |

※ ナフサそのものの都道府県別データはなし。化学工業出荷額（千葉・神奈川・大阪などコンビナート県）で代替。

### 記事の切り口（案）

1. **「ナフサショックで値上げ直撃」家計と住宅コストへの都道府県別影響**: ガソリン消費 + エアコン保有率 + 住宅着工で「値上げ家計負担インパクト」マップを作る
2. **「化学コンビナート県」と日本の供給網**: 千葉・神奈川・大阪・岡山など石油化学集積県を地図化し、ナフサ価格高騰がローカル経済に与える影響
3. **「猛暑×ナフサ値上げ」のダブルパンチ**: エアコン使用増 × 保冷剤・冷感グッズ値上げを最高気温データと組み合わせ

### 推奨チャート

- ヒートマップ: 化学工業出荷額（製造品出荷額）の都道府県分布
- バーチャート: ガソリン消費支出額 都道府県ランキング
- 散布図: 最高気温 × ルームエアコン所有率

### 次のアクション

- [ ] `/fetch-article-data` で chemical-shipment / gasoline-expenditure / aircon-ownership 取得
- [ ] `/generate-article-charts` でヒートマップ + 散布図
- [ ] 記事執筆（5/20〜21 投入で旬を逃さない）

---

## 候補2: 真夏日・初猛暑日（マッチ度: ★★★ / ヒット: 3 ソース）

- **ヒットソース数**: 3 / 6
- **検出ソース**: google-trends(関連), google-news, yahoo(科学)
- **ソース別注目度**:
  - google-news: 「今日18日は全国で初猛暑日など記録ずくめの暑さ」「24日以降もかなりの高温」
  - yahoo(科学): 「今夏 エルニーニョでも日本猛暑か」「エアコンためらい熱中症 医師警鐘」
  - google-trends: ナフサショック関連で「暑さ対策グッズ」が複数言及
- **トレンド概要**: 5/18 に全国で 5月過去最多級の真夏日・猛暑日記録。エルニーニョ年でも夏の高温予想。熱中症リスクと電気代不安が同時話題化。
- **分類カテゴリ**: landweather / socialsecurity / energy
- **タイミング**: ★★★ 季節性ど真ん中。5月後半〜6月で「都道府県別の暑さリスク」を出せば SEO 上強い

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 年平均気温 | DB既存 | average-temperature | |
| 最高気温 | DB既存 | maximum-temperature | ★ 主軸 |
| 最低気温 | DB既存 | lowest-temperature | |
| ルームエアコン所有数量 | DB既存 | room-aircon-ownership-multi-person-households-per-1000 | 防御指標 |
| 電気代/光熱費（推定: 家計調査） | DB未確認 | - | 要確認 |
| 神経症性障害・ストレス受療率（外来） | DB既存 | treatment-rate-neurosis-outpatient | 暑熱ストレス代理 |

### 記事の切り口（案）

1. **「5月で猛暑日 全国記録」47都道府県の最高気温ランキング**: 5月という季節外れの猛暑を都道府県別に切る
2. **「エアコン我慢の県・冷房過多の県」 最高気温 × エアコン保有率の食い違い**: 暑いのにエアコン少ない県のリスク
3. **「猛暑×熱中症受療率」 暑い県ほど病気が増えるのか**: 気温と病院受療データの相関

### 推奨チャート

- 47都道府県 最高気温ヒートマップ
- 散布図: 最高気温 × エアコン保有率
- バーチャート: 1日平均外来患者数（夏季比較）

### 次のアクション

- [ ] `/fetch-article-data` で maximum-temperature / aircon-ownership 取得
- [ ] 記事執筆 5/21 までに公開（猛暑トレンド真っ最中）

---

## 候補3: 一般病床の病床利用率（マッチ度: ★★★ / ソース: gsc）

- **ヒットソース数**: 1 (GSC 自社需要)
- **検出ソース**: gsc
- **今期クリック**: 5 + 3 (派生クエリ) (前期比: +∞%、新規/急上昇)
- **今期表示**: 35 + 48 = 83 (前期比: 表示急増 +1066%)
- **現在の流入先**: 既存記事 `hospital-bed-utilization-map`（「病床は埋まっているか? 47都道府県」）
- **gscType**: 急上昇 / 新規（同一テーマで 2 クエリ）

### コンテンツギャップ分析

- **検索クエリ**:「一般病床の病床利用率が最も高い都道府県は？」「同（疑問符なし）」
- **流入先**: `/blog/hospital-bed-utilization-map` に流入は来ているが、クリック5/表示35 = CTR 14%（疑問形クエリで通常 15-20% 想定）
- **コンテンツギャップ**: 「最も高い都道府県は？」という疑問に **冒頭で 1 行で答える FAQ ブロック** が無い可能性。読者は答えが見えず離脱しているか、答えがクリック前に SERP の strong-snippet で完結している
- **判定**: 新規記事ではなく **既存記事の SEO 改善** が正解

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 一般病院病床利用率 | DB既存 | general-hospital-bed-occupancy-rate | year=2023 |
| 病床利用率 | DB既存 | bed-utilization-rate | year=2024 |
| 精神科病院病床利用率 | DB既存 | psychiatric-hospital-bed-occupancy-rate | year=2023 |
| 病院の病床数 | e-Stat候補 | 0003295947 | 厚労省・追加データ |
| 病院の人口10万対病床数 | e-Stat候補 | 0003295950 | 厚労省 |

### 記事の切り口（案・既存記事改善）

1. **記事冒頭に FAQ 追加**: 「Q: 病床利用率が最も高い都道府県は？ A: 〇〇県(△△%)」を最初の H2 に置く
2. **派生クエリ向け関連記事追加**: 「全国平均」「最も低い県」「年次推移」など派生クエリも内部リンクで取り込む
3. **2024 年データへの更新**: `bed-utilization-rate` (year=2024) を反映

### 次のアクション

- [ ] **(優先)** 既存記事 `hospital-bed-utilization-map` の MDX を開き、冒頭に FAQ ブロック追加
- [ ] `/proofread-article` で SEO 観点チェック
- [ ] `/sync-snapshots --only blog` でデプロイ

---

## 候補4: 47都道府県転入超過数ランキング（マッチ度: ★★★ / ソース: note）

- **ヒットソース数**: 1 (note)
- **検出ソース**: note
- **トレンド概要**: 2026年2月住基台帳人口移動報告の発表で、note 上で「47都道府県転入超過数」「2050年人口減少」など複数記事が話題化。
- **分類カテゴリ**: population
- **タイミング**: 2025年データが2月に出たばかりで需要継続。GW 移住記事の延長線でも読まれる

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 転入超過率 | DB既存 | moving-in-excess-rate / moving-in-excess-rate-japanese | ★ 主軸 |
| 転入率 | DB既存 | moving-in-rate | |
| 社会増減率 | DB既存 | social-increase-rate | |
| 社会増減数 | DB既存 | social-increase | |
| 流出人口比率 | DB既存 | outflow-population-ratio | |

既存記事との重複: `inflow-population-ratio-prefecture-gap`（流入人口比率 281倍格差）あり。**切り口を変える必要**。

### 記事の切り口（案）

1. **「2025年最新版 転入超過数 完全ランキング」 5年で順位が動いた県・動かなかった県**: 直近5年の推移で切る（過去記事は流入人口の静的比較）
2. **「日本人 vs 全体」 転入超過の構造差**: `moving-in-excess-rate` と `moving-in-excess-rate-japanese` を比較し外国人流入の影響を可視化
3. **「転入が増えたのに人口減少県は？」 自然減と社会増のせめぎ合い**

### 推奨チャート

- バーチャート: 2025年転入超過数ランキング（プラス・マイナス分け）
- ライン: 直近5年の上位/下位5県の推移
- 散布図: 社会増減 × 自然増減

### 次のアクション

- [ ] `/fetch-article-data` で moving-in-excess-rate + social-increase 取得
- [ ] 既存 `inflow-population-ratio-prefecture-gap` と差別化を明示（時系列推移 vs 静的格差）

---

## 候補5: 47都道府県 学級規模・教員配置（マッチ度: ★★★ / ソース: note）

- **ヒットソース数**: 1 (note)
- **検出ソース**: note (data_analyst_jp が 11 指標で47都道府県分析)
- **トレンド概要**: note で「学級規模と教員配置」分析が公開され、高知県が "少人数×高コスト" 型でWORST1位という切り口が注目。
- **分類カテゴリ**: educationsports

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 小学校数 | DB既存 | elementary-school-count-per-100km2-habitable | |
| 中学校数 | DB既存 | junior-high-school-count-per-100km2-habitable | |
| 高等学校数 | DB既存 | high-school-count-per-100km2-habitable | |
| 公立小学校費 | DB既存 | per-child-public-elementary-school-expenditure-pref-municipal | コスト |
| 小学校教員割合（女性） | DB既存 | elementary-school-teachers-ratio-female | |
| 公立小学校プール設置率 | DB既存 | public-elementary-school-pool-installation-rate | 学校施設 |

既存記事 `female-lecture-prefecture-gap` あり（女性学級605倍格差）。**学級規模での切り口は競合 note 記事と差別化必要**。

### 記事の切り口（案）

1. **「教員1人あたり児童数」47都道府県ランキング**: コスト効率と教育機会の両面で
2. **「公立小学校1校あたり児童数」過疎県の学校維持コスト**: 高知・島根など過疎県の構造課題
3. **「学校施設の充実度」プール・体育館・トイレ設置率の県間格差**: ハードウェア面の格差

---

## 候補6: 日産横浜工場縮小（マッチ度: ★★★ / ヒット: 2 ソース）

- **検出ソース**: news, yahoo(business)
- **トレンド概要**: 日産が創業の地・横浜工場の縮小検討を発表（5/18）。神奈川県の製造業地図と雇用への影響が論点。
- **分類カテゴリ**: miningindustry / laborwage

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 製造品出荷額等 | DB既存 | manufacturing-shipment-amount | |
| 製造業従業者数 | DB既存 | manufacturing-employees | |
| 製造業事業所数 | DB既存 | manufacturing-establishments | |
| 製造業付加価値額 | DB既存 | manufacturing-industry-added-value | |
| 自動車関連消費 | DB既存 | car-purchase-consumption-expenditure 等 | |

既存記事 `manufacturing-shipment-prefecture-ranking`（愛知58兆円一強）あり。**自動車産業に絞った切り口で差別化**

### 記事の切り口（案）

1. **「自動車製造業の県別シェア」 トヨタ vs 日産 vs ホンダの地理**: 神奈川・愛知・静岡・栃木・三重・福岡を中心に
2. **「製造業従業者比率」 工場縮小が県経済に与えるインパクト**: 神奈川は製造業比率がどれくらいか、依存度ランキング
3. **「製造品出荷額 vs 付加価値率」 出荷量で稼ぐ県・付加価値で稼ぐ県**

---

## 候補7: 飲食店倒産（居酒屋・ココイチ）vs 大手最高益（マッチ度: ★★★ / ヒット: 2 ソース）

- **検出ソース**: hatena (老舗書泉黒字転換 149 / 無印良品 vs ニトリ 468), yahoo(business) (居酒屋倒産 / ココイチ1200円の壁)
- **トレンド概要**: 中小飲食店倒産増の一方、大手チェーンは最高益。消費二極化のトレンド。
- **分類カテゴリ**: commercial

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 飲食店数 | DB既存 | restaurant-count-per-1000 | ★ |
| 小売店数 | DB既存 | retail-store-count-per-1000 | |
| 大型小売店数 | DB既存 | large-retail-store-count-per-100k | |
| コンビニエンスストア店舗数 | DB既存 | convenience-store-count-commercial | |
| 飲食物調理従事者の平均年収 | DB既存 | cook-annual-income | |

既存記事複数あり（food-spending-pattern / food-consumption-prefecture-battle）が、いずれも「消費」側。**店舗側 (供給) からの切り口は未着**

### 記事の切り口（案）

1. **「飲食店密度ランキング」 大阪・東京の高密度と過疎県のギャップ**: restaurant-count-per-1000
2. **「大型店 vs コンビニ依存度」 47都道府県の小売構造マップ**: 県別の流通チャネル構造
3. **「飲食業従事者の年収」 雇用条件で県を比較**

---

## 候補8: ストレス検査義務化拡大（2028年〜）（マッチ度: ★★☆ / ヒット: 2 ソース）

- **検出ソース**: news, yahoo(domestic)
- **トレンド概要**: ストレスチェック制度の対象事業者を拡大する方針。労働者メンタルヘルスへの注目度UP。
- **分類カテゴリ**: laborwage / socialsecurity

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 月間平均実労働時間 | DB既存 | monthly-average-actual-working-hours-male/female | |
| 神経症性障害・ストレス関連障害の受療率（外来） | DB既存 | treatment-rate-neurosis-outpatient | ★ |
| 神経症性障害・ストレス関連障害の受療率（入院） | DB既存 | treatment-rate-neurosis-inpatient | ★ |

### 記事の切り口（案）

1. **「労働時間×メンタル受療率」47都道府県の働き方リスクマップ**: 散布図で県を象限分け
2. **「ストレス受療率トップ10県」の特徴**: 都市部 vs 地方の差

---

## 候補9: スルメイカ漁獲枠超過（マッチ度: ★★★ / ソース: hatena）

- **検出ソース**: hatena (32 ブクマ・47news)
- **トレンド概要**: 2025年度スルメイカ漁獲枠を 231 トン超過。資源管理問題が再浮上。
- **分類カテゴリ**: agriculture（水産）

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| スルメイカ漁獲量 | DB既存 | fishery-species-catch-japanese-squid | ★ ピンポイント |
| 海面漁業漁獲量 | DB既存 | marine-fishery-catch | |
| 海面漁業産出額 | DB既存 | marine-fishery-output-value | |
| 漁業就業者数 | DB既存 | fishery-workers | |

既存記事 `bonito-catch-prefecture` / `bonito-catch-zero-prefectures-gap` あり。**魚種を変えてシリーズ化可能**

### 記事の切り口（案）

1. **「スルメイカ漁獲ランキング」 北海道・青森・石川の凋落と漁獲枠**: 直近 10 年の推移 + 漁獲枠超過問題
2. **「日本のスルメイカ消費」 漁獲減 vs 食卓**: イカ消費支出と漁獲量の乖離

---

## 候補10: 西武池袋線・沿線格差（マッチ度: ★★☆ / ソース: trends）

- **検出ソース**: google-trends (200+)
- **トレンド概要**: J-CAST「充実の西武池袋線に比べ、ぱっとしない西武新宿線... 沿線格差解消へ動き加速」。鉄道沿線比較の話題。
- **分類カテゴリ**: construction / tourism

### 使えるデータ

| データ | ソース | ranking_key | 備考 |
|---|---|---|---|
| 鉄道駅数 | DB既存 | railway-station-count | |
| 鉄道通勤者数 | DB既存 | commute-by-train | |
| 鉄道運賃消費支出額 | DB既存 | train-fare-consumption-expenditure | |
| 鉄道通勤定期代消費支出額 | DB既存 | train-commuter-pass-consumption-expenditure | |

既存記事 `train-commuters-prefecture-gap` あり（799倍格差）。**沿線レベルは47都道府県データでは粒度不足**。**県全体の「鉄道依存度」での再切り口は可能**

### 記事の切り口（案）

1. **「鉄道通勤に頼る県・車に頼る県」 47都道府県の通勤手段マップ**: 既存記事をアップデート（通勤手段の比較ランキング）
2. **「鉄道運賃支出 vs 自動車関連支出」 県別の交通コスト構造**

★☆☆ 候補なのは「沿線格差」テーマは県粒度では応えられないため。スコア再評価で ★★☆ → ★☆☆ にダウングレード。

---

## 候補11以降（★☆☆ 簡易リスト）

| # | キーワード | カテゴリ | 短評 |
|---|---|---|---|
| 11 | マイナンバー取得義務化 | administrativefinancial | 都道府県別マイナ普及率データが必要、現在 DB 未収録 |
| 12 | 補正予算 | administrativefinancial | 政治マクロ、都道府県粒度に降ろせない |
| 13 | LIXIL住宅設備値上げ | construction | 住宅着工データはあるが値上げ影響は時系列で要再分析 |
| 14 | 内閣支持率68% | administrativefinancial | 県別データなし |
| 15 | エボラ / ハンタウイルス | socialsecurity | 国内発生していないので県別データ困難。「感染症対策病床数」「予防接種接種者数」(e-Stat 0004027806) で間接的に書ける |
| 16 | クマ目撃多発 | safetyenvironment | クマ目撃データ DB なし。鳥獣被害は農林水産省・環境省データ調査必要 |
| 17 | 学校が暑くて寒い | educationsports / construction | 学校の冷房設置率データは未収録 |
| 18 | エルニーニョでも猛暑か | landweather | 候補2 と統合済 |
| 19 | 国保支払い・税負担 | socialsecurity | 国民健康保険被保険者数 / 受診率 から書けるが切り口要工夫 |
| 20 | 闇バイト・特殊詐欺 | safetyenvironment | 窃盗犯認知件数あり、特殊詐欺は要新規取得 |

---

## 除外トレンド（主なもの）

| トレンド | 除外理由 |
|---|---|
| 山岡泰輔・ジョアンペドロ・メッシ・坂口杏里・小林聡美・森圭介・郷田真隆 | 芸能人/スポーツ選手個人ニュース |
| サル山侵入・15歳ユキヒョウ死亡 | 個別動物園話題、統計化困難 |
| Forza Horizon 6・あおぎり高校・内村笑学校・豊臣兄弟 | ゲーム/番組/作品単発 |
| 米サンディエゴ銃撃・トランプ対イラン・ゼレンスキー・WHO総会台湾 | 海外ニュース（県別データに紐づかない） |
| 仁徳天皇陵 / 20日夜空にスマイル | 考古・天文の単発話題 |
| 警官引きずられ・トンネル事故・100cmヘビ脱走 | 個別事件速報 |
| ロリコンブーム前史・限界OL鼻切ギリ子 | エッセイ/漫画 |
| 高市氏陣営中傷投稿（個人スキャンダル部分） | 政治家個人スキャンダル（政策関連は別途扱い） |

---

## 推奨アクション（優先順）

1. **【最優先・即書ける】候補3: 病床利用率 既存記事の SEO 改善** — `hospital-bed-utilization-map` MDX に FAQ ブロック追加。GSC で実需要が出ているため確実な流入増。 30 分で完了可能。
2. **【季節性最重要】候補2: 真夏日・5月猛暑 → 47都道府県 最高気温ランキング記事** — 5/21 までに公開。検索需要のピークと一致。
3. **【クロスソース最強】候補1: ナフサショック × 化学工業県** — 5/22-23 公開で「夏前の値上げ家計影響」コンテクストに乗せる。3ソースで報道密度が高いため SEO で食い込み可能。
4. **【構造分析】候補6 (日産工場縮小) or 候補7 (飲食店二極化)** — どちらも DB データ豊富、来週後半に追加。
5. **【シリーズ化】候補9: スルメイカ漁獲量** — 既存 bonito-catch シリーズの延長で書ける。週末公開向け。

---

## 補足: スキル実行メタ

- 6 ソース並列 WebFetch + GSC API 取得
- note.com WebFetch は HTTP 500 で失敗 → WebSearch 2 回でフォールバック
- 既存 47 都道府県 metric (`metrics` テーブル) と既存記事 (`articles` テーブル) を 14 キーワードでクロス検索
- 既存記事との重複・差別化ポイントを明示

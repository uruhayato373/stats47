# 人口・世帯（population）— ブログ記事企画

> 生成日: 2026-03-09
> 既存指標数: 264件（データあり）
> 企画数: 5件

---

## 記事企画: birth-rate-fertility-ranking

- title: "出生率ランキング"
- subtitle: "（実データに基づいて設定）"
- category: population
- tags: [出生率, 合計特殊出生率, 少子化, 人口減少]
- target: 子育て世帯、少子化問題に関心がある人
- seo_keywords: [都道府県 出生率 ランキング, 合計特殊出生率 高い県, 少子化 都道府県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 合計特殊出生率 | DB既存 | total-fertility-rate | 2023年 |
| 粗出生率 | DB既存 | crude-birth-rate | 2023年 |
| 婚姻率 | DB既存 | marriages-per-total-population | 2022年 |
| 平均婚姻年齢（初婚の妻） | DB既存 | average-age-of-first-marriage-wife | 2023年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 合計特殊出生率 | 上位10・下位10 |
| 2 | tile-grid-map | 合計特殊出生率 | 地域パターン |
| 3 | scatter | 合計特殊出生率 × 婚姻年齢 | 晩婚化と出生率 |
| 4 | line | 合計特殊出生率の推移 | 長期トレンド |
| 5 | summary-findings | まとめ | |

### 骨子
1. リード文: 2023年の出生数は過去最少──出生率に地域差はあるか
2. セクション1: 合計特殊出生率ランキング──沖縄・宮崎が上位
3. セクション2: 出生率マップ──西高東低のパターン
4. セクション3: 晩婚化と出生率──婚姻年齢が若い県は出生率も高い
5. セクション4: 出生率の長期推移──50年間の変化
6. まとめ

---

## 記事企画: marriage-divorce-ranking

- title: "婚姻率・離婚率ランキング"
- subtitle: "（実データに基づいて設定）"
- category: population
- tags: [婚姻率, 離婚率, 結婚, 離婚, 晩婚化]
- target: 結婚に関心がある人、社会問題研究者
- seo_keywords: [都道府県 婚姻率 ランキング, 離婚率 高い県, 結婚 多い県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 婚姻率 | DB既存 | marriages-per-total-population | 2022年 |
| 離婚率 | DB既存 | divorces-per-total-population | 2022年 |
| 平均婚姻年齢（初婚の夫） | DB既存 | average-age-of-first-marriage-husband | 2023年 |
| 平均婚姻年齢（初婚の妻） | DB既存 | average-age-of-first-marriage-wife | 2023年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 婚姻率 | 上位10・下位10 |
| 2 | tile-grid-map | 離婚率 | 地域パターン |
| 3 | scatter | 婚姻率 × 離婚率 | 結婚が多い県は離婚も多い？ |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 結婚しやすい県、離婚しやすい県──婚姻・離婚の地域差
2. セクション1: 婚姻率ランキング──東京・沖縄が上位の理由
3. セクション2: 離婚率マップ──沖縄・北海道が突出
4. セクション3: 婚姻率 vs 離婚率──相関はあるか
5. まとめ

---

## 記事企画: aging-society-ranking

- title: "高齢化率ランキング"
- subtitle: "（実データに基づいて設定）"
- category: population
- tags: [高齢化, 老年化指数, 従属人口, 年少人口, 人口構造]
- target: 福祉・介護関係者、地方創生関係者
- seo_keywords: [都道府県 高齢化率 ランキング, 高齢者 多い県, 老年化指数 都道府県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 老年化指数 | DB既存 | aging-index | 2022年 |
| 従属人口指数 | DB既存 | dependent-population-index | 2022年 |
| 年少人口指数 | DB既存 | young-population-index | 2022年 |
| 粗死亡率 | DB既存 | crude-death-rate | 2023年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 老年化指数 | 上位10・下位10 |
| 2 | tile-grid-map | 老年化指数 | 地域パターン |
| 3 | scatter | 老年化指数 × 年少人口指数 | 高齢化と子ども |
| 4 | line | 老年化指数の推移 | 長期トレンド |
| 5 | summary-findings | まとめ | |

### 骨子
1. リード文: 高齢者100人に対して子ども何人？──老年化指数で見る日本の未来
2. セクション1: 老年化指数ランキング──秋田・高知・青森が上位
3. セクション2: 高齢化マップ──東北・四国・中国地方に集中
4. セクション3: 老年化指数 vs 年少人口指数──少子高齢化の二重苦
5. セクション4: 老年化指数の推移──加速する高齢化
6. まとめ

---

## 記事企画: population-density-urbanization

- title: "人口密度ランキング"
- subtitle: "（実データに基づいて設定）"
- category: population
- tags: [人口密度, 都市化, 人口集中地区, 過疎, 過密]
- target: 都市計画関係者、移住検討者
- seo_keywords: [都道府県 人口密度 ランキング, 人口密度 高い県, 人口集中地区 ランキング]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 可住地面積1km²当たり人口密度 | DB既存 | population-density-per-km2-inhabitable-area | |
| 総面積1km²当たり人口密度 | DB既存 | population-density-per-km2-total-area | |
| 人口集中地区人口比率 | DB既存 | densely-inhabited-district-population-ratio | 2020年 |
| 昼夜間人口比率 | DB既存 | day-time-population-ratio | 2020年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 可住地人口密度 | 上位10・下位10 |
| 2 | tile-grid-map | 人口集中地区人口比率 | 都市化マップ |
| 3 | scatter | 人口密度 × 昼夜間人口比率 | 通勤流入の構造 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 東京の100倍──人口密度の地域格差はどこまで広がるか
2. セクション1: 人口密度ランキング──可住地ベースで見る真の密度
3. セクション2: 都市化マップ──人口集中地区の分布
4. セクション3: 昼夜間人口比率──昼に人が集まる県・夜に帰る県
5. まとめ

---

## 記事企画: household-structure-ranking

- title: "世帯構造ランキング"
- subtitle: "（実データに基づいて設定）"
- category: population
- tags: [単独世帯, 核家族, 共働き, 世帯構造, 家族形態]
- target: 社会学に関心がある人、住宅・不動産関係者
- seo_keywords: [都道府県 一人暮らし 割合 ランキング, 核家族 多い県, 共働き世帯 ランキング]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 単独世帯割合 | DB既存 | single-person-household-ratio | 2020年 |
| 核家族世帯割合 | DB既存 | nuclear-family-households-ratio | 2020年 |
| 共働き世帯割合 | DB既存 | dual-income-household-ratio | 2020年 |
| 一般世帯の平均人員 | DB既存 | average-persons-per-general-household | 2020年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 単独世帯割合 | 上位10・下位10 |
| 2 | tile-grid-map | 共働き世帯割合 | 地域パターン |
| 3 | scatter | 単独世帯割合 × 共働き世帯割合 | 都市型 vs 地方型 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 3世帯に1世帯がひとり暮らし──変わる日本の世帯構造
2. セクション1: 単独世帯割合ランキング──東京・京都・北海道
3. セクション2: 共働き世帯マップ──北陸・東北が上位
4. セクション3: 単独世帯 vs 共働き──家族のかたちの地域差
5. まとめ

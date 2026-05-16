# お金テーマ — ブログ記事企画

> 生成日: 2026-03-16（money-content-strategy.md より移行）
> お金関連ランキング: 200件以上
> 企画数: 10件

---

## 記事企画: average-salary-ranking

- title: "都道府県別 平均年収ランキング"
- subtitle: "現金給与月額と所定内給与で見る地域差"
- category: laborwage
- tags: [平均年収, 給与, 都道府県ランキング, 地域格差]
- target: 転職・移住検討者、経済に関心がある人
- seo_keywords: [平均年収 都道府県, 年収ランキング 県別, 給与 高い県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 現金給与月額 | DB既存 | cash-salary-monthly-total | 男女別あり |
| 所定内給与額 | DB既存 | male-scheduled-earnings / female-scheduled-earnings | 2022年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 現金給与月額 Top10/Bottom10 | |
| 2 | tile-grid-map | 現金給与月額 | 地域パターン |
| 3 | scatter | 給与 × 物価指数 | 実質的な豊かさ |

---

## 記事企画: minimum-wage-ranking

- title: "最低賃金ランキングと地域格差"
- subtitle: "最低賃金とCPI地域差指数の関係"
- category: laborwage
- tags: [最低賃金, ランキング, 地域格差, CPI]
- target: パート・アルバイトで働く人、政策に関心がある人
- seo_keywords: [最低賃金 ランキング 都道府県, 最低賃金 高い県]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 地域別最低賃金 | DB既存 | minimum-wage |
| 消費者物価地域差指数 | DB既存 | consumer-price-difference-index-overall |

---

## 記事企画: starting-salary-ranking

- title: "初任給ランキング（大卒/高卒）"
- subtitle: "新規学卒者初任給の都道府県別比較"
- category: laborwage
- tags: [初任給, 大卒, 高卒, ランキング]
- target: 就活生、新社会人
- seo_keywords: [初任給 都道府県 ランキング, 大卒 初任給 県別]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 大卒初任給 | DB既存 | starting-salary-university |
| 高卒初任給 | DB既存 | starting-salary-highschool |

---

## 記事企画: part-time-hourly-wage

- title: "パートタイム時給ランキング"
- subtitle: "男女別パート時給の地域差"
- category: laborwage
- tags: [パート, 時給, ランキング, 男女差]
- target: パートで働く人、雇用者
- seo_keywords: [パート 時給 都道府県 ランキング, パート 時給 高い県]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| パート時給（男） | DB既存 | male-part-time-hourly-wage |
| パート時給（女） | DB既存 | female-part-time-hourly-wage |

---

## 記事企画: gender-wage-gap-ranking

- title: "男女の賃金格差ランキング"
- subtitle: "女性/男性の所定内給与額比率で見る格差"
- category: laborwage
- tags: [賃金格差, 男女格差, ジェンダー, ランキング]
- target: 働く女性、ジェンダー平等に関心がある人
- seo_keywords: [賃金格差 都道府県, 男女 給与 格差 ランキング]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 男女間賃金格差 | DB既存 | gender-wage-gap |
| 男性所定内給与額 | DB既存 | male-scheduled-earnings |
| 女性所定内給与額 | DB既存 | female-scheduled-earnings |

---

## 記事企画: disposable-income-ranking

- title: "可処分所得ランキング — 手取りで見る豊かさ"
- subtitle: "名目所得と可処分所得の逆転現象"
- category: economy
- tags: [可処分所得, 手取り, ランキング, 生活水準]
- target: 移住検討者、生活コストに関心がある人
- seo_keywords: [可処分所得 都道府県 ランキング, 手取り 高い県]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 可処分所得 | DB既存 | disposable-income-worker-households |
| 消費者物価地域差指数 | DB既存 | consumer-price-difference-index-overall |

---

## 記事企画: savings-ranking

- title: "貯蓄額ランキング — 最も貯めている県は？"
- subtitle: "貯蓄現在高と有価証券保有額で見る県民の金融行動"
- category: economy
- tags: [貯蓄, 金融資産, ランキング, 投資, NISA]
- target: 資産形成に関心がある人
- seo_keywords: [貯蓄 都道府県 ランキング, 貯金 多い県]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 預貯金残高 | DB既存 | savings-deposit-balance |
| 有価証券保有額 | DB既存 | securities-balance |
| 金融資産残高 | DB既存 | financial-assets-balance |

---

## 記事企画: housing-loan-ranking

- title: "住宅ローン負担ランキング"
- subtitle: "負債現在高と住宅地地価の関係"
- category: construction
- tags: [住宅ローン, 負債, 地価, ランキング]
- target: 住宅購入検討者
- seo_keywords: [住宅ローン 都道府県, 負債 ランキング 県別]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 負債現在高 | DB既存 | debt-outstanding |
| 住宅地地価変動率 | DB既存 | residential-land-price-change-rate |
| 家賃 | DB既存 | private-rental-housing-rent |

---

## 記事企画: pension-payment-ranking

- title: "年金納付率ランキング — ちゃんと払う県は？"
- subtitle: "国民年金保険料納付率の都道府県差"
- category: socialsecurity
- tags: [年金, 納付率, 国民年金, ランキング]
- target: 年金制度に関心がある人
- seo_keywords: [年金 納付率 都道府県 ランキング, 国民年金 未納 県]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| 国民年金保険料納付率 | DB既存 | national-pension-payment-rate |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 納付率 Top10/Bottom10 | |
| 2 | tile-grid-map | 納付率 | 地域パターン |
| 3 | scatter | 納付率 × 所得水準 | 所得との相関 |

---

## 記事企画: income-inequality-ranking

- title: "所得格差ランキング — ジニ係数で見る日本の分断"
- subtitle: "等価可処分所得ジニ係数の都道府県差"
- category: economy
- tags: [ジニ係数, 所得格差, 格差社会, ランキング]
- target: 社会問題に関心がある人、政策関係者
- seo_keywords: [ジニ係数 都道府県 ランキング, 所得格差 県別]

### 使用データ
| 指標 | ソース | ranking_key |
|---|---|---|
| ジニ係数 | DB既存 | gini-coefficient-disposable-income |
| 1人当たり県民所得 | DB既存 | per-capita-kenmin-shotoku-h27 |

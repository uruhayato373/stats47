# 経済基盤（economy）— ブログ記事企画

> 生成日: 2026-03-09
> 既存指標数: 332件（データあり）
> 企画数: 5件

---

## 記事企画: prefectural-income-ranking

- title: "県民所得ランキング"
- subtitle: "（実データに基づいて設定）"
- category: economy
- tags: [県民所得, 1人当たり所得, 経済格差, 地域経済]
- target: 転職・移住検討者、経済に関心がある人
- seo_keywords: [都道府県 県民所得 ランキング, 1人当たり所得 高い県, 県民所得 格差]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 1人当たり県民所得 | DB既存 | per-capita-kenmin-shotoku-h27 | 2020年 |
| 世帯主収入（勤労者世帯） | DB既存 | household-head-income-worker-households-per-month | 2024年 |
| 消費者物価地域差指数（総合） | DB既存 | consumer-price-difference-index-overall | 2024年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 1人当たり県民所得 | 上位10・下位10 |
| 2 | tile-grid-map | 1人当たり県民所得 | 地域パターン |
| 3 | scatter | 県民所得 × 物価指数 | 所得と物価の関係 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 東京と沖縄で2倍以上──県民所得の地域格差
2. セクション1: 1人当たり県民所得ランキング
3. セクション2: 所得マップ──大都市圏と地方の二極化
4. セクション3: 所得 vs 物価──実質的な豊かさはどこが上か
5. まとめ

---

## 記事企画: consumer-price-regional-gap

- title: "物価の地域差ランキング"
- subtitle: "（実データに基づいて設定）"
- category: economy
- tags: [物価, 消費者物価, 地域差指数, 生活費, インフレ]
- target: 移住検討者、家計管理に関心がある人
- seo_keywords: [都道府県 物価 ランキング, 物価 安い県, 消費者物価 地域差]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 消費者物価地域差指数（総合） | DB既存 | consumer-price-difference-index-overall | 2024年 |
| 消費者物価地域差指数（食料） | DB既存 | consumer-price-difference-index-food | 2024年 |
| 消費者物価地域差指数（住居） | DB既存 | consumer-price-difference-index-housing | 2024年 |
| 消費者物価地域差指数（光熱・水道） | DB既存 | consumer-price-difference-index-utilities | 2024年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 物価地域差指数（総合） | 上位10・下位10 |
| 2 | tile-grid-map | 物価地域差指数（総合） | 物価マップ |
| 3 | scatter | 食料物価 × 住居物価 | 費目別の比較 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 同じ年収でも住む場所で暮らしが変わる──物価の地域差
2. セクション1: 物価地域差指数ランキング──東京・神奈川が高い
3. セクション2: 物価マップ──意外と高い地方の光熱費
4. セクション3: 食料 vs 住居──費目で異なる地域差パターン
5. まとめ

---

## 記事企画: savings-rate-ranking

- title: "貯蓄率ランキング"
- subtitle: "（実データに基づいて設定）"
- category: economy
- tags: [貯蓄率, 家計, 金融資産, 預貯金, 節約]
- target: 家計管理に関心がある人、FP・金融関係者
- seo_keywords: [都道府県 貯蓄率 ランキング, 貯金 多い県, 貯蓄率 高い県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 平均貯蓄率（勤労者世帯） | DB既存 | avg-savings-rate-worker-households | 2024年 |
| 国内銀行預金残高（1人当たり） | DB既存 | bank-deposit-balance-per-person | 2024年 |
| 消費支出（1世帯当たり） | DB既存 | consumption-expenditure-multi-person-households-per-month | 2024年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 貯蓄率 | 上位10・下位10 |
| 2 | tile-grid-map | 貯蓄率 | 地域パターン |
| 3 | scatter | 貯蓄率 × 預金残高 | 貯め方の違い |
| 4 | line | 貯蓄率の推移 | 長期トレンド |
| 5 | summary-findings | まとめ | |

### 骨子
1. リード文: 収入の何割を貯蓄に回すか──貯蓄率の地域差
2. セクション1: 貯蓄率ランキング
3. セクション2: 貯蓄率マップ
4. セクション3: 貯蓄率 vs 預金残高──フロー vs ストック
5. セクション4: 貯蓄率の長期推移
6. まとめ

---

## 記事企画: inflation-rate-ranking

- title: "物価上昇率ランキング"
- subtitle: "（実データに基づいて設定）"
- category: economy
- tags: [物価上昇, インフレ, CPI, 消費者物価指数, 生活費]
- target: 家計管理に関心がある人、経済に関心がある人
- seo_keywords: [都道府県 物価上昇率 ランキング, インフレ率 都道府県, CPI 変化率]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| CPI対前年変化率（総合） | DB既存 | cpi-change-rate-total | 2024年 |
| CPI対前年変化率（食料） | DB既存 | cpi-change-rate-food | 2024年 |
| CPI対前年変化率（光熱・水道） | DB既存 | cpi-change-rate-utilities | 2024年 |
| CPI対前年変化率（住居） | DB既存 | cpi-change-rate-housing | 2024年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | CPI変化率（総合） | 上位10・下位10 |
| 2 | tile-grid-map | CPI変化率（総合） | インフレマップ |
| 3 | scatter | CPI変化率（食料）× CPI変化率（光熱） | 費目別の比較 |
| 4 | line | CPI変化率の推移 | 長期トレンド |
| 5 | summary-findings | まとめ | |

### 骨子
1. リード文: インフレの波は全国一律ではない──物価上昇率の地域差
2. セクション1: CPI変化率ランキング
3. セクション2: インフレマップ──地方ほど食料品で直撃
4. セクション3: 食料 vs 光熱──費目別に異なるインフレパターン
5. セクション4: CPI変化率の長期推移──デフレからインフレへ
6. まとめ

---

## 記事企画: household-spending-ranking

- title: "家計支出ランキング"
- subtitle: "（実データに基づいて設定）"
- category: economy
- tags: [家計, 消費支出, エンゲル係数, 食費, 生活費]
- target: 家計管理に関心がある人、移住検討者
- seo_keywords: [都道府県 家計支出 ランキング, 消費支出 多い県, エンゲル係数 都道府県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 消費支出（1世帯当たり） | DB既存 | consumption-expenditure-multi-person-households-per-month | 2024年 |
| 食料費割合 | DB既存 | food-expenditure-ratio-multi-person-households | 2024年 |
| 教養娯楽費割合 | DB既存 | culture-recreation-expenditure-ratio-multi-person-households | 2024年 |
| 被服及び履物費割合 | DB既存 | clothing-footwear-expenditure-ratio-multi-person-households | 2024年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 消費支出 | 上位10・下位10 |
| 2 | tile-grid-map | 食料費割合 | エンゲル係数マップ |
| 3 | scatter | 消費支出 × 食料費割合 | 支出と食費の関係 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 1ヶ月の生活費はいくら？──消費支出の地域格差
2. セクション1: 消費支出ランキング
3. セクション2: エンゲル係数マップ──食費比率の地域パターン
4. セクション3: 支出総額 vs 食費比率──豊かさの指標
5. まとめ

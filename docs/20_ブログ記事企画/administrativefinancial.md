# 行財政（administrativefinancial）— ブログ記事企画

> 生成日: 2026-03-09
> 既存指標数: 91件（データあり）
> 企画数: 5件

---

## 記事企画: fiscal-strength-ranking

- title: "財政力指数ランキング"
- subtitle: "（実データに基づいて設定）"
- category: administrativefinancial
- tags: [財政力指数, 地方財政, 経常収支比率, 財政健全性]
- target: 地方自治に関心がある人、移住検討者
- seo_keywords: [都道府県 財政力指数 ランキング, 財政力 強い県, 経常収支比率 都道府県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 財政力指数 | DB既存 | fiscal-strength-index-prefecture | 2022年 |
| 経常収支比率 | DB既存 | current-balance-ratio | 2022年 |
| 自主財源の割合 | DB既存 | self-financing-ratio | 2022年 |
| 実質公債費比率 | DB既存 | real-public-debt-service-ratio | 2022年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 財政力指数 | 上位10・下位10 |
| 2 | tile-grid-map | 財政力指数 | 地域パターン |
| 3 | scatter | 財政力指数 × 自主財源割合 | 自力で稼ぐ力 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 自治体の「稼ぐ力」──財政力指数で見る都道府県の格差
2. セクション1: 財政力指数ランキング──東京が圧倒的1位
3. セクション2: 経常収支比率──財政の硬直化が進む県
4. セクション3: 財政力指数 vs 自主財源割合──交付税に頼る県
5. まとめ

---

## 記事企画: local-tax-revenue-gap

- title: "地方税収格差ランキング"
- subtitle: "（実データに基づいて設定）"
- category: administrativefinancial
- tags: [地方税, 税収, 地方交付税, 納税義務者, 財政格差]
- target: 税制に関心がある人、地方創生関係者
- seo_keywords: [都道府県 税収 ランキング, 地方税 多い県, 地方交付税 依存度]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 地方税割合 | DB既存 | local-tax-ratio-pref-finance | 2022年 |
| 地方交付税割合 | DB既存 | local-allocation-tax-ratio-pref-finance | 2022年 |
| 納税義務者割合 | DB既存 | taxpayer-ratio-per-pref-resident | 2024年 |
| 国庫支出金割合 | DB既存 | national-treasury-disbursement-ratio-pref-finance | 2022年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 地方税割合 | 上位10・下位10 |
| 2 | tile-grid-map | 地方交付税割合 | 交付税依存度マップ |
| 3 | scatter | 地方税割合 × 地方交付税割合 | 自立 vs 依存 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 歳入の半分が交付税──地方税収の格差はどこまで広がるか
2. セクション1: 地方税割合ランキング──東京・愛知は歳入の5割超
3. セクション2: 地方交付税依存度──島根・高知・鳥取が上位
4. セクション3: 地方税 vs 交付税──逆相関の構図
5. まとめ

---

## 記事企画: expenditure-structure-comparison

- title: "歳出構造の地域差ランキング"
- subtitle: "（実データに基づいて設定）"
- category: administrativefinancial
- tags: [歳出, 民生費, 土木費, 人件費, 財政構造]
- target: 行政関係者、政策研究者
- seo_keywords: [都道府県 歳出 構成 ランキング, 民生費 割合 都道府県, 土木費 多い県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 民生費割合 | DB既存 | welfare-expenditure-ratio-pref-finance | 2022年 |
| 土木費割合 | DB既存 | public-works-expenditure-ratio-pref-finance | 2022年 |
| 人件費割合 | DB既存 | personnel-expenditure-ratio-pref-finance | 2022年 |
| 衛生費割合 | DB既存 | sanitation-expenditure-ratio-pref-finance | 2022年 |
| 商工費割合 | DB既存 | commerce-industry-expenditure-ratio-pref-finance | 2022年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 民生費割合 | 上位10・下位10 |
| 2 | tile-grid-map | 民生費割合 | 福祉支出の地域パターン |
| 3 | scatter | 民生費割合 × 土木費割合 | 福祉 vs インフラの優先度 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 限られた予算をどう使うか──歳出構造から見える自治体の優先順位
2. セクション1: 民生費割合ランキング──高齢化が進む県ほど高い
3. セクション2: 土木費割合──インフラ整備に重点を置く県
4. セクション3: 民生費 vs 土木費──「福祉型」と「開発型」の二極化
5. まとめ

---

## 記事企画: local-debt-ranking

- title: "地方債残高ランキング"
- subtitle: "（実データに基づいて設定）"
- category: administrativefinancial
- tags: [地方債, 借金, 財政健全性, 将来負担比率]
- target: 財政に関心がある有権者、移住検討者
- seo_keywords: [都道府県 借金 ランキング, 地方債 残高 都道府県, 将来負担比率]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 地方債現在高の割合 | DB既存 | local-debt-current-ratio | 2022年 |
| 将来負担比率 | DB既存 | future-burden-ratio | 2022年 |
| 実質公債費比率 | DB既存 | real-public-debt-service-ratio | 2022年 |
| 投資的経費の割合 | DB既存 | investment-expenditure-ratio-pref-finance | 2022年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 地方債現在高の割合 | 上位10・下位10 |
| 2 | tile-grid-map | 地方債現在高の割合 | 借金の重さマップ |
| 3 | scatter | 地方債現在高 × 将来負担比率 | 現在と将来の負担 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: あなたの県の「借金」はいくら？──地方債残高の地域格差
2. セクション1: 地方債現在高割合ランキング
3. セクション2: 将来負担比率──将来世代へのツケ
4. セクション3: 地方債 vs 将来負担比率──借りすぎの県はどこか
5. まとめ

---

## 記事企画: household-income-ranking

- title: "世帯収入ランキング"
- subtitle: "（実データに基づいて設定）"
- category: administrativefinancial
- tags: [世帯収入, 実収入, 勤労者世帯, 家計, 所得格差]
- target: 転職・移住検討者、家計に関心がある人
- seo_keywords: [都道府県 世帯収入 ランキング, 実収入 高い県, 家計 都道府県別]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 実収入（勤労者世帯） | DB既存 | actual-income-worker-households-per-month | 2024年 |
| 歳出決算総額（1人当たり） | DB既存 | per-capita-total-expenditure-pref-municipal | 2022年 |
| 納税義務者割合 | DB既存 | taxpayer-ratio-per-pref-resident | 2024年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 実収入 | 上位10・下位10 |
| 2 | tile-grid-map | 実収入 | 収入の地域パターン |
| 3 | scatter | 実収入 × 納税義務者割合 | 収入と納税の関係 |
| 4 | line | 実収入の推移 | 長期トレンド |
| 5 | summary-findings | まとめ | |

### 骨子
1. リード文: 月収60万円超 vs 40万円台──勤労者世帯の収入格差
2. セクション1: 実収入ランキング──首都圏・関西が上位
3. セクション2: 収入マップ──大都市圏の「高収入ベルト」
4. セクション3: 収入 vs 納税義務者割合──稼ぐ人が多い県
5. セクション4: 実収入の長期推移──伸びている県・停滞する県
6. まとめ

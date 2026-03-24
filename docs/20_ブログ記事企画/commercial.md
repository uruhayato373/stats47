# 商業・サービス業（commercial）— ブログ記事企画

> 生成日: 2026-03-09
> 既存指標数: 50件（データあり）
> 企画数: 5件

---

## 記事企画: convenience-store-density-map

- title: "コンビニ密度ランキング"
- subtitle: "（実データに基づいて設定）"
- category: commercial
- tags: [コンビニ, 小売, 地域インフラ, 商業]
- target: 生活利便性に関心がある人、移住検討者
- seo_keywords: [都道府県 コンビニ 数 ランキング, コンビニ 密度 都道府県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| コンビニエンスストア数（10万人当たり） | DB既存 | convenience-store-count-per-100k | 2014年 |
| 小売店数（人口千人当たり） | DB既存 | retail-store-count-per-1000 | 2006年 |
| 大型小売店数（10万人当たり） | DB既存 | large-retail-store-count-per-100k | 2006年 |
| 百貨店・総合スーパー数（10万人当たり） | DB既存 | department-supermarket-count-per-100k | 2021年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | コンビニ数 | 上位10・下位10 |
| 2 | tile-grid-map | コンビニ数 | 地域差の俯瞰 |
| 3 | scatter | コンビニ数 × 小売店数 | 小売密度との相関 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: コンビニは現代の「生活インフラ」──密度に地域差はあるのか
2. セクション1: コンビニ密度ランキング──北海道・山梨が上位の理由
3. セクション2: コンビニ vs 小売店──地方では小売店がコンビニの代替
4. セクション3: 百貨店・スーパーとの比較──大型店の空白地帯
5. まとめ

---

## 記事企画: barber-beauty-salon-regional-gap

- title: "理美容所の密度ランキング"
- subtitle: "（実データに基づいて設定）"
- category: commercial
- tags: [理容, 美容, サービス業, 人口当たり]
- target: 美容業界関係者、地域経済に関心がある人
- seo_keywords: [都道府県 美容室 数 ランキング, 理容室 多い県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 理容・美容所数（10万人当たり） | DB既存 | barber-beauty-salon-count-per-100k | 2023年 |
| クリーニング所数（10万人当たり） | DB既存 | cleaning-shop-count-per-100k | 2023年 |
| 公衆浴場数（10万人当たり） | DB既存 | public-bath-count-per-100k | 2023年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 理美容所数 | 上位10・下位10 |
| 2 | tile-grid-map | 理美容所数 | 地域パターン |
| 3 | scatter | 理美容所数 × クリーニング所数 | 対人サービスの相関 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 美容室は全国25万軒超──人口当たりで最も多い県は？
2. セクション1: 理美容所の密度ランキング
3. セクション2: 対人サービス業の地域差──クリーニング・公衆浴場との比較
4. セクション3: 時系列で見る対人サービスの変化
5. まとめ

---

## 記事企画: commercial-land-price-trend

- title: "商業地価変動率ランキング"
- subtitle: "（実データに基づいて設定）"
- category: commercial
- tags: [地価, 商業地, 不動産, 地域経済]
- target: 不動産投資家、まちづくり関係者
- seo_keywords: [都道府県 商業地価 ランキング, 商業地 地価変動率]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 商業地の標準価格対前年平均変動率 | DB既存 | standard-price-change-rate-commercial | 2024年 |
| 商業・近隣商業地域面積比率 | DB既存 | commercial-and-neighborhood-commercial-area-ratio | 2023年 |
| 近隣商業地域面積比率 | DB既存 | neighborhood-commercial-area-ratio | 2023年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 商業地価変動率 | 上位10・下位10 |
| 2 | tile-grid-map | 商業地価変動率 | 地域パターン |
| 3 | line | 商業地価変動率の推移 | 全国平均 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 商業地の地価はインバウンド復活で上昇中──しかし地方は下落が続く
2. セクション1: 商業地価変動率ランキング──二極化の構図
3. セクション2: 商業地域の面積比率──都市化の度合いと地価の関係
4. セクション3: 長期推移──バブル崩壊からコロナ、そしてインバウンド
5. まとめ

---

## 記事企画: small-business-dominance-map

- title: "零細企業が支える県ランキング"
- subtitle: "（実データに基づいて設定）"
- category: commercial
- tags: [中小企業, 零細企業, 事業所, 産業構造]
- target: 経営者、地域政策関係者
- seo_keywords: [都道府県 中小企業 割合 ランキング, 零細企業 多い県]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 従業者1〜4人事業所割合（民営） | DB既存 | establishment-ratio-1-4-employees-private | 2021年 |
| 従業者300人以上事業所割合（民営） | DB既存 | establishment-ratio-300plus-employees-private | 2021年 |
| 従業者1〜4人事業所の従業者割合 | DB既存 | employee-ratio-1-4-employee-establishments-private | 2021年 |
| 従業者300人以上事業所の従業者割合 | DB既存 | employee-ratio-300plus-employee-establishments-private | 2021年 |
| 第2次産業事業所数構成比 | DB既存 | secondary-industry-establishment-ratio | 2014年 |
| 第3次産業事業所数構成比 | DB既存 | tertiary-industry-establishment-ratio | 2014年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 零細事業所割合 | 地域パターン |
| 2 | bar | 零細事業所割合 | 上位10・下位10 |
| 3 | scatter | 零細事業所割合 × 大企業従業者割合 | 産業構造の対比 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 日本の事業所の6割が従業者4人以下──「零細」が支える地域経済
2. セクション1: 零細事業所割合ランキング──高知・沖縄・鹿児島が上位
3. セクション2: 大企業 vs 零細──従業者割合で見る真逆の構図
4. セクション3: 2次産業 vs 3次産業の地域差
5. まとめ

---

## 記事企画: commercial-sales-productivity-gap

- title: "商業の稼ぐ力ランキング"
- subtitle: "（実データに基づいて設定）"
- category: commercial
- tags: [商業, 販売額, 生産性, 卸売, 小売]
- target: 経営者、地域経済研究者
- seo_keywords: [都道府県 商業 販売額 ランキング, 小売業 生産性]

### 使用データ
| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 商業年間商品販売額（従業者1人当たり） | DB既存 | annual-sales-amount-per-employee | 2022年 |
| 商業年間商品販売額（事業所当たり） | DB既存 | annual-sales-amount-per-establishment | 2022年 |
| 飲食料品小売店数（千人当たり） | DB既存 | food-retail-store-count-per-1000 | 2006年 |
| セルフサービス事業所数（10万人当たり） | DB既存 | self-service-store-count-per-100k | 2014年 |

### チャート構成
| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 従業者1人当たり販売額 | 上位10・下位10 |
| 2 | tile-grid-map | 従業者1人当たり販売額 | 地域パターン |
| 3 | scatter | 従業者当たり × 事業所当たり | 規模と生産性の関係 |
| 4 | summary-findings | まとめ | |

### 骨子
1. リード文: 商業の「稼ぐ力」は東京が圧倒──地方との差はどこまで開くか
2. セクション1: 従業者1人当たり販売額ランキング──卸売が押し上げる東京・大阪
3. セクション2: 事業所当たり販売額──規模の経済が効く県
4. セクション3: 飲食料品小売の密度──食のインフラ格差
5. まとめ

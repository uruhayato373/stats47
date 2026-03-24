# 司法・安全・環境（safetyenvironment）— ブログ記事企画

> 生成日: 2026-03-09
> 既存指標数: 53件
> 企画数: 5件

---

## 記事企画: crime-rate-regional-gap

- title: "治安の良い県ランキング"
- subtitle: "大阪107人に1件 vs 富山590人に1件"
- description: "刑法犯認知件数・検挙率・犯罪種類別割合から、都道府県の治安を多角的に分析。人口当たりの犯罪遭遇率で見ると、体感治安と実態に大きな乖離があることがわかります。"
- category: safetyenvironment
- tags: [治安, 犯罪率, 刑法犯, 検挙率, 窃盗]
- target: 移住・転居を検討している人、防犯意識の高い人
- seasonal_hook: 年度末の引越しシーズン（3-4月）
- seo_keywords: [都道府県 治安 ランキング, 犯罪率 低い県, 都道府県別 犯罪件数]

### 使用データ

| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 刑法犯認知件数 | DB既存 | criminal-recognition-count | 絶対数 |
| 刑法犯検挙率 | DB既存 | criminal-arrest-rate | |
| 凶悪犯割合 | DB既存 | criminal-recognition-count-of-serious-crime-rate | |
| 窃盗犯割合 | DB既存 | criminal-recognition-count-of-theft-crime-rate | |
| 粗暴犯割合 | DB既存 | criminal-recognition-count-of-violent-crime-rate | |
| 風俗犯割合 | DB既存 | criminal-recognition-count-of-prostitution-crime-rate | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 刑法犯認知件数（人口10万人当たり） | 上位10・下位10 |
| 2 | tile-grid-map | 刑法犯検挙率 | 検挙率の地域差を俯瞰 |
| 3 | stacked-bar | 犯罪種類別割合（上位10県） | 凶悪犯・窃盗犯・粗暴犯・風俗犯の構成比 |
| 4 | scatter | 検挙率 × 認知件数 | 犯罪が多いのに検挙率も低い県の特定 |

### 骨子

1. リード文: 「治安が良い」とは何か？ 犯罪遭遇率で見る本当の安全度
2. セクション1: 犯罪遭遇率ランキング（人口当たり認知件数）—大阪が3年連続ワースト
3. セクション2: 検挙率ランキング—犯罪を「捕まえる力」の地域差
4. セクション3: 犯罪の「中身」が違う—凶悪犯vs窃盗犯の構成比
5. セクション4: 検挙率×認知件数の散布図で見る「本当に危ない県」
6. データ出典
7. 関連ランキングリンク

---

## 記事企画: suicide-rate-aging-nexus

- title: "自殺率と高齢化の相関"
- subtitle: "秋田25.5人 vs 神奈川12.1人（10万人当たり）"
- description: "都道府県別の自殺死亡率を分析し、高齢化率・65歳以上自殺率との相関を探ります。東北地方に集中する高自殺率県の構造的背景に迫ります。"
- category: safetyenvironment
- tags: [自殺率, 高齢化, メンタルヘルス, 地域格差]
- target: 社会問題に関心がある人、地方創生・福祉関係者
- seasonal_hook: 自殺対策強化月間（3月）
- seo_keywords: [都道府県 自殺率 ランキング, 自殺率 高齢化 相関, 自殺率 高い県]

### 使用データ

| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 自殺者数（10万人当たり） | DB既存 | suicides-per-100k | |
| 65歳以上の自殺者数 | DB既存 | suicide-count-65plus | |
| 自殺者数（総数） | DB既存 | suicide-count | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 自殺率（10万人当たり） | 地域パターンの俯瞰（東北・北陸に集中） |
| 2 | bar | 自殺率ランキング | 上位10・下位10 |
| 3 | scatter | 自殺率 × 高齢化率 | 高齢化と自殺率の相関分析 |
| 4 | line | 全国自殺者数の推移 | 時系列トレンド |

### 骨子

1. リード文: 自殺者数は減少傾向だが、地域格差は依然として大きい
2. セクション1: 自殺率ランキング—東北地方に集中する高自殺率
3. セクション2: 65歳以上の自殺—高齢化率との相関
4. セクション3: 時系列で見る自殺者数の推移と対策の効果
5. セクション4: 構造的要因の考察（高齢化・経済・医療アクセス）
6. データ出典・相談窓口情報
7. 関連ランキングリンク

---

## 記事企画: firefighting-capacity-gap

- title: "消防力の地域格差"
- subtitle: "消防署密度10倍差、消防団は減少の一途"
- description: "火災出火件数と消防体制（消防署数・消防団数・消防吏員数・消防車両数）を都道府県別に比較。人口減少・高齢化で消防団員が減る地方と、消防署が密集する都市部の格差を分析します。"
- category: safetyenvironment
- tags: [消防, 火災, 消防団, 消防署, 地域格差]
- target: 防災意識の高い人、地方自治・まちづくり関係者
- seasonal_hook: 春の火災予防運動（3月）
- seo_keywords: [都道府県 火災 ランキング, 消防署 数 都道府県, 消防力 地域差]

### 使用データ

| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 火災出火件数（10万人当たり） | DB既存 | building-fire-count-per-100-thousand-people | |
| 建物火災損害額 | DB既存 | building-fire-damage-amount-per-building-fire | |
| 火災死傷者数（事故当たり） | DB既存 | fire-damage-casualties-per-accident | |
| 消防署数（100km²当たり） | DB既存 | fire-department-count-per-100-km2 | |
| 消防団・分団数（100km²当たり） | DB既存 | fire-department-branch-count-per-100-km2 | |
| 消防吏員数（10万人当たり） | DB既存 | fire-department-member-count-per-100-thousand-people | |
| 救急自動車数（10万人当たり） | DB既存 | fire-department-emergency-car-count-per-100k | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 火災出火件数 | 出火率の地域パターン |
| 2 | bar | 消防署密度（100km²当たり） | 都市部vs地方の格差 |
| 3 | scatter | 消防吏員数 × 火災出火件数 | 消防力と火災発生の関係 |
| 4 | stacked-bar | 消防費割合（上位10県） | 自治体財政に占める消防コスト |

### 骨子

1. リード文: あなたの県の消防力は足りているか？ 消防署密度に10倍の格差
2. セクション1: 火災出火率ランキング—山梨・宮崎が上位の理由
3. セクション2: 消防署密度ランキング—東京は地方の10倍
4. セクション3: 消防団の衰退—人口減少で「共助」が崩壊する地方
5. セクション4: 消防力×火災発生の散布図で見る「守りの薄い県」
6. データ出典
7. 関連ランキングリンク

---

## 記事企画: workplace-accident-regional-map

- title: "労働災害ランキング"
- subtitle: "死亡者数は過去最少、でも死傷者数は4年連続増"
- description: "都道府県別の労働災害発生頻度・重さ・労災保険給付率を比較。建設業・製造業が集積する県ほど労災リスクが高い傾向と、労災保険の地域格差を明らかにします。"
- category: safetyenvironment
- tags: [労働災害, 労災, 安全衛生, 労災保険]
- target: 労務管理者、安全衛生担当者、転職検討者
- seasonal_hook: 全国安全週間準備月間（6月）
- seo_keywords: [都道府県 労災 ランキング, 労働災害 多い県, 労災発生率 都道府県]

### 使用データ

| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 労働災害発生の頻度 | DB既存 | frequency-of-occupational-accidents | |
| 労働災害の重さの程度 | DB既存 | work-accident-severity | |
| 労災保険給付率 | DB既存 | workers-compensation-insurance-benefits-rate | |
| 労災保険平均支給額 | DB既存 | average-payment-amount-of-workers-compensation-insurance-benefits | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 労災発生頻度 | 地域パターンの俯瞰 |
| 2 | bar | 労災発生頻度ランキング | 上位10・下位10 |
| 3 | scatter | 労災頻度 × 製造品出荷額 | 製造業集積と労災の相関 |
| 4 | bar | 労災保険平均支給額 | 支給額の地域差 |

### 骨子

1. リード文: 死亡者数は減少しても死傷者数は増加—労災の「今」
2. セクション1: 労災発生頻度ランキング—建設業・製造業が集積する県が上位
3. セクション2: 労災の「重さ」ランキング—頻度と重症度は別の話
4. セクション3: 労災保険の地域格差—給付率と平均支給額の差
5. セクション4: 製造業出荷額との散布図で見る産業構造と労災リスク
6. データ出典
7. 関連ランキングリンク

---

## 記事企画: pollution-complaints-regional-map

- title: "公害苦情ランキング"
- subtitle: "愛知6,213件 vs 富山224件──28倍の差"
- description: "都道府県別の公害苦情件数・ばい煙発生施設数・水質汚濁施設数を比較。都市部に集中する苦情件数と、工業地帯に集積する汚染施設の地域パターンを分析します。"
- category: safetyenvironment
- tags: [公害, 環境汚染, 大気汚染, 水質汚濁, 苦情]
- target: 環境問題に関心がある人、移住検討者
- seasonal_hook:
- seo_keywords: [都道府県 公害 ランキング, 公害苦情 多い県, 大気汚染 都道府県]

### 使用データ

| 指標 | ソース | ranking_key | 備考 |
|---|---|---|---|
| 公害苦情受付件数（10万人当たり） | DB既存 | pollution-complaints-received-per-100k | |
| ばい煙発生施設数 | DB既存 | smoke-emission-facility-count | |
| 一般粉じん発生施設数 | DB既存 | general-dust-emission-facility-count | |
| 水質汚濁防止法上の特定事業場数 | DB既存 | water-pollution-control-law-facility-count | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 公害苦情受付件数 | 苦情の地域分布 |
| 2 | bar | 公害苦情ランキング（人口10万人当たり） | 上位10・下位10 |
| 3 | scatter | ばい煙施設数 × 公害苦情件数 | 工業施設と苦情の相関 |
| 4 | stacked-bar | 汚染施設の種類別構成（上位10県） | ばい煙・粉じん・水質汚濁の比較 |

### 骨子

1. リード文: 年間6万件超の公害苦情—住みやすさの「裏指標」
2. セクション1: 公害苦情件数ランキング—東京・愛知・千葉がワースト3
3. セクション2: 苦情の中身—大気汚染・騒音・悪臭の構成
4. セクション3: 汚染施設の集積—ばい煙・水質汚濁の地域分布
5. セクション4: 工業施設数と苦情件数の相関—「工場が多い＝苦情が多い」は本当か
6. データ出典
7. 関連ランキングリンク

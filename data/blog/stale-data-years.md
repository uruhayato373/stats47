# 図の年が古い公開記事 (stale-data-years)

- 生成: 2026-10-09T02:42:27.980Z
- 公開記事 606 件のうち、使う指標を snapshot から読めた記事 568 件を判定
- 図の年が指標の最新年より古い記事: **23 件**。遅れの大きい順
- 直し方: `node .claude/scripts/blog/refresh-article-data-years.mjs --slug <slug> --pull --apply` で図を最新年で作り直す → 本文の年と数値を書き直して critic を通す (`/brushup-blog` の focus `最新データ更新`)。本文がその年そのものを主題にした図だけ、取り直さず source.json に `yearPinnedReason` を書く (本文が図の年を語っていない図は図だけの食い違いなので取り直す)

| 記事 | 指標 (図の年 → 最新年) |
|---|---|
| `bonito-catch-prefecture` | `fishery-species-catch-bonito` 2015 → 2023 |
| `library-museum-cultural-capital` | `japanese-population` 2020 → 2024 |
| `retail-establishments-by-prefecture` | `total-population` 2021 → 2025 |
| `engel-coefficient-vs-prefectural-income` | `engel-coefficient` 2021 → 2024<br>`information-communication-coefficient` 2021 → 2024 |
| `fiscal-health-50years-trend` | `total-population` 2022 → 2025 |
| `local-tax-regional-gap` | `total-population` 2022 → 2025 |
| `manufacturing-labor-productivity-pref` | `manufacturing-employees` 2021 → 2024<br>`manufacturing-shipment-amount` 2021 → 2023 |
| `prefectural-debt-future-burden` | `production-age-population-ratio` 2022 → 2025<br>`ratio-65-plus` 2022 → 2025 |
| `welfare-expenses-squeeze` | `total-population` 2022 → 2025 |
| `manufacturing-productivity` | `manufacturing-employees` 2022 → 2024<br>`manufacturing-industry-added-value` 2022 → 2023<br>`manufacturing-shipment-amount` 2022 → 2023 |
| `safe-driving-5-features` | `ratio-65-plus` 2023 → 2025<br>`traffic-accident-deaths-per-100-accidents` 2023 → 2024 |
| `vacant-house-crisis` | `ratio-65-plus` 2023 → 2025 |
| `consumer-price-difference-index-utilities-prefecture-gap` | `consumer-price-difference-index-utilities` 2024 → 2025 |
| `consumer-price-regional-gap` | `consumer-price-difference-index-clothing-footwear` 2024 → 2025<br>`consumer-price-difference-index-culture-recreation` 2024 → 2025<br>`consumer-price-difference-index-education` 2024 → 2025<br>`consumer-price-difference-index-food` 2024 → 2025<br>`consumer-price-difference-index-furniture-household` 2024 → 2025<br>`consumer-price-difference-index-healthcare` 2024 → 2025<br>`consumer-price-difference-index-housing` 2024 → 2025<br>`consumer-price-difference-index-miscellaneous` 2024 → 2025<br>`consumer-price-difference-index-overall` 2024 → 2025<br>`consumer-price-difference-index-transport-communication` 2024 → 2025<br>`consumer-price-difference-index-utilities` 2024 → 2025 |
| `electricity-bill-hike-impact` | `consumer-price-difference-index-utilities` 2024 → 2025 |
| `fertility-fiscal-nexus` | `total-fertility-rate` 2022 → 2023 |
| `fish-catch-vs-consumption-prefecture` | `tuna-consumption-expenditure` 2023 → 2024<br>`yellowtail-consumption-expenditure` 2023 → 2024 |
| `food-price-regional-2026` | `consumer-price-difference-index-food` 2024 → 2025 |
| `low-cost-low-income-prefectures` | `consumer-price-difference-index-overall` 2024 → 2025 |
| `nurse-income-prefecture-gap` | `avg-salary-all-prefecture` 2023 → 2024 |
| `price-index-high-low-prefecture` | `consumer-price-difference-index-overall` 2024 → 2025 |
| `real-disposable-income-reversal` | `consumer-price-difference-index-overall` 2024 → 2025 |
| `school-teacher-annual-income` | `elementary-school-teachers` 2023 → 2024<br>`junior-high-school-teachers` 2023 → 2024 |

# 図の年が古い公開記事 (stale-data-years)

- 生成: 2026-11-06T23:43:24.560Z
- 公開記事 848 件のうち、使う指標を snapshot から読めた記事 812 件を判定
- 図の年が指標の最新年より古い記事: **288 件**。遅れの大きい順
- 直し方: `node .claude/scripts/blog/refresh-article-data-years.mjs --slug <slug> --pull --apply` で図を最新年で作り直す → 本文の年と数値を書き直して critic を通す (`/brushup-blog` の focus `最新データ更新`)。本文がその年そのものを主題にした図だけ、取り直さず source.json に `yearPinnedReason` を書く (本文が図の年を語っていない図は図だけの食い違いなので取り直す)

| 記事 | 指標 (図の年 → 最新年) |
|---|---|
| `agriculture-output-employment-productivity-gap` | `agricultural-output` 2014 → 2024 |
| `engel-coefficient-vs-prefectural-income` | `engel-coefficient` 2021 → 2025<br>`information-communication-coefficient` 2021 → 2025 |
| `library-museum-cultural-capital` | `japanese-population` 2020 → 2024 |
| `manufacturing-labor-productivity-pref` | `manufacturing-employees` 2021 → 2025<br>`manufacturing-shipment-amount` 2021 → 2024 |
| `retail-establishments-by-prefecture` | `total-population` 2021 → 2025 |
| `fiscal-health-50years-trend` | `total-population` 2022 → 2025 |
| `local-tax-regional-gap` | `total-population` 2022 → 2025 |
| `manufacturing-productivity` | `manufacturing-employees` 2022 → 2025<br>`manufacturing-industry-added-value` 2022 → 2024<br>`manufacturing-shipment-amount` 2022 → 2024 |
| `prefectural-debt-future-burden` | `production-age-population-ratio` 2022 → 2025<br>`ratio-65-plus` 2022 → 2025 |
| `welfare-expenses-squeeze` | `total-population` 2022 → 2025 |
| `bonito-catch-prefecture` | `bonito-consumption-quantity` 2023 → 2025 |
| `fish-catch-vs-consumption-prefecture` | `tuna-consumption-expenditure` 2023 → 2025<br>`yellowtail-consumption-expenditure` 2023 → 2025 |
| `safe-driving-5-features` | `ratio-65-plus` 2023 → 2025<br>`traffic-accident-deaths-per-100-accidents` 2023 → 2024 |
| `vacant-house-crisis` | `ratio-65-plus` 2023 → 2025 |
| `accommodation-expenditure-ranking` | `accommodation-consumption-expenditure` 2024 → 2025 |
| `aichi-food-culture` | `black-tea-consumption-expenditure` 2024 → 2025<br>`black-tea-consumption-quantity` 2024 → 2025<br>`clam-consumption-expenditure` 2024 → 2025<br>`clam-consumption-quantity` 2024 → 2025<br>`dried-shiitake-consumption-expenditure` 2024 → 2025<br>`dried-shiitake-consumption-quantity` 2024 → 2025<br>`eggplant-consumption-expenditure` 2024 → 2025<br>`eggplant-consumption-quantity` 2024 → 2025<br>`fresh-udon-soba-consumption-expenditure` 2024 → 2025<br>`fresh-udon-soba-consumption-quantity` 2024 → 2025<br>`green-pepper-consumption-expenditure` 2024 → 2025<br>`green-pepper-consumption-quantity` 2024 → 2025<br>`melon-consumption-expenditure` 2024 → 2025<br>`melon-consumption-quantity` 2024 → 2025<br>`miso-consumption-expenditure` 2024 → 2025<br>`orange-consumption-expenditure` 2024 → 2025<br>`orange-consumption-quantity` 2024 → 2025<br>`taro-consumption-expenditure` 2024 → 2025<br>`taro-consumption-quantity` 2024 → 2025<br>`tuna-consumption-expenditure` 2024 → 2025<br>`tuna-consumption-quantity` 2024 → 2025<br>`whisky-consumption-expenditure` 2024 → 2025<br>`whisky-consumption-quantity` 2024 → 2025<br>`wine-consumption-expenditure` 2024 → 2025<br>`wine-consumption-quantity` 2024 → 2025 |
| `air-conditioner-consumption-quantity-prefecture-gap` | `air-conditioner-consumption-quantity` 2024 → 2025 |
| `akita-food-culture` | `bamboo-shoot-consumption-expenditure` 2024 → 2025<br>`bamboo-shoot-consumption-quantity` 2024 → 2025<br>`chinese-noodles-consumption-expenditure` 2024 → 2025<br>`chinese-noodles-consumption-quantity` 2024 → 2025<br>`eggplant-consumption-expenditure` 2024 → 2025<br>`eggplant-consumption-quantity` 2024 → 2025<br>`flounder-consumption-expenditure` 2024 → 2025<br>`flounder-consumption-quantity` 2024 → 2025<br>`freshwater-clam-consumption-expenditure` 2024 → 2025<br>`freshwater-clam-consumption-quantity` 2024 → 2025<br>`green-beans-consumption-expenditure` 2024 → 2025<br>`green-beans-consumption-quantity` 2024 → 2025<br>`melon-consumption-expenditure` 2024 → 2025<br>`melon-consumption-quantity` 2024 → 2025<br>`miso-consumption-expenditure` 2024 → 2025<br>`orange-consumption-expenditure` 2024 → 2025<br>`orange-consumption-quantity` 2024 → 2025<br>`sake-consumption-expenditure` 2024 → 2025<br>`sake-consumption-quantity` 2024 → 2025<br>`salted-salmon-consumption-expenditure` 2024 → 2025<br>`salted-salmon-consumption-quantity` 2024 → 2025<br>`saury-consumption-expenditure` 2024 → 2025<br>`shimeji-consumption-expenditure` 2024 → 2025<br>`shimeji-consumption-quantity` 2024 → 2025 |
| `annual-sales-amount-prefecture-gap` | `annual-sales-amount` 2022 → 2023 |
| `aomori-food-culture` | `apple-consumption-expenditure` 2024 → 2025<br>`cup-noodles-consumption-expenditure` 2024 → 2025<br>`flounder-consumption-expenditure` 2024 → 2025<br>`flounder-consumption-quantity` 2024 → 2025<br>`freshwater-clam-consumption-expenditure` 2024 → 2025<br>`freshwater-clam-consumption-quantity` 2024 → 2025<br>`pickled-plum-consumption-expenditure` 2024 → 2025<br>`pickled-plum-consumption-quantity` 2024 → 2025<br>`scallop-consumption-expenditure` 2024 → 2025<br>`scallop-consumption-quantity` 2024 → 2025<br>`tuna-consumption-expenditure` 2024 → 2025<br>`tuna-consumption-quantity` 2024 → 2025<br>`watermelon-consumption-expenditure` 2024 → 2025<br>`watermelon-consumption-quantity` 2024 → 2025 |
| `apple-expenditure-ranking` | `apple-consumption-expenditure` 2024 → 2025 |
| `automotive-industry-transformation-map` | `manufacturing-shipment-amount` 2023 → 2024 |
| `average-height-primary-school-fifth-grade-male-vs-other` | `other-processed-fish-ext-consumption-expenditure` 2024 → 2025 |
| `avg-height-high-school-2nd-male-vs-fish-pickled-consumption` | `fish-pickled-consumption-expenditure` 2024 → 2025 |
| `avg-height-high-school-2nd-male-vs-rice-cracker-consumption` | `rice-cracker-consumption-expenditure` 2024 → 2025 |
| `bacon-consumption-expenditure-prefecture-gap` | `bacon-consumption-expenditure` 2024 → 2025 |
| `banana-consumption-quantity` | `banana-consumption-quantity` 2024 → 2025 |
| `bean-sprouts-consumption-quantity-prefecture-gap` | `bean-sprouts-consumption-quantity` 2024 → 2025 |
| `beef-consumption-prefecture-gap` | `beef-consumption-quantity` 2024 → 2025 |
| `beef-consumption-quantity-vs-municipal-road-paving-rate` | `beef-consumption-quantity` 2024 → 2025 |
| `beef-consumption-quantity-vs-unmarried-ratio-male-45-49` | `beef-consumption-quantity` 2024 → 2025 |
| `beef-unmarried-ratio` | `beef-consumption-quantity` 2024 → 2025 |
| `beer-vs-happoshu-shift` | `beer-consumption-expenditure` 2024 → 2025<br>`happoshu-consumption-expenditure` 2024 → 2025 |
| `black-tea-expenditure-ranking` | `black-tea-consumption-expenditure` 2024 → 2025 |
| `black-tea-income-gap` | `black-tea-consumption-expenditure` 2024 → 2025<br>`black-tea-consumption-quantity` 2024 → 2025 |
| `blanket-consumption-expenditure-prefecture-gap` | `blanket-consumption-expenditure` 2024 → 2025 |
| `bonito-vs-oyster-fish-map` | `bonito-consumption-expenditure` 2024 → 2025<br>`oyster-consumption-expenditure` 2024 → 2025 |
| `bread-consumption-expenditure-vs-final-education-university` | `bread-consumption-expenditure` 2024 → 2025 |
| `bread-consumption-expenditure-vs-high-school-advancement` | `bread-consumption-expenditure` 2024 → 2025 |
| `bread-consumption-expenditure-vs-site-area-per-dwelling` | `bread-consumption-expenditure` 2024 → 2025 |
| `bread-vs-rice-expenditure` | `bread-consumption-expenditure` 2024 → 2025<br>`rice-consumption-expenditure` 2024 → 2025 |
| `burdock-consumption-quantity-prefecture-gap` | `burdock-consumption-quantity` 2024 → 2025 |
| `butter-vs-margarine-expenditure` | `butter-consumption-expenditure` 2024 → 2025<br>`margarine-consumption-expenditure` 2024 → 2025 |
| `cabbage-consumption-quantity-prefecture-gap` | `cabbage-consumption-quantity` 2024 → 2025 |
| `cake-consumption-expenditure-prefecture-gap` | `cake-consumption-expenditure` 2024 → 2025 |
| `candy-expenditure-ranking` | `candy-consumption-expenditure` 2024 → 2025 |
| `carbonated-drink-spending-prefecture-gap` | `carbonated-drink-consumption-expenditure` 2024 → 2025 |
| `carrot-consumption-quantity-prefecture-gap` | `carrot-consumption-quantity` 2024 → 2025 |
| `castella-expenditure-ranking` | `castella-consumption-expenditure` 2024 → 2025 |
| `cc-estat-08-bar-chart-race` | `manufacturing-shipment-amount` 2023 → 2024 |

ほか 238 件 (全件は stale-data-years.json)

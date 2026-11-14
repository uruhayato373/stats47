# 図の年が古い公開記事 (stale-data-years)

- 生成: 2026-11-13T23:59:39.195Z
- 公開記事 861 件のうち、使う指標を snapshot から読めた記事 816 件を判定
- 図の年が指標の最新年より古い記事: **158 件**。遅れの大きい順
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
| `air-conditioner-consumption-quantity-prefecture-gap` | `air-conditioner-consumption-quantity` 2024 → 2025 |
| `annual-sales-amount-prefecture-gap` | `annual-sales-amount` 2022 → 2023 |
| `aomori-food-culture` | `apple-consumption-expenditure` 2024 → 2025<br>`cup-noodles-consumption-expenditure` 2024 → 2025<br>`flounder-consumption-expenditure` 2024 → 2025<br>`flounder-consumption-quantity` 2024 → 2025<br>`freshwater-clam-consumption-expenditure` 2024 → 2025<br>`freshwater-clam-consumption-quantity` 2024 → 2025<br>`pickled-plum-consumption-expenditure` 2024 → 2025<br>`pickled-plum-consumption-quantity` 2024 → 2025<br>`scallop-consumption-expenditure` 2024 → 2025<br>`scallop-consumption-quantity` 2024 → 2025<br>`tuna-consumption-expenditure` 2024 → 2025<br>`tuna-consumption-quantity` 2024 → 2025<br>`watermelon-consumption-expenditure` 2024 → 2025<br>`watermelon-consumption-quantity` 2024 → 2025 |
| `automotive-industry-transformation-map` | `manufacturing-shipment-amount` 2023 → 2024 |
| `average-height-primary-school-fifth-grade-male-vs-other` | `other-processed-fish-ext-consumption-expenditure` 2024 → 2025 |
| `avg-height-high-school-2nd-male-vs-fish-pickled-consumption` | `fish-pickled-consumption-expenditure` 2024 → 2025 |
| `avg-height-high-school-2nd-male-vs-rice-cracker-consumption` | `rice-cracker-consumption-expenditure` 2024 → 2025 |
| `bacon-consumption-expenditure-prefecture-gap` | `bacon-consumption-expenditure` 2024 → 2025 |
| `beef-consumption-quantity-vs-municipal-road-paving-rate` | `beef-consumption-quantity` 2024 → 2025 |
| `beef-consumption-quantity-vs-unmarried-ratio-male-45-49` | `beef-consumption-quantity` 2024 → 2025 |
| `beef-unmarried-ratio` | `beef-consumption-quantity` 2024 → 2025 |
| `beer-vs-happoshu-shift` | `beer-consumption-expenditure` 2024 → 2025<br>`happoshu-consumption-expenditure` 2024 → 2025 |
| `blanket-consumption-expenditure-prefecture-gap` | `blanket-consumption-expenditure` 2024 → 2025 |
| `bread-consumption-expenditure-vs-final-education-university` | `bread-consumption-expenditure` 2024 → 2025 |
| `bread-consumption-expenditure-vs-high-school-advancement` | `bread-consumption-expenditure` 2024 → 2025 |
| `bread-consumption-expenditure-vs-site-area-per-dwelling` | `bread-consumption-expenditure` 2024 → 2025 |
| `bread-vs-rice-expenditure` | `bread-consumption-expenditure` 2024 → 2025<br>`rice-consumption-expenditure` 2024 → 2025 |
| `burdock-consumption-quantity-prefecture-gap` | `burdock-consumption-quantity` 2024 → 2025 |
| `cabbage-consumption-quantity-prefecture-gap` | `cabbage-consumption-quantity` 2024 → 2025 |
| `cake-consumption-expenditure-prefecture-gap` | `cake-consumption-expenditure` 2024 → 2025 |
| `carrot-consumption-quantity-prefecture-gap` | `carrot-consumption-quantity` 2024 → 2025 |
| `cc-estat-08-bar-chart-race` | `manufacturing-shipment-amount` 2023 → 2024 |
| `cc-estat-10-wage-box-plot` | `regular-cash-salary-male` 2023 → 2024 |
| `cc-estat-16-commerce-bubble` | `annual-sales-amount` 2022 → 2023 |
| `chicken-consumption-quantity` | `chicken-consumption-quantity` 2024 → 2025 |
| `childrens-clothes-consumption-expenditure-prefecture-gap` | `childrens-clothes-consumption-expenditure` 2024 → 2025 |
| `chinese-noodles-consumption-expenditure-prefecture-gap` | `chinese-noodles-consumption-expenditure` 2024 → 2025 |
| `clam-consumption-quantity-prefecture-gap` | `clam-consumption-quantity` 2024 → 2025 |
| `clothing-footwear-expenditure-total-prefecture-gap` | `clothing-footwear-expenditure-total` 2024 → 2025 |
| `cocoa-consumption-expenditure-prefecture-gap` | `cocoa-consumption-expenditure` 2024 → 2025 |
| `coffee-drink-consumption-expenditure-prefecture-gap` | `coffee-drink-consumption-expenditure` 2024 → 2025 |
| `confectionery-consumption-expenditure-prefecture-gap` | `confectionery-consumption-expenditure` 2024 → 2025 |
| `consumer-price-difference-index-utilities-prefecture-gap` | `consumer-price-difference-index-utilities` 2024 → 2025 |
| `consumer-price-regional-gap` | `consumer-price-difference-index-clothing-footwear` 2024 → 2025<br>`consumer-price-difference-index-culture-recreation` 2024 → 2025<br>`consumer-price-difference-index-education` 2024 → 2025<br>`consumer-price-difference-index-food` 2024 → 2025<br>`consumer-price-difference-index-furniture-household` 2024 → 2025<br>`consumer-price-difference-index-healthcare` 2024 → 2025<br>`consumer-price-difference-index-housing` 2024 → 2025<br>`consumer-price-difference-index-miscellaneous` 2024 → 2025<br>`consumer-price-difference-index-overall` 2024 → 2025<br>`consumer-price-difference-index-transport-communication` 2024 → 2025<br>`consumer-price-difference-index-utilities` 2024 → 2025 |
| `cooking-oil-consumption-quantity-prefecture-gap` | `cooking-oil-consumption-quantity` 2024 → 2025 |

ほか 108 件 (全件は stale-data-years.json)

## 公表済みなのに古い年のままの記事 (公表暦)

- 基準日 2026-11-13。公表暦 (`data/surveys/release-calendar/release-calendar.json`) の 11 調査について、公表月の翌月 1 日から公表済みとみなす。指標の調査が 1 つでも公表暦に無い図は判定しない
- 該当する記事: **236 件**。うち指標の年次更新が先 (`ingest-metric`) の指標 94 件、記事の更新だけで済む行 (`refresh-article`) 195 件
- 順番: 先に `ingest-metric` の指標を公表済みの年まで取り込み、次に記事の数値と図を最新年にする (上の直し方)。検索実績のある既存 URL を新規記事より先にする

| 記事 | 指標 (図の年 / サイトの最新年 / 公表済みの年・次の作業) |
|---|---|
| `high-school-teacher-annual-income-vs-new-graduate-starting` | `new-graduate-starting-salary-college-male` 2019 / 2019 / 2025・ingest-metric<br>`high-school-teacher-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `population-migration-tokyo-concentration` | `social-increase-rate` 2019 / 2019 / 2024・ingest-metric |
| `beef-consumption-quantity-vs-unmarried-ratio-male-45-49` | `unmarried-ratio-male-45-49` 2020 / 2020 / 2024・ingest-metric<br>`beef-consumption-quantity` 2024 / 2025 / 2025・refresh-article |
| `beef-unmarried-ratio` | `unmarried-ratio-male-45-49` 2020 / 2020 / 2024・ingest-metric<br>`beef-consumption-quantity` 2024 / 2025 / 2025・refresh-article |
| `engel-coefficient-vs-prefectural-income` | `engel-coefficient` 2021 / 2025 / 2025・refresh-article<br>`information-communication-coefficient` 2021 / 2025 / 2025・refresh-article<br>`per-capita-prefectural-income-h27` 2021 / 2021 / 2022・ingest-metric |
| `foreign-population-growth-rate` | `foreign-resident-count-per-100k` 2020 / 2020 / 2024・ingest-metric |
| `foreign-residents-diversity-map` | `foreign-resident-count-per-100k` 2020 / 2020 / 2024・ingest-metric |
| `inflow-population-ratio-prefecture-gap` | `inflow-population-ratio` 2020 / 2020 / 2024・ingest-metric |
| `library-museum-cultural-capital` | `japanese-population` 2020 / 2024 / 2024・refresh-article |
| `unmarried-rate-40years-crisis` | `unmarried-ratio-male-30-34` 2020 / 2020 / 2024・ingest-metric |
| `female-scheduled-earnings-prefecture-gap` | `female-scheduled-earnings` 2022 / 2022 / 2025・ingest-metric |
| `fertility-fiscal-nexus` | `total-fertility-rate` 2022 / 2023 / 2025・ingest-metric |
| `marriage-divorce-okinawa` | `divorces-per-total-population` 2022 / 2022 / 2025・ingest-metric<br>`marriages-per-total-population` 2022 / 2022 / 2025・ingest-metric |
| `retail-establishments-by-prefecture` | `total-population` 2021 / 2025 / 2024・refresh-article |
| `advancement-plus-employment-rate-prefecture` | `high-school-advancement-rate` 2023 / 2023 / 2025・ingest-metric<br>`high-school-graduates-job-ratio` 2023 / 2023 / 2025・ingest-metric |
| `aging-rate-akita-vs-okinawa` | `young-population-index` 2022 / 2022 / 2024・ingest-metric |
| `average-age-of-first-marriage-wife-prefecture-gap` | `average-age-of-first-marriage-wife` 2023 / 2023 / 2025・ingest-metric |
| `average-height-primary-school-fifth-grade-male-vs-other` | `average-height-primary-school-fifth-grade-male` 2023 / 2023 / 2025・ingest-metric<br>`other-processed-fish-ext-consumption-expenditure` 2024 / 2025 / 2025・refresh-article |
| `avg-height-high-school-2nd-male` | `avg-height-high-school-2nd-male` 2023 / 2023 / 2025・ingest-metric |
| `avg-height-high-school-2nd-male-vs-fish-pickled-consumption` | `avg-height-high-school-2nd-male` 2023 / 2023 / 2025・ingest-metric<br>`fish-pickled-consumption-expenditure` 2024 / 2025 / 2025・refresh-article |
| `avg-height-high-school-2nd-male-vs-floor-area-new-owner` | `avg-height-high-school-2nd-male` 2023 / 2023 / 2025・ingest-metric |
| `avg-height-high-school-2nd-male-vs-rice-cracker-consumption` | `avg-height-high-school-2nd-male` 2023 / 2023 / 2025・ingest-metric<br>`rice-cracker-consumption-expenditure` 2024 / 2025 / 2025・refresh-article |
| `birth-death-gap-decline` | `total-fertility-rate` 2023 / 2023 / 2025・ingest-metric |
| `bonito-catch-prefecture` | `bonito-consumption-quantity` 2023 / 2025 / 2025・refresh-article |
| `bread-consumption-expenditure-vs-high-school-advancement` | `high-school-advancement-rate` 2023 / 2023 / 2025・ingest-metric<br>`bread-consumption-expenditure` 2024 / 2025 / 2025・refresh-article |
| `care-worker-income-prefecture-gap` | `care-manager-annual-income` 2023 / 2023 / 2025・ingest-metric<br>`care-worker-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `carpenter-income-prefecture-gap` | `carpenter-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `cc-estat-07-birthrate-line` | `total-fertility-rate` 2023 / 2023 / 2025・ingest-metric |
| `cc-estat-10-wage-box-plot` | `regular-cash-salary-male` 2023 / 2024 / 2025・ingest-metric |
| `childcare-friendly-prefecture-ranking` | `total-fertility-rate` 2023 / 2023 / 2025・ingest-metric |
| `deaths-cerebrovascular-disease-prefecture-gap` | `deaths-cerebrovascular-disease` 2023 / 2023 / 2025・ingest-metric |
| `deaths-hypertensive-diseases-prefecture-gap` | `deaths-hypertensive-diseases` 2023 / 2023 / 2025・ingest-metric |
| `deaths-lifestyle-diseases-prefecture-gap` | `deaths-lifestyle-diseases` 2023 / 2023 / 2025・ingest-metric |
| `delivery-hospital-count-prefecture-gap` | `delivery-hospital-count` 2023 / 2023 / 2025・ingest-metric |
| `dental-clinic-count-prefecture-gap` | `dental-clinic-count` 2023 / 2023 / 2025・ingest-metric |
| `dental-hygienist-income-prefecture-gap` | `dental-hygienist-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `dentist-income-prefecture-gap` | `dentist-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `divorces-prefecture-gap` | `divorces` 2023 / 2023 / 2025・ingest-metric |
| `doctor-income-prefecture-gap` | `doctor-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `early-neonatal-deaths-prefecture-gap` | `early-neonatal-deaths` 2023 / 2023 / 2025・ingest-metric |
| `emergency-hospital-general-clinic-count-per-100k-prefecture` | `emergency-hospital-general-clinic-count-per-100k` 2023 / 2023 / 2025・ingest-metric |
| `engineer-vs-professions-income` | `software-engineer-annual-income` 2023 / 2023 / 2025・ingest-metric |
| `fertility-rate-prefecture-gap` | `total-fertility-rate` 2023 / 2023 / 2025・ingest-metric |
| `fire-department-pump-car-count-per-100-thousand-people` | `fire-department-pump-car-count-per-100-thousand-people` 2022 / 2022 / 2024・ingest-metric |
| `firefighting-capacity-gap` | `fire-department-member-count-per-100-thousand-people` 2022 / 2022 / 2024・ingest-metric |
| `fiscal-health-50years-trend` | `total-population` 2022 / 2025 / 2024・refresh-article |
| `fish-catch-vs-consumption-prefecture` | `tuna-consumption-expenditure` 2023 / 2025 / 2025・refresh-article<br>`yellowtail-consumption-expenditure` 2023 / 2025 / 2025・refresh-article |
| `general-hospital-bed-occupancy-rate` | `general-hospital-bed-occupancy-rate` 2023 / 2023 / 2025・ingest-metric |
| `high-school-advancement-rate` | `high-school-advancement-rate` 2023 / 2023 / 2025・ingest-metric |
| `high-school-teacher-salary-prefecture-gap` | `high-school-teacher-annual-income` 2023 / 2023 / 2025・ingest-metric |

ほか 186 件 (全件は stale-data-years.json の releaseDue)

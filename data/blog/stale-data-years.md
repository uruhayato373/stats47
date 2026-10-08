# 図の年が古い公開記事 (stale-data-years)

- 生成: 2026-10-08T02:24:53.452Z
- 公開記事 607 件のうち、使う指標を snapshot から読めた記事 568 件を判定
- 図の年が指標の最新年より古い記事: **15 件**。遅れの大きい順
- 直し方: `node .claude/scripts/blog/refresh-article-data-years.mjs --slug <slug> --pull --apply` で図を最新年で作り直す → 本文の年と数値を書き直して critic を通す (`/brushup-blog` の focus `最新データ更新`)。本文がその年そのものを主題にした図だけ、取り直さず source.json に `yearPinnedReason` を書く (本文が図の年を語っていない図は図だけの食い違いなので取り直す)

| 記事 | 指標 (図の年 → 最新年) |
|---|---|
| `fish-catch-vs-consumption-prefecture` | `tuna-consumption-expenditure` 2015 → 2024<br>`yellowtail-consumption-expenditure` 2015 → 2024 |
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
| `cc-estat-20-publish` | `total-population` 2024 → 2025 |
| `fertility-fiscal-nexus` | `total-fertility-rate` 2022 → 2023 |
| `nurse-income-prefecture-gap` | `avg-salary-all-prefecture` 2023 → 2024 |

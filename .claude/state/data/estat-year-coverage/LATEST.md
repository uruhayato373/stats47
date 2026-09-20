# e-Stat 年カバレッジ監査 (LATEST)

- 生成: 2026-09-19T22:19:37.890Z
- 対象母集団: 単年設定の active e-Stat metric 582 件 (今回確認 100 件)
- 判定: 都道府県1件 (北海道) をサンプルに `getStatsData` を実測し、値が non-null な年の件数を
  config の `years` と比較する。全 47 都道府県の精査ではなく代表 1 件によるスクリーニング

## サマリ

- **要拡張候補 (extend-candidate)**: 87 件
- 単年で確定 (confirmed-single-year): 13 件
- 取得失敗 (fetch-failed・次回再試行): 0 件
- 未確認 (次回以降のバッチで確認): 482 件

## 要拡張候補 (config の years を広げて再取り込みする)

- `abandoned-cultivated-land-area` — config 1年 → e-Stat実在 2年 (2009-2014)
- `accident-death-30day` — config 1年 → e-Stat実在 3年 (2016-2018)
- `active-job-opening-ratio` — config 1年 → e-Stat実在 48年 (1975-2022)
- `actual-income-worker-households-per-month` — config 1年 → e-Stat実在 50年 (1975-2024)
- `acupuncture-moxibustion-count` — config 1年 → e-Stat実在 28年 (1975-2022)
- `adult-class-lecture-count-per-million` — config 1年 → e-Stat実在 23年 (1977-2020)
- `age-specific-death-rate-0-4-per-1000` — config 1年 → e-Stat実在 49年 (1975-2023)
- `aging-index` — config 1年 → e-Stat実在 48年 (1975-2022)
- `agricultural-employment-population` — config 1年 → e-Stat実在 10年 (1989-2014)
- `agricultural-farm-count` — config 1年 → e-Stat実在 33年 (1975-2019)
- `agricultural-income-ratio` — config 1年 → e-Stat実在 11年 (1985-2003)
- `agricultural-land-conversion-area` — config 1年 → e-Stat実在 23年 (2000-2022)
- `agricultural-output-per-employed-person` — config 1年 → e-Stat実在 22年 (1989-2018)
- `agriculture-forestry-fisheries-expenditure-ratio-pref-finance` — config 1年 → e-Stat実在 48年 (1975-2022)
- `agriculture-forestry-fisheries-expenses-prefecture` — config 1年 → e-Stat実在 48年 (1975-2022)
- `air-cargo-transport` — config 1年 → e-Stat実在 39年 (1985-2023)
- `air-passenger-transport` — config 1年 → e-Stat実在 49年 (1975-2023)
- `anma-massage-count` — config 1年 → e-Stat実在 28年 (1975-2022)
- `annual-clear-days` — config 1年 → e-Stat実在 46年 (1975-2020)
- `annual-cloudy-days` — config 1年 → e-Stat実在 33年 (1975-2007)
- `annual-minimum-relative-humidity` — config 1年 → e-Stat実在 33年 (1975-2007)
- `annual-new-inpatients-general-hospital-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `annual-new-inpatients-psychiatric-hospital-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `annual-precipitation` — config 1年 → e-Stat実在 50年 (1975-2024)
- `annual-precipitation-days` — config 1年 → e-Stat実在 50年 (1975-2024)
- `annual-snow-days` — config 1年 → e-Stat実在 46年 (1975-2020)
- `annual-sunshine-duration` — config 1年 → e-Stat実在 50年 (1975-2024)
- `apartment-ratio` — config 1年 → e-Stat実在 10年 (1978-2023)
- `apparel-retail-store-count-per-1000` — config 1年 → e-Stat実在 8年 (1975-2006)
- `area-ratio-of-total` — config 1年 → e-Stat実在 50年 (1975-2024)
- `artificial-forest-area` — config 1年 → e-Stat実在 8年 (2000-2007)
- `assembly-expenses-prefecture` — config 1年 → e-Stat実在 13年 (2010-2022)
- `assistance-expenditure-ratio-pref-finance` — config 1年 → e-Stat実在 48年 (1975-2022)
- `assistance-expenses-prefecture` — config 1年 → e-Stat実在 48年 (1975-2022)
- `auto-liability-insurance-amount-received-per-payment` — config 1年 → e-Stat実在 30年 (1994-2023)
- `average-age-of-first-marriage-husband` — config 1年 → e-Stat実在 49年 (1975-2023)
- `average-age-of-first-marriage-wife` — config 1年 → e-Stat実在 49年 (1975-2023)
- `average-broadcast-media-consumption-time-employed-man` — config 1年 → e-Stat実在 9年 (1981-2021)
- `average-broadcast-media-consumption-time-employed-woman` — config 1年 → e-Stat実在 9年 (1981-2021)
- `average-height-high-school-second-grade-female` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-height-middle-school-second-grade-female` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-height-middle-school-second-grade-male` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-height-primary-school-fifth-grade-female` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-height-primary-school-fifth-grade-male` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-life-expectancy-female-20` — config 1年 → e-Stat実在 10年 (1975-2020)
- `average-life-expectancy-female-65` — config 1年 → e-Stat実在 10年 (1975-2020)
- `average-life-expectancy-male` — config 1年 → e-Stat実在 10年 (1975-2020)
- `average-payment-amount-of-workers-compensation-insurance-benefits` — config 1年 → e-Stat実在 49年 (1975-2023)
- `average-persons-per-general-household` — config 1年 → e-Stat実在 9年 (1980-2020)
- `average-propensity-to-consume-of-farm-households` — config 1年 → e-Stat実在 11年 (1985-2003)
- `average-relative-humidity` — config 1年 → e-Stat実在 50年 (1975-2024)
- `average-road-traffic-volume` — config 1年 → e-Stat実在 4年 (2005-2020)
- `average-temperature` — config 1年 → e-Stat実在 50年 (1975-2024)
- `average-weight-high-school-second-grade-female` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-weight-high-school-second-grade-male` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-weight-middle-school-second-grade-female` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-weight-middle-school-second-grade-male` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-weight-primary-school-fifth-grade-female` — config 1年 → e-Stat実在 47年 (1975-2023)
- `average-weight-primary-school-fifth-grade-male` — config 1年 → e-Stat実在 47年 (1975-2023)
- `avg-daily-inpatients-general-hospital-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `avg-daily-inpatients-psychiatric-hospital-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `avg-daily-outpatients-general-hospital-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `avg-daily-outpatients-psychiatric-hospital-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `avg-height-high-school-2nd-male` — config 1年 → e-Stat実在 47年 (1975-2023)
- `avg-propensity-to-consume-worker-households` — config 1年 → e-Stat実在 50年 (1975-2024)
- `avg-savings-rate-worker-households` — config 1年 → e-Stat実在 50年 (1975-2024)
- `bamboo-production` — config 1年 → e-Stat実在 22年 (1975-2002)
- `bank-deposit-balance-per-person` — config 1年 → e-Stat実在 50年 (1975-2024)
- `bank-loan-balance` — config 1年 → e-Stat実在 50年 (1975-2024)
- `bank-personal-deposit` — config 1年 → e-Stat実在 46年 (1979-2024)
- `barber-beauty-salon-count-per-100k` — config 1年 → e-Stat実在 49年 (1975-2023)
- `bathroom-housing-ratio` — config 1年 → e-Stat実在 7年 (1978-2008)
- `births-first-child` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-mother-age25to29` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-mother-age30to34` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-mother-age35to39` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-mother-age40plus` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-mother-under25` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-second-child` — config 1年 → e-Stat実在 10年 (2015-2024)
- `births-third-child-plus` — config 1年 → e-Stat実在 10年 (2015-2024)
- `block-park-count` — config 1年 → e-Stat実在 49年 (1975-2023)
- `block-park-count-per-100km2` — config 1年 → e-Stat実在 49年 (1975-2023)
- `bod-pollution-load` — config 1年 → e-Stat実在 5年 (2011-2019)
- `book-magazine-retail-annual-sales-per-capita` — config 1年 → e-Stat実在 10年 (1975-2006)
- `building-fire-count-per-100-thousand-people` — config 1年 → e-Stat実在 49年 (1975-2023)
- `building-fire-damage-amount-per-building-fire` — config 1年 → e-Stat実在 49年 (1975-2023)
- `building-fire-damage-amount-per-person` — config 1年 → e-Stat実在 49年 (1975-2023)


## 直し方

- `extend-candidate`: `packages/data-configs/src/metrics/<key>.ts` の `years` を
  `availableYearCodes` の範囲へ拡張し (5年おき等は `{years:[...]}` 形式)、
  `validate:years`/`validate:config` 後、`data/data-refresh-requests.json` を push して
  `data-refresh.yml` に再取り込みさせる。正典: `.claude/rules/metric-config-standards.md`
- `confirmed-single-year`: 対応不要。この指標は本当に単年しかない
- `fetch-failed`: 次回のバッチで自動的に再試行される (checkedAt が更新されないため優先度が高い)

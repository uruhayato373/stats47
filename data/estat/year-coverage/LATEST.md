# e-Stat 年カバレッジ監査 (LATEST)

- 生成: 2026-10-26T03:03:16.835Z
- 対象母集団: 単年設定の active e-Stat metric 259 件 (今回確認 100 件)
- 判定: 都道府県1件 (北海道) をサンプルに `getStatsData` を実測し、値が non-null な年の件数を
  config の `years` と比較する。全 47 都道府県の精査ではなく代表 1 件によるスクリーニング

## サマリ

- **要拡張候補 (extend-candidate)**: 29 件
- 単年で確定 (confirmed-single-year): 201 件
- 複数年の config が実在年を含む (config-covers): 171 件
- 監査の取得では値が無く判定できない (no-sample-values): 37 件 — `dairy-cattle-count`, `fishery-household-sex-age`, `fishery-management-orgs`, `fishery-workers-coastal-offshore`, `fishing-port-count-by-type`, `fishing-vessel-crew`, `fishing-vessel-tonnage-class`, `inpatient-rate-per-100k`, `outpatient-rate-per-100k`, `port-entry-vessel-count`, `recreational-fishing-count`, `treatment-rate-arthrosis-inpatient`, `treatment-rate-arthrosis-outpatient`, `treatment-rate-asthma-inpatient`, `treatment-rate-asthma-outpatient`, `treatment-rate-cancer-inpatient`, `treatment-rate-cancer-outpatient`, `treatment-rate-cerebrovascular-inpatient`, `treatment-rate-cerebrovascular-outpatient`, `treatment-rate-circulatory-inpatient`, `treatment-rate-circulatory-outpatient`, `treatment-rate-diabetes-inpatient`, `treatment-rate-diabetes-outpatient`, `treatment-rate-hypertension-inpatient`, `treatment-rate-hypertension-outpatient`, `treatment-rate-mental-disorder-inpatient`, `treatment-rate-mental-disorder-outpatient`, `treatment-rate-mood-disorder-inpatient`, `treatment-rate-mood-disorder-outpatient`, `treatment-rate-musculoskeletal-inpatient`, `treatment-rate-musculoskeletal-outpatient`, `treatment-rate-neurosis-inpatient`, `treatment-rate-neurosis-outpatient`, `treatment-rate-osteoporosis-inpatient`, `treatment-rate-osteoporosis-outpatient`, `treatment-rate-schizophrenia-inpatient`, `treatment-rate-schizophrenia-outpatient`
- 取得失敗 (fetch-failed・次回再試行): 16 件
- 未確認 (次回以降のバッチで確認): 0 件
- 全 47 都道府県で確認した記録 (`--metrics`、年ごとの都道府県数つき): 13 件

## 要拡張候補 (config の years を広げて再取り込みする)

- `acupuncture-moxibustion-count` — config 27年 → e-Stat実在 28年 (1975-2022)
- `adult-class-lecture-count-per-million` — config 15年 → e-Stat実在 23年 (1977-2020)
- `agricultural-land-conversion-area` — config 22年 → e-Stat実在 23年 (2000-2022)
- `anma-massage-count` — config 27年 → e-Stat実在 28年 (1975-2022)
- `annual-clear-days` — config 37年 → e-Stat実在 46年 (1975-2020)
- `annual-cloudy-days` — config 32年 → e-Stat実在 33年 (1975-2007)
- `annual-snow-days` — config 43年 → e-Stat実在 46年 (1975-2020)
- `bamboo-production` — config 14年 → e-Stat実在 22年 (1975-2002)
- `charcoal-production` — config 32年 → e-Stat実在 33年 (1975-2007)
- `child-consultation-center-cases-per-1000` — config 23年 → e-Stat実在 24年 (2000-2023)
- `convenience-store-sales` — config 1年 → e-Stat実在 5年 (2021-2025)
- `convenience-store-sales-monthly` — config 3年 → e-Stat実在 5年 (2021-2025)
- `cpi-change-rate-excl-owner-rent` — config 49年 → e-Stat実在 50年 (1975-2024)
- `factory-establishment-count` — config 24年 → e-Stat実在 26年 (1995-2020)
- `factory-industrial-park-rate` — config 24年 → e-Stat実在 26年 (1995-2020)
- `factory-location-area-annual` — config 10年 → e-Stat実在 26年 (1995-2020)
- `flood-affected-municipalities` — config 5年 → e-Stat実在 9年 (2006-2014)
- `flood-affected-rivers` — config 5年 → e-Stat実在 9年 (2006-2014)
- `flood-casualties-total` — config 2年 → e-Stat実在 6年 (2006-2014)
- `flood-damage-bridge` — config 2年 → e-Stat実在 9年 (2006-2014)
- `flood-damage-general-assets` — config 4年 → e-Stat実在 9年 (2006-2014)
- `flood-damage-public-infrastructure` — config 5年 → e-Stat実在 9年 (2006-2014)
- `flood-damage-road` — config 4年 → e-Stat実在 9年 (2006-2014)
- `flood-damage-total` — config 8年 → e-Stat実在 9年 (2006-2014)
- `flood-deaths` — config 2年 → e-Stat実在 3年 (2010-2014)
- `industrial-land-price` — config 1年 → e-Stat実在 49年 (1976-2024)
- `manufacturing-net-value-added-private` — config 1年 → e-Stat実在 3年 (2011-2020)
- `manufacturing-sales-private` — config 1年 → e-Stat実在 4年 (2011-2020)
- `retail-employees` — config 1年 → e-Stat実在 16年 (1976-2021)


## 直し方

- `extend-candidate`: `data/metrics/<key>.ts` の `years` を
  `availableYearCodes` の範囲へ拡張し (5年おき等は `{years:[...]}` 形式)、
  `validate:years`/`validate:config` 後、`data/data-refresh-requests.json` を push して
  `data-refresh.yml` に再取り込みさせる。正典: `.claude/rules/metric-config-standards.md`
- `confirmed-single-year`: 対応不要。この指標は本当に単年しかない
- `config-covers`: 対応不要。config の years が記録した実在年をすべて含む
- `no-sample-values`: 監査の取得条件では値のある年が無いので、単年かどうか判断できない。
  `areaAxis` (都道府県が分類軸にある表) などを監査が再現できていない。R2 の values.json と e-Stat の実在年の台帳で年を確かめる
- `fetch-failed`: 次回のバッチで自動的に再試行される (checkedAt が更新されないため優先度が高い)

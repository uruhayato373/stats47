# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-04T00:10:23.457Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 718 件 (33.2% / impressions 計 60587)
- ⏳ needs-regen: 1445 件 (impressions 計 1452)
  - 内訳: incomplete 1252 / missing 141 / blocker 52
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **14.5 件/日** (2026-07-30 からの平均)
- 残り 1445 件 → **完了見込み 約 100 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 02 Sep 2026 11:26:57 GMT | whisky-consumption-expenditure | 8 |
| Wed, 02 Sep 2026 11:26:57 GMT | womens-sweater-consumption-expenditure | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | toothpaste-consumption-expenditure | 8 |
| Wed, 02 Sep 2026 11:26:56 GMT | treatment-rate-cerebrovascular-inpatient | 8 |
| Wed, 02 Sep 2026 11:26:56 GMT | total-museum-count | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | travel-bag-consumption-quantity | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | travel-participation-rate-domestic | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | unmarried-ratio-female-35-39 | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | vinegar-consumption-expenditure | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | wakame-consumption-expenditure | 7 |
| Wed, 02 Sep 2026 11:15:08 GMT | solar-power-housing | 7 |
| Wed, 02 Sep 2026 11:15:07 GMT | sardine-consumption-quantity | 9 |
| Wed, 02 Sep 2026 11:15:07 GMT | senility-death-rate | 9 |
| Wed, 02 Sep 2026 11:15:07 GMT | small-scale-farm-households | 9 |
| Wed, 02 Sep 2026 11:15:07 GMT | smartphone-usage-rate-by-sex | 9 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | library-count-per-million | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | magazines-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | membership-fees-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | midwife-by-prefecture | missing | 🟠手動是正候補 | - |
| 6 | number-of-hotel-rooms | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 6 | other-clothing-service-consumption-expenditure | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 6 | port-ships-tonnage | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | practical-nurse-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | public-bath-count-per-100k | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | pudding-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 6 | rice-harvest-volume | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 6 | salad-consumption-expenditure | incomplete | 🟠手動是正候補 | missing-insights,missing-pref-commentary |
| 6 | secondary-activity-avg-time-unemployed-male | missing | 🟠手動是正候補 | - |
| 6 | shared-burden-fees-prefecture | blocker | 🟠手動是正候補 | paren-number,paren-number |
| 6 | sports-park-count | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 6 | sports-participation-rate-softball | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 6 | transport-communication-expenditure-ratio-multi-person-households | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 6 | umbrella-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | unmarried-ratio-female-45-49 | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

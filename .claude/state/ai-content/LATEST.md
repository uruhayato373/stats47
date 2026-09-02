# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-02T10:25:33.258Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 618 件 (28.6% / impressions 計 59864)
- ⏳ needs-regen: 1545 件 (impressions 計 2175)
  - 内訳: incomplete 1329 / missing 161 / blocker 55
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **12.4 件/日** (2026-07-30 からの平均)
- 残り 1545 件 → **完了見込み 約 125 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 02 Sep 2026 10:23:16 GMT | womens-socks-consumption-quantity | 13 |
| Wed, 02 Sep 2026 10:23:16 GMT | voter-turnout-house-proportional | 11 |
| Wed, 02 Sep 2026 10:23:16 GMT | wine-consumption-expenditure | 11 |
| Wed, 02 Sep 2026 10:23:16 GMT | yakiniku-consumption-expenditure | 10 |
| Wed, 02 Sep 2026 10:23:15 GMT | traffic-safety-special-grant-prefecture | 13 |
| Wed, 02 Sep 2026 10:23:15 GMT | total-assessed-land-area-ratio | 12 |
| Wed, 02 Sep 2026 10:23:15 GMT | voter-turnout-council-proportional | 11 |
| Wed, 02 Sep 2026 10:23:15 GMT | tomato-consumption-expenditure | 10 |
| Wed, 02 Sep 2026 10:23:15 GMT | toothbrush-consumption-expenditure | 10 |
| Wed, 02 Sep 2026 10:23:15 GMT | travel-leisure-annual-participation-rate-10plus | 10 |
| Wed, 02 Sep 2026 10:23:15 GMT | treatment-rate-mood-disorder-inpatient | 10 |
| Wed, 02 Sep 2026 10:23:15 GMT | tofu-consumption-expenditure | 9 |
| Wed, 02 Sep 2026 10:23:14 GMT | sole-proprietor-sales-per-worker | 12 |
| Wed, 02 Sep 2026 10:23:14 GMT | study-participation-rate-home-economics | 12 |
| Wed, 02 Sep 2026 10:23:14 GMT | sports-participation-rate-golf | 11 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 9 | dressing-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 9 | fishing-vessel-tonnage-class | missing | 🟠手動是正候補 | - |
| 9 | hobby-participation-rate-writing | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 9 | housework-avg-time-female | missing | 🟠手動是正候補 | - |
| 9 | new-graduate-scheduled-salary-highschool-male | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 9 | other-fish-paste-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 9 | other-western-sweets-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 9 | sardine-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 9 | senility-death-rate | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 9 | small-scale-farm-households | missing | 🟠手動是正候補 | - |
| 9 | smartphone-usage-rate-by-sex | missing | 🟠手動是正候補 | - |
| 9 | strawberry-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 8 | annual-snow-days | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 8 | associate-professor-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 8 | beauty-salon-count | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 8 | current-securities-balance-ratio-multi-person-households | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 8 | dentist-annual-income | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 8 | elderly-household-detail | missing | 🟠手動是正候補 | - |
| 8 | employee-ratio-5-9-employee-establishments-private | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 8 | food-expenditure-total | missing | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

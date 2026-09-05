# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-05T05:36:10.128Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2166 件)

- ✅ done: 747 件 (34.5% / impressions 計 60752)
- ⏳ needs-regen: 1419 件 (impressions 計 1287)
  - 内訳: incomplete 1230 / missing 139 / blocker 50
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **14.9 件/日** (2026-07-30 からの平均)
- 残り 1419 件 → **完了見込み 約 96 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 05 Sep 2026 05:34:18 GMT | number-of-hotel-rooms | 6 |
| Sat, 05 Sep 2026 05:34:18 GMT | public-bath-count-per-100k | 6 |
| Sat, 05 Sep 2026 05:34:18 GMT | urban-planning-expenses-prefecture | 6 |
| Sat, 05 Sep 2026 05:34:18 GMT | avg-savings-rate-worker-households | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | beauty-appliance-consumption-expenditure | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | care-manager-annual-income | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | clothing-rental-consumption-expenditure | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | convenience-store-sales-yoy | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | death-accident | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | dried-nori-consumption-expenditure | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | earmarked-tax-local | 5 |
| Sat, 05 Sep 2026 05:34:18 GMT | factory-industrial-park-rate | 5 |
| Sat, 05 Sep 2026 04:01:09 GMT | membership-fees-consumption-expenditure | 6 |
| Sat, 05 Sep 2026 04:01:09 GMT | midwife-by-prefecture | 6 |
| Sat, 05 Sep 2026 04:01:09 GMT | other-clothing-service-consumption-expenditure | 6 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | womens-clothing-consumption-expenditure | missing | 🟠手動是正候補 | - |
| 5 | curry-roux-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | dementia-death-rate | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | fishing-vessel-crew | missing | 🟠手動是正候補 | - |
| 5 | frozen-food-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | hobby-participation-rate-diy | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | hobby-participation-rate-popular-music | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | in-pref-university-entrance-ratio-by-highschool-origin | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | inpatient-rate-per-100k | incomplete | 🟠手動是正候補 | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 5 | kiwi-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mayonnaise-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mochi-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,ng-word,paren-number,missing-pref-commentary |
| 5 | municipal-intellectual-disability-consultations | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | music-lesson-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | national-pension-enrollees-type1-per-1000-20-59 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | new-graduate-scheduled-salary-college-female | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | orange-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | other-consumption-expenditure-ratio-multi-person-households | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | other-dried-vegetables-seaweed-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

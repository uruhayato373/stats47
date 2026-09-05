# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-05T03:32:12.164Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 729 件 (33.7% / impressions 計 60653)
- ⏳ needs-regen: 1434 件 (impressions 計 1386)
  - 内訳: incomplete 1243 / missing 140 / blocker 51
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **14.4 件/日** (2026-07-30 からの平均)
- 残り 1434 件 → **完了見込み 約 100 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 05 Sep 2026 03:29:21 GMT | library-count-per-million | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | magazines-consumption-expenditure | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | rice-harvest-volume | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | salad-consumption-expenditure | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | secondary-activity-avg-time-unemployed-male | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | shared-burden-fees-prefecture | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | sports-park-count | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | sports-participation-rate-softball | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | transport-communication-expenditure-ratio-multi-person-households | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | umbrella-consumption-expenditure | 6 |
| Sat, 05 Sep 2026 03:29:21 GMT | unmarried-ratio-female-45-49 | 6 |
| Wed, 02 Sep 2026 11:26:57 GMT | whisky-consumption-expenditure | 8 |
| Wed, 02 Sep 2026 11:26:57 GMT | womens-sweater-consumption-expenditure | 7 |
| Wed, 02 Sep 2026 11:26:56 GMT | toothpaste-consumption-expenditure | 8 |
| Wed, 02 Sep 2026 11:26:56 GMT | treatment-rate-cerebrovascular-inpatient | 8 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | membership-fees-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | midwife-by-prefecture | missing | 🟠手動是正候補 | - |
| 6 | number-of-hotel-rooms | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 6 | other-clothing-service-consumption-expenditure | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 6 | port-ships-tonnage | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | practical-nurse-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | public-bath-count-per-100k | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 6 | pudding-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 6 | urban-planning-expenses-prefecture | blocker | 🟠手動是正候補 | paren-number |
| 6 | womens-clothing-consumption-expenditure | missing | 🟠手動是正候補 | - |
| 5 | avg-savings-rate-worker-households | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | beauty-appliance-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | care-manager-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | clothing-rental-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | convenience-store-sales-yoy | missing | 🟠手動是正候補 | - |
| 5 | curry-roux-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | death-accident | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | dementia-death-rate | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | dried-nori-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

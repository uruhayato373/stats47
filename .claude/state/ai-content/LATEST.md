# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-01T01:20:58.809Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 371 件 (17.2% / impressions 計 55293)
- ⏳ needs-regen: 1792 件 (impressions 計 6746)
  - 内訳: incomplete 1536 / missing 197 / blocker 59
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **5.3 件/日** (2026-07-30 からの平均)
- 残り 1792 件 → **完了見込み 約 338 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 26 Aug 2026 19:38:14 GMT | deaths-lifestyle-diseases | 33 |
| Wed, 26 Aug 2026 19:38:14 GMT | junior-high-club-per100-basketball | 27 |
| Wed, 26 Aug 2026 17:04:47 GMT | coffee-drink-consumption-expenditure | 30 |
| Wed, 26 Aug 2026 17:01:06 GMT | sole-proprietor-sales | 69 |
| Wed, 26 Aug 2026 16:41:29 GMT | library-lending-books | 72 |
| Wed, 26 Aug 2026 16:20:48 GMT | manufacturing-establishments | 48 |
| Wed, 26 Aug 2026 16:20:48 GMT | game-console-consumption-expenditure | 43 |
| Wed, 26 Aug 2026 16:20:48 GMT | cod-roe-consumption-expenditure | 40 |
| Wed, 26 Aug 2026 16:20:48 GMT | other-fresh-fish-consumption-expenditure | 39 |
| Wed, 26 Aug 2026 12:14:39 GMT | agricultural-employment-population | 56 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-club-per100-soft-tennis | 76 |
| Wed, 26 Aug 2026 10:57:22 GMT | gpp-public-service | 74 |
| Wed, 26 Aug 2026 10:57:22 GMT | voter-turnout-governor | 63 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-school-teachers | 49 |
| Wed, 26 Aug 2026 10:57:22 GMT | clam-consumption-quantity | 48 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 340 | instant-noodles-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 166 | national-pension-full-exemption-rate | missing | 🟠手動是正候補 | - |
| 51 | average-length-of-stay | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 50 | road-total-length | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 49 | daytime-population-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 47 | chocolate-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 40 | bacon-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 38 | sports-participation-rate-badminton | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 36 | green-beans-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 34 | engel-coefficient | missing | 🟠手動是正候補 | - |
| 32 | gender-wage-gap | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 32 | sports-participation-rate-bowling | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 31 | other-fresh-fruit-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 30 | fire-department-pump-car-count-per-100-thousand-people | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 29 | hobby-participation-rate-tea-ceremony | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 29 | junior-high-club-per100-volleyball | missing | 🟠手動是正候補 | - |
| 28 | public-bath-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 28 | security-guard-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 28 | treatment-rate-mental-disorder-outpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 27 | crab-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

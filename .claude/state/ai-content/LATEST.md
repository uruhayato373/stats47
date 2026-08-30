# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-30T04:08:22.463Z
- GSC snapshot: 2026-W34 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2167 件)

- ✅ done: 371 件 (17.1% / impressions 計 49788)
- ⏳ needs-regen: 1796 件 (impressions 計 5774)
  - 内訳: missing 197 / incomplete 1540 / blocker 59
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **5.6 件/日** (2026-07-30 からの平均)
- 残り 1796 件 → **完了見込み 約 319 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 26 Aug 2026 19:38:14 GMT | deaths-lifestyle-diseases | 27 |
| Wed, 26 Aug 2026 19:38:14 GMT | junior-high-club-per100-basketball | 27 |
| Wed, 26 Aug 2026 17:04:47 GMT | coffee-drink-consumption-expenditure | 27 |
| Wed, 26 Aug 2026 17:01:06 GMT | sole-proprietor-sales | 29 |
| Wed, 26 Aug 2026 16:41:29 GMT | library-lending-books | 30 |
| Wed, 26 Aug 2026 16:20:48 GMT | other-fresh-fish-consumption-expenditure | 32 |
| Wed, 26 Aug 2026 16:20:48 GMT | game-console-consumption-expenditure | 31 |
| Wed, 26 Aug 2026 16:20:48 GMT | manufacturing-establishments | 31 |
| Wed, 26 Aug 2026 16:20:48 GMT | cod-roe-consumption-expenditure | 30 |
| Wed, 26 Aug 2026 12:14:39 GMT | agricultural-employment-population | 32 |
| Wed, 26 Aug 2026 10:57:22 GMT | gpp-public-service | 50 |
| Wed, 26 Aug 2026 10:57:22 GMT | voter-turnout-governor | 48 |
| Wed, 26 Aug 2026 10:57:22 GMT | high-school-teacher-annual-income | 45 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-club-per100-soft-tennis | 42 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-club-per100-swimming | 42 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 27 | junior-high-club-per100-volleyball | missing | 🟠手動是正候補 | - |
| 27 | other-dairy-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | bacon-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | green-beans-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | instant-noodles-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | software-engineer-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 25 | dried-udon-soba-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 25 | municipal-bonds-outstanding | missing | 🟠手動是正候補 | - |
| 25 | sports-participation-rate-badminton | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 25 | theater-music-hall | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 25 | treatment-rate-mental-disorder-outpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 24 | hobby-participation-rate-video-games | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 24 | spinach-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 23 | black-tea-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 23 | fire-department-pump-car-count-per-100-thousand-people | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 23 | fried-tofu-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 23 | gpp-forestry | missing | 🟠手動是正候補 | - |
| 23 | integrated-kindergarten-enrollment | missing | 🟠手動是正候補 | - |
| 23 | single-person-households | missing | 🟠手動是正候補 | - |
| 22 | average-length-of-stay | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-03T07:18:59.031Z
- GSC snapshot: 2026-W26 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 1015 件)

- ✅ done: 140 件 (impressions 計 27308)
- ⏳ needs-regen: 875 件 (impressions 計 9284)
  - 内訳: incomplete 812 / missing 48 / blocker 15

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Fri, 03 Jul 2026 05:11:16 GMT | vacant-housing-rate | 7904 |
| Fri, 03 Jul 2026 05:11:16 GMT | sports-participation-rate-swimming | 104 |
| Fri, 03 Jul 2026 05:11:15 GMT | fishery-species-catch-mackerel | 547 |
| Fri, 03 Jul 2026 05:11:15 GMT | retail-sales-amount-by-prefecture | 264 |
| Fri, 03 Jul 2026 05:11:15 GMT | fishery-species-catch-sardine | 202 |
| Fri, 03 Jul 2026 05:11:15 GMT | fishery-species-catch-pacific-saury | 91 |
| Fri, 03 Jul 2026 05:11:15 GMT | governor-salary-prefecture | 89 |
| Fri, 03 Jul 2026 05:11:15 GMT | average-weight-middle-school-second-grade-male | 86 |
| Fri, 03 Jul 2026 05:11:15 GMT | cooking-oil-consumption-quantity | 83 |
| Fri, 03 Jul 2026 05:11:15 GMT | cup-noodles-consumption-expenditure | 74 |
| Sun, 21 Jun 2026 09:51:48 GMT | sauce-consumption-quantity | 140 |
| Sun, 21 Jun 2026 09:51:48 GMT | sugar-consumption-quantity | 70 |
| Sun, 21 Jun 2026 09:51:48 GMT | table-salt-consumption-quantity | 68 |
| Sun, 21 Jun 2026 09:51:48 GMT | yogurt-consumption-expenditure | 65 |
| Sun, 21 Jun 2026 09:51:48 GMT | treatment-rate-asthma-outpatient | 60 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 166 | retail-store-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 114 | retail-store-count-alt | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 78 | miscellaneous-school-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 77 | physical-disability-certificates-issued | incomplete | paren-number,missing-pref-commentary |
| 73 | treatment-rate-mood-disorder-outpatient | incomplete | paren-number,paren-number,missing-pref-commentary |
| 72 | fishery-species-catch-scallop | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 72 | households-on-public-assistance | incomplete | missing-pref-commentary |
| 71 | psychiatric-bed-count | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 67 | zoo-count | incomplete | missing-pref-commentary |
| 66 | deaths-lifestyle-diseases | incomplete | missing-pref-commentary |
| 65 | airport-count | incomplete | paren-number,missing-pref-commentary |
| 64 | white-bread-consumption-quantity | incomplete | paren-number,paren-number,missing-pref-commentary |
| 64 | serious-crime-per-100k | incomplete | paren-number,missing-pref-commentary |
| 63 | psychiatric-hospital-count | incomplete | missing-insights,missing-pref-commentary |
| 62 | cut-flowers-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 61 | peach-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 60 | designated-difficult-disease | missing | - |
| 59 | sea-bream-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 58 | tempura-fry-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 58 | fishing-port-count-by-type | missing | - |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

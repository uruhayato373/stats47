# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-03T05:00:51.983Z
- GSC snapshot: 2026-W26 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 1015 件)

- ✅ done: 130 件 (impressions 計 17864)
- ⏳ needs-regen: 885 件 (impressions 計 18728)
  - 内訳: incomplete 818 / blocker 18 / missing 49

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 21 Jun 2026 09:51:48 GMT | sauce-consumption-quantity | 140 |
| Sun, 21 Jun 2026 09:51:48 GMT | sugar-consumption-quantity | 70 |
| Sun, 21 Jun 2026 09:51:48 GMT | table-salt-consumption-quantity | 68 |
| Sun, 21 Jun 2026 09:51:48 GMT | yogurt-consumption-expenditure | 65 |
| Sun, 21 Jun 2026 09:51:48 GMT | treatment-rate-asthma-outpatient | 60 |
| Sun, 21 Jun 2026 09:51:48 GMT | rice-cracker-consumption-expenditure | 59 |
| Sun, 21 Jun 2026 09:51:48 GMT | university-professor-annual-income | 58 |
| Sun, 21 Jun 2026 09:51:48 GMT | road-municipal-length | 53 |
| Sun, 21 Jun 2026 09:51:48 GMT | tofu-consumption-quantity | 44 |
| Sun, 21 Jun 2026 09:51:48 GMT | wine-consumption-quantity | 41 |
| Sun, 21 Jun 2026 09:51:48 GMT | sewerage-coverage-rate | 41 |
| Sun, 21 Jun 2026 09:51:48 GMT | road-general-prefectural-length | 39 |
| Sun, 21 Jun 2026 09:51:48 GMT | road-national-route-length | 30 |
| Sun, 21 Jun 2026 09:51:48 GMT | sports-participation-rate-hiking | 21 |
| Sun, 21 Jun 2026 09:51:47 GMT | eggplant-consumption-expenditure | 99 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 7904 | vacant-housing-rate | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 547 | fishery-species-catch-mackerel | blocker | paren-number |
| 264 | retail-sales-amount-by-prefecture | missing | - |
| 202 | fishery-species-catch-sardine | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 166 | retail-store-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 114 | retail-store-count-alt | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 104 | sports-participation-rate-swimming | incomplete | paren-number,missing-pref-commentary |
| 91 | fishery-species-catch-pacific-saury | blocker | paren-number |
| 89 | governor-salary-prefecture | blocker | paren-number,paren-number,paren-number |
| 86 | average-weight-middle-school-second-grade-male | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 83 | cooking-oil-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 78 | miscellaneous-school-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 77 | physical-disability-certificates-issued | incomplete | paren-number,missing-pref-commentary |
| 74 | cup-noodles-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 73 | treatment-rate-mood-disorder-outpatient | incomplete | paren-number,paren-number,missing-pref-commentary |
| 72 | fishery-species-catch-scallop | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 72 | households-on-public-assistance | incomplete | missing-pref-commentary |
| 71 | psychiatric-bed-count | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 67 | zoo-count | incomplete | missing-pref-commentary |
| 66 | deaths-lifestyle-diseases | incomplete | missing-pref-commentary |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

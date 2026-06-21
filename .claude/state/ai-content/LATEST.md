# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-06-21T09:52:26.438Z
- GSC snapshot: 2026-W24 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 924 件)

- ✅ done: 130 件 (impressions 計 16230)
- ⏳ needs-regen: 794 件 (impressions 計 8890)
  - 内訳: incomplete 740 / blocker 18 / missing 36

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 21 Jun 2026 09:51:48 GMT | rice-cracker-consumption-expenditure | 67 |
| Sun, 21 Jun 2026 09:51:48 GMT | wine-consumption-quantity | 65 |
| Sun, 21 Jun 2026 09:51:48 GMT | yogurt-consumption-expenditure | 62 |
| Sun, 21 Jun 2026 09:51:48 GMT | sugar-consumption-quantity | 60 |
| Sun, 21 Jun 2026 09:51:48 GMT | road-national-route-length | 58 |
| Sun, 21 Jun 2026 09:51:48 GMT | road-general-prefectural-length | 56 |
| Sun, 21 Jun 2026 09:51:48 GMT | road-municipal-length | 54 |
| Sun, 21 Jun 2026 09:51:48 GMT | sewerage-coverage-rate | 49 |
| Sun, 21 Jun 2026 09:51:48 GMT | university-professor-annual-income | 48 |
| Sun, 21 Jun 2026 09:51:48 GMT | sauce-consumption-quantity | 47 |
| Sun, 21 Jun 2026 09:51:48 GMT | table-salt-consumption-quantity | 47 |
| Sun, 21 Jun 2026 09:51:48 GMT | tofu-consumption-quantity | 47 |
| Sun, 21 Jun 2026 09:51:48 GMT | sports-participation-rate-hiking | 46 |
| Sun, 21 Jun 2026 09:51:48 GMT | treatment-rate-asthma-outpatient | 45 |
| Sun, 21 Jun 2026 09:51:47 GMT | real-disposable-income | 66 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 1292 | public-phone-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 142 | physical-disability-certificates-issued | incomplete | paren-number,missing-pref-commentary |
| 85 | retail-store-count-alt | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 77 | psychiatric-hospital-count | incomplete | missing-insights,missing-pref-commentary |
| 72 | miscellaneous-school-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 62 | retail-store-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 52 | barber-beauty-salon-count | blocker | paren-number |
| 52 | pneumonia-death-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 49 | psychiatric-bed-count | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 44 | bed-utilization-rate | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 44 | road-total-length | incomplete | paren-number,missing-pref-commentary |
| 43 | peach-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | cut-flowers-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | clam-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | strawberry-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | zoo-count | incomplete | missing-pref-commentary |
| 41 | drinking-out-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 41 | garbage-final-disposal | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 41 | other-mushroom-consumption-quantity | incomplete | paren-number,missing-pref-commentary |
| 40 | cup-noodles-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

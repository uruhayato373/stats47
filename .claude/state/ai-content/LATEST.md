# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-06-21T09:26:10.907Z
- GSC snapshot: 2026-W24 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 924 件)

- ✅ done: 80 件 (impressions 計 12985)
- ⏳ needs-regen: 844 件 (impressions 計 12135)
  - 内訳: incomplete 788 / blocker 19 / missing 37

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 21 Jun 2026 09:25:48 GMT | treatment-rate-mental-disorder-inpatient | 145 |
| Sun, 21 Jun 2026 09:25:48 GMT | total-fertility-rate | 110 |
| Sun, 21 Jun 2026 09:25:47 GMT | pickled-plum-consumption-quantity | 150 |
| Sun, 21 Jun 2026 09:25:47 GMT | marine-fishery-aquaculture-output-value | 150 |
| Sun, 21 Jun 2026 09:25:47 GMT | green-tea-consumption-quantity | 149 |
| Sun, 21 Jun 2026 09:25:47 GMT | miso-consumption-quantity | 148 |
| Sun, 21 Jun 2026 09:25:47 GMT | dam-count | 142 |
| Sun, 21 Jun 2026 09:25:47 GMT | cake-consumption-expenditure | 138 |
| Sun, 21 Jun 2026 09:25:47 GMT | gasoline-consumption-quantity | 138 |
| Sun, 21 Jun 2026 09:25:47 GMT | air-conditioner-consumption-quantity | 135 |
| Sun, 21 Jun 2026 09:25:47 GMT | cup-noodles-consumption-quantity | 128 |
| Sun, 21 Jun 2026 09:25:47 GMT | convenience-store-sales-monthly | 128 |
| Sun, 21 Jun 2026 09:25:47 GMT | roadside-station-count | 119 |
| Sun, 21 Jun 2026 09:25:47 GMT | soy-sauce-consumption-expenditure | 114 |
| Sun, 21 Jun 2026 09:25:47 GMT | konbu-consumption-expenditure | 113 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 1292 | public-phone-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 142 | physical-disability-certificates-issued | incomplete | paren-number,missing-pref-commentary |
| 99 | broccoli-consumption-quantity | incomplete | paren-number,paren-number,missing-pref-commentary |
| 97 | beer-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 97 | residential-building-construction-cost | incomplete | missing-pref-commentary |
| 95 | konnyaku-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 93 | coffee-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 89 | future-population-change-rate-2050 | blocker | paren-number,paren-number,paren-number |
| 85 | toilet-paper-consumption-expenditure | incomplete | paren-number,paren-number,missing-pref-commentary |
| 85 | retail-store-count-alt | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 83 | tomato-consumption-quantity | incomplete | missing-pref-commentary |
| 83 | chocolate-snack-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 83 | fishery-species-catch-pollock | incomplete | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 82 | road-expressway-length | incomplete | paren-number,missing-pref-commentary |
| 77 | vinegar-consumption-quantity | incomplete | missing-pref-commentary |
| 77 | psychiatric-hospital-count | incomplete | missing-insights,missing-pref-commentary |
| 76 | shumai-consumption-expenditure | incomplete | paren-number,paren-number,missing-pref-commentary |
| 76 | cheese-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 75 | sake-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 75 | swimming-pool-public | incomplete | paren-number,missing-pref-commentary |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-06-21T09:35:59.702Z
- GSC snapshot: 2026-W24 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 924 件)

- ✅ done: 100 件 (impressions 計 14629)
- ⏳ needs-regen: 824 件 (impressions 計 10491)
  - 内訳: incomplete 769 / blocker 18 / missing 37

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 21 Jun 2026 09:35:37 GMT | residential-building-construction-cost | 97 |
| Sun, 21 Jun 2026 09:35:37 GMT | konnyaku-consumption-expenditure | 95 |
| Sun, 21 Jun 2026 09:35:37 GMT | toilet-paper-consumption-expenditure | 85 |
| Sun, 21 Jun 2026 09:35:37 GMT | tomato-consumption-quantity | 83 |
| Sun, 21 Jun 2026 09:35:37 GMT | road-expressway-length | 82 |
| Sun, 21 Jun 2026 09:35:37 GMT | vinegar-consumption-quantity | 77 |
| Sun, 21 Jun 2026 09:35:37 GMT | shumai-consumption-expenditure | 76 |
| Sun, 21 Jun 2026 09:35:37 GMT | sake-consumption-expenditure | 75 |
| Sun, 21 Jun 2026 09:35:37 GMT | swimming-pool-public | 75 |
| Sun, 21 Jun 2026 09:35:37 GMT | telework-rate | 73 |
| Sun, 21 Jun 2026 09:35:37 GMT | sports-spectating-consumption-expenditure | 69 |
| Sun, 21 Jun 2026 09:35:37 GMT | pickled-plum-consumption-expenditure | 69 |
| Sun, 21 Jun 2026 09:35:36 GMT | broccoli-consumption-quantity | 99 |
| Sun, 21 Jun 2026 09:35:36 GMT | beer-consumption-quantity | 97 |
| Sun, 21 Jun 2026 09:35:36 GMT | coffee-consumption-quantity | 93 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 1292 | public-phone-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 142 | physical-disability-certificates-issued | incomplete | paren-number,missing-pref-commentary |
| 85 | retail-store-count-alt | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 77 | psychiatric-hospital-count | incomplete | missing-insights,missing-pref-commentary |
| 72 | miscellaneous-school-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 67 | rice-cracker-consumption-expenditure | incomplete | paren-number,missing-pref-commentary |
| 66 | real-disposable-income | incomplete | paren-number,paren-number,missing-pref-commentary |
| 65 | wine-consumption-quantity | incomplete | paren-number,paren-number,missing-pref-commentary |
| 64 | apple-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | retail-store-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 62 | yogurt-consumption-expenditure | incomplete | paren-number,missing-pref-commentary |
| 60 | hobby-participation-rate-cinema | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 60 | sugar-consumption-quantity | incomplete | paren-number,missing-pref-commentary |
| 59 | bonito-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 59 | elementary-school-children-1-per | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 58 | road-national-route-length | incomplete | paren-number,paren-number,missing-pref-commentary |
| 57 | grilled-eel-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 56 | road-general-prefectural-length | incomplete | paren-number,paren-number,missing-pref-commentary |
| 55 | future-population | incomplete | missing-pref-commentary |
| 54 | coffee-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

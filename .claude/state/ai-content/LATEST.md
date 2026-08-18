# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-18T20:36:52.688Z
- GSC snapshot: 2026-W33 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2164 件)

- ✅ done: 264 件 (12.2% / impressions 計 35262)
- ⏳ needs-regen: 1900 件 (impressions 計 7524)
  - 内訳: incomplete 1620 / missing 219 / blocker 61
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **3.6 件/日** (2026-07-30 からの平均)
- 残り 1900 件 → **完了見込み 約 531 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Tue, 18 Aug 2026 05:14:33 GMT | food-self-sufficiency-rate-calorie | 93 |
| Tue, 18 Aug 2026 05:14:33 GMT | voluntary-car-insurance-rate-bodily-injury | 85 |
| Tue, 18 Aug 2026 05:14:33 GMT | wholesale-annual-sales-amount | 63 |
| Tue, 18 Aug 2026 05:14:33 GMT | voluntary-car-insurance-rate-property | 61 |
| Tue, 18 Aug 2026 05:14:33 GMT | shochu-consumption-quantity | 59 |
| Mon, 17 Aug 2026 20:26:45 GMT | roadside-station-count | 199 |
| Mon, 17 Aug 2026 20:26:45 GMT | airport-count | 152 |
| Mon, 17 Aug 2026 20:26:45 GMT | railway-station-count | 111 |
| Mon, 17 Aug 2026 20:26:45 GMT | dam-count | 76 |
| Mon, 17 Aug 2026 20:26:45 GMT | treatment-rate-hypertension-outpatient | 57 |
| Sat, 15 Aug 2026 20:52:52 GMT | mineral-water-consumption-expenditure | 68 |
| Sat, 15 Aug 2026 20:52:52 GMT | whitebait-consumption-quantity | 54 |
| Sat, 15 Aug 2026 20:52:52 GMT | black-tea-consumption-quantity | 42 |
| Sat, 15 Aug 2026 20:52:52 GMT | national-pension-payment-rate | 34 |
| Sat, 15 Aug 2026 20:52:52 GMT | final-disposal-site-remaining-capacity | 31 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 55 | other-cosmetics-consumption-expenditure | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 53 | commute-by-car | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 53 | lotus-root-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 50 | nuclear-power-plant-count | missing | 🔴opus | - |
| 48 | geothermal-power-plant-count | missing | 🔴opus | - |
| 47 | drinking-out-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 46 | average-height-primary-school-fifth-grade-male | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 45 | miscellaneous-school-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 44 | pear-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 43 | consumer-price-difference-index-utilities | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 43 | eggplant-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 43 | taro-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 42 | elementary-school-teachers | missing | 🔴opus | - |
| 42 | tempura-fry-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | voter-turnout-governor | incomplete | 🔴opus | missing-pref-commentary |
| 41 | new-condo-starts | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 41 | public-health-nurse-count | incomplete | 🔴opus | missing-pref-commentary |
| 40 | dried-shiitake-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 40 | physicians-in-medical-facilities | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 39 | barber-beauty-salon-count | blocker | 🔴opus | paren-number |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

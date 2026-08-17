# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-17T20:25:31.033Z
- GSC snapshot: 2026-W33 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2164 件)

- ✅ done: 259 件 (12.0% / impressions 計 34667)
- ⏳ needs-regen: 1905 件 (impressions 計 8119)
  - 内訳: missing 223 / incomplete 1621 / blocker 61
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **3.5 件/日** (2026-07-30 からの平均)
- 残り 1905 件 → **完了見込み 約 545 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 16 Aug 2026 21:18:42 GMT | food-self-sufficiency-rate-calorie | 93 |
| Sun, 16 Aug 2026 21:18:42 GMT | voluntary-car-insurance-rate-bodily-injury | 85 |
| Sun, 16 Aug 2026 21:18:42 GMT | wholesale-annual-sales-amount | 63 |
| Sun, 16 Aug 2026 21:18:42 GMT | voluntary-car-insurance-rate-property | 61 |
| Sun, 16 Aug 2026 21:18:42 GMT | shochu-consumption-quantity | 59 |
| Sat, 15 Aug 2026 20:52:52 GMT | mineral-water-consumption-expenditure | 68 |
| Sat, 15 Aug 2026 20:52:52 GMT | whitebait-consumption-quantity | 54 |
| Sat, 15 Aug 2026 20:52:52 GMT | black-tea-consumption-quantity | 42 |
| Sat, 15 Aug 2026 20:52:52 GMT | national-pension-payment-rate | 34 |
| Sat, 15 Aug 2026 20:52:52 GMT | final-disposal-site-remaining-capacity | 31 |
| Wed, 12 Aug 2026 21:21:55 GMT | flood-affected-rivers | 78 |
| Wed, 12 Aug 2026 21:21:55 GMT | midwife-count | 45 |
| Wed, 12 Aug 2026 21:21:55 GMT | doctor-annual-income | 40 |
| Wed, 12 Aug 2026 21:21:55 GMT | treatment-rate-diabetes-outpatient | 40 |
| Tue, 11 Aug 2026 20:44:09 GMT | voluntary-car-insurance-rate-vehicle | 70 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 199 | roadside-station-count | missing | 🔴opus | - |
| 152 | airport-count | missing | 🔴opus | - |
| 111 | railway-station-count | missing | 🔴opus | - |
| 76 | dam-count | missing | 🔴opus | - |
| 57 | treatment-rate-hypertension-outpatient | incomplete | 🔴opus | paren-number,missing-pref-commentary |
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

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

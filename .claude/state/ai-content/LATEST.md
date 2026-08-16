# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-16T21:17:35.181Z
- GSC snapshot: 2026-W33 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2173 件)

- ✅ done: 259 件 (11.9% / impressions 計 34881)
- ⏳ needs-regen: 1914 件 (impressions 計 7948)
  - 内訳: missing 215 / incomplete 1635 / blocker 64
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## ⚠️ 公開済みだが接地データが不成立 (1 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| convenience-store-count-commercial | 2025 | 2392 | 同一県が複数行: 47 県 (例 13000×2, 27000×2, 14000×2) — 分類軸の絞り忘れ / 94 行 (都道府県は 47 しかない) |

## 進捗 (progress-history.csv より)

- 消化ペース: **3.7 件/日** (2026-07-30 からの平均)
- 残り 1914 件 → **完了見込み 約 517 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 15 Aug 2026 20:52:52 GMT | mineral-water-consumption-expenditure | 68 |
| Sat, 15 Aug 2026 20:52:52 GMT | whitebait-consumption-quantity | 54 |
| Sat, 15 Aug 2026 20:52:52 GMT | black-tea-consumption-quantity | 42 |
| Sat, 15 Aug 2026 20:52:52 GMT | national-pension-payment-rate | 34 |
| Sat, 15 Aug 2026 20:52:52 GMT | final-disposal-site-remaining-capacity | 31 |
| Wed, 12 Aug 2026 21:21:55 GMT | flood-affected-rivers | 78 |
| Wed, 12 Aug 2026 21:21:55 GMT | midwife-count | 45 |
| Wed, 12 Aug 2026 21:21:55 GMT | doctor-annual-income | 40 |
| Wed, 12 Aug 2026 21:21:55 GMT | treatment-rate-diabetes-outpatient | 40 |
| Wed, 12 Aug 2026 21:21:55 GMT | hydroelectric-power-plant-count | 37 |
| Tue, 11 Aug 2026 20:44:09 GMT | voluntary-car-insurance-rate-vehicle | 70 |
| Tue, 11 Aug 2026 20:44:09 GMT | other-mushroom-consumption-quantity | 48 |
| Tue, 11 Aug 2026 20:44:09 GMT | total-overnight-guests | 43 |
| Tue, 11 Aug 2026 20:44:09 GMT | katsuobushi-consumption-expenditure | 42 |
| Tue, 11 Aug 2026 20:44:09 GMT | wind-power-turbine-count | 16 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 93 | food-self-sufficiency-rate-calorie | missing | 🔴opus | - |
| 85 | voluntary-car-insurance-rate-bodily-injury | missing | 🔴opus | - |
| 63 | wholesale-annual-sales-amount | missing | 🔴opus | - |
| 61 | voluntary-car-insurance-rate-property | missing | 🔴opus | - |
| 59 | shochu-consumption-quantity | incomplete | 🔴opus | missing-pref-commentary |
| 57 | treatment-rate-hypertension-outpatient | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 55 | other-cosmetics-consumption-expenditure | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 53 | commute-by-car | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 53 | lotus-root-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 50 | nuclear-power-plant-count | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 48 | geothermal-power-plant-count | incomplete | 🔴opus | missing-pref-commentary |
| 47 | drinking-out-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 46 | average-height-primary-school-fifth-grade-male | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 45 | miscellaneous-school-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 44 | pear-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 43 | consumer-price-difference-index-utilities | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 43 | eggplant-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 43 | taro-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 42 | elementary-school-teachers | missing | 🔴opus | - |
| 42 | tempura-fry-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

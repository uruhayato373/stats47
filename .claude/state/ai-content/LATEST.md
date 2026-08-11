# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-11T03:38:25.582Z
- GSC snapshot: 2026-W32 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2173 件)

- ✅ done: 234 件 (10.8% / impressions 計 30195)
- ⏳ needs-regen: 1939 件 (impressions 計 8619)
  - 内訳: incomplete 1658 / missing 217 / blocker 64
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## ⚠️ 公開済みだが接地データが不成立 (1 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| convenience-store-count-commercial | 2025 | 2102 | 同一県が複数行: 47 県 (例 13000×2, 27000×2, 14000×2) — 分類軸の絞り忘れ / 94 行 (都道府県は 47 しかない) |

## 進捗 (progress-history.csv より)

- 消化ペース: **3.2 件/日** (2026-07-30 からの平均)
- 残り 1939 件 → **完了見込み 約 613 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Mon, 10 Aug 2026 14:03:52 GMT | treatment-rate-mood-disorder-outpatient | 66 |
| Mon, 10 Aug 2026 14:03:52 GMT | railway-station-count | 60 |
| Mon, 10 Aug 2026 14:03:51 GMT | port-count | 66 |
| Mon, 10 Aug 2026 14:03:51 GMT | public-enterprise-accounting-staff | 64 |
| Mon, 10 Aug 2026 14:03:51 GMT | physical-therapist-annual-income | 61 |
| Mon, 10 Aug 2026 14:03:51 GMT | flavor-seasoning-consumption-expenditure | 59 |
| Mon, 10 Aug 2026 14:03:51 GMT | nurse-count | 59 |
| Mon, 10 Aug 2026 14:03:51 GMT | hobby-participation-rate-reading | 58 |
| Mon, 10 Aug 2026 14:03:51 GMT | croquette-consumption-expenditure | 57 |
| Mon, 10 Aug 2026 14:03:51 GMT | major-lake-area | 57 |
| Sun, 09 Aug 2026 21:34:34 GMT | tennis-court-public | 77 |
| Sun, 09 Aug 2026 21:34:34 GMT | tobacco-consumption-expenditure | 71 |
| Sun, 09 Aug 2026 21:34:33 GMT | pachinko-shop-density-per-10k | 105 |
| Sun, 09 Aug 2026 21:34:33 GMT | dining-out-consumption-expenditure | 97 |
| Sun, 09 Aug 2026 21:34:33 GMT | manufacturing-industry-added-value | 87 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 56 | treatment-rate-osteoporosis-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 55 | chinese-noodles-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 52 | sports-participation-rate-tennis | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 51 | vaccination-recipients-disease | missing | 🔴opus | - |
| 50 | aquarium-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 49 | commute-by-bicycle | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 49 | freshwater-clam-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 48 | manufacturing-shipment-amount-per-establishment | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 48 | miscellaneous-school-students | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 47 | fishery-workers | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 47 | other-mushroom-consumption-quantity | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 47 | voluntary-car-insurance-rate-vehicle | missing | 🔴opus | - |
| 46 | wind-power-turbine-count | incomplete | 🔴opus | paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 45 | katsuobushi-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 45 | total-overnight-guests | incomplete | 🔴opus | missing-pref-commentary |
| 45 | treatment-rate-diabetes-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 44 | doctor-annual-income | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 44 | flood-affected-rivers | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 44 | hydroelectric-power-plant-count | incomplete | 🔴opus | missing-pref-commentary |
| 44 | midwife-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

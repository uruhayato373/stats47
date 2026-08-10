# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-10T14:02:27.055Z
- GSC snapshot: 2026-W32 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2173 件)

- ✅ done: 224 件 (10.3% / impressions 計 29588)
- ⏳ needs-regen: 1949 件 (impressions 計 9226)
  - 内訳: missing 218 / incomplete 1666 / blocker 65
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## ⚠️ 公開済みだが接地データが不成立 (1 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| convenience-store-count-commercial | 2025 | 2102 | 同一県が複数行: 47 県 (例 13000×2, 27000×2, 14000×2) — 分類軸の絞り忘れ / 94 行 (都道府県は 47 しかない) |

## 進捗 (progress-history.csv より)

- 消化ペース: **2.5 件/日** (2026-07-30 からの平均)
- 残り 1949 件 → **完了見込み 約 766 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 09 Aug 2026 21:34:34 GMT | tennis-court-public | 77 |
| Sun, 09 Aug 2026 21:34:34 GMT | tobacco-consumption-expenditure | 71 |
| Sun, 09 Aug 2026 21:34:33 GMT | pachinko-shop-density-per-10k | 105 |
| Sun, 09 Aug 2026 21:34:33 GMT | dining-out-consumption-expenditure | 97 |
| Sun, 09 Aug 2026 21:34:33 GMT | manufacturing-industry-added-value | 87 |
| Sun, 09 Aug 2026 21:34:33 GMT | densely-populated-area | 85 |
| Sun, 09 Aug 2026 21:34:33 GMT | hamburger-consumption-expenditure | 83 |
| Sun, 09 Aug 2026 21:34:33 GMT | leek-consumption-quantity | 81 |
| Sun, 09 Aug 2026 21:34:33 GMT | starting-salary-university | 80 |
| Sun, 09 Aug 2026 21:34:33 GMT | cucumber-consumption-quantity | 66 |
| Tue, 04 Aug 2026 20:40:26 GMT | new-rental-starts | 100 |
| Tue, 04 Aug 2026 20:40:26 GMT | coffee-shop-consumption-expenditure | 93 |
| Tue, 04 Aug 2026 20:40:26 GMT | hobby-participation-rate-go | 83 |
| Tue, 04 Aug 2026 20:40:26 GMT | consumer-price-difference-index-overall | 60 |
| Tue, 04 Aug 2026 00:37:20 GMT | wheat-flour-consumption-expenditure | 103 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 66 | port-count | missing | 🔴opus | - |
| 66 | treatment-rate-mood-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 64 | public-enterprise-accounting-staff | blocker | 🔴opus | paren-number |
| 61 | physical-therapist-annual-income | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 60 | railway-station-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 59 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 59 | nurse-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 58 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 57 | croquette-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 57 | major-lake-area | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
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

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

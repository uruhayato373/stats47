# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-09T21:33:09.504Z
- GSC snapshot: 2026-W32 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2173 件)

- ✅ done: 214 件 (9.8% / impressions 計 28756)
- ⏳ needs-regen: 1959 件 (impressions 計 10058)
  - 内訳: missing 221 / incomplete 1673 / blocker 65
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## ⚠️ 公開済みだが接地データが不成立 (1 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| convenience-store-count-commercial | 2025 | 2102 | 同一県が複数行: 47 県 (例 13000×2, 27000×2, 14000×2) — 分類軸の絞り忘れ / 94 行 (都道府県は 47 しかない) |

## 進捗 (progress-history.csv より)

- 消化ペース: **1.8 件/日** (2026-07-30 からの平均)
- 残り 1959 件 → **完了見込み 約 1089 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Tue, 04 Aug 2026 20:40:26 GMT | new-rental-starts | 100 |
| Tue, 04 Aug 2026 20:40:26 GMT | coffee-shop-consumption-expenditure | 93 |
| Tue, 04 Aug 2026 20:40:26 GMT | hobby-participation-rate-go | 83 |
| Tue, 04 Aug 2026 20:40:26 GMT | consumer-price-difference-index-overall | 60 |
| Tue, 04 Aug 2026 00:37:20 GMT | wheat-flour-consumption-expenditure | 103 |
| Mon, 03 Aug 2026 01:14:32 GMT | shrimp-consumption-quantity | 107 |
| Fri, 31 Jul 2026 02:10:16 GMT | white-bread-consumption-quantity | 147 |
| Fri, 31 Jul 2026 02:10:16 GMT | water-supply-population | 126 |
| Fri, 31 Jul 2026 02:10:15 GMT | rice-consumption-quantity | 155 |
| Fri, 31 Jul 2026 02:10:15 GMT | sewage-treatment-coverage-rate | 107 |
| Fri, 31 Jul 2026 02:10:14 GMT | library-books | 316 |
| Fri, 31 Jul 2026 02:10:14 GMT | local-tax-prefecture | 211 |
| Fri, 31 Jul 2026 02:10:14 GMT | road-length-per-km2 | 198 |
| Fri, 31 Jul 2026 02:10:14 GMT | per-capita-fixed-asset-tax-pref-municipal | 100 |
| Fri, 31 Jul 2026 02:10:14 GMT | single-person-household-ratio | 84 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 105 | pachinko-shop-density-per-10k | missing | 🔴opus | - |
| 97 | dining-out-consumption-expenditure | missing | 🔴opus | - |
| 87 | manufacturing-industry-added-value | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 85 | densely-populated-area | incomplete | 🔴opus | missing-pref-commentary |
| 83 | hamburger-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 81 | leek-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 80 | starting-salary-university | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 77 | tennis-court-public | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 71 | tobacco-consumption-expenditure | missing | 🔴opus | - |
| 66 | cucumber-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
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

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

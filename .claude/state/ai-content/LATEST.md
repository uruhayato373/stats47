# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-04T20:39:11.423Z
- GSC snapshot: 2026-W31 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2176 件)

- ✅ done: 210 件 (9.7% / impressions 計 28252)
- ⏳ needs-regen: 1966 件 (impressions 計 10657)
  - 内訳: incomplete 1680 / missing 221 / blocker 65

## 進捗 (progress-history.csv より)

- 消化ペース: **2.8 件/日** (2026-07-30 からの平均)
- 残り 1966 件 → **完了見込み 約 703 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Tue, 04 Aug 2026 00:37:20 GMT | wheat-flour-consumption-expenditure | 101 |
| Mon, 03 Aug 2026 01:14:32 GMT | shrimp-consumption-quantity | 112 |
| Fri, 31 Jul 2026 02:10:16 GMT | water-supply-population | 144 |
| Fri, 31 Jul 2026 02:10:16 GMT | white-bread-consumption-quantity | 104 |
| Fri, 31 Jul 2026 02:10:15 GMT | rice-consumption-quantity | 141 |
| Fri, 31 Jul 2026 02:10:15 GMT | sewage-treatment-coverage-rate | 95 |
| Fri, 31 Jul 2026 02:10:14 GMT | library-books | 225 |
| Fri, 31 Jul 2026 02:10:14 GMT | local-tax-prefecture | 201 |
| Fri, 31 Jul 2026 02:10:14 GMT | road-length-per-km2 | 151 |
| Fri, 31 Jul 2026 02:10:14 GMT | per-capita-fixed-asset-tax-pref-municipal | 112 |
| Fri, 31 Jul 2026 02:10:14 GMT | single-person-household-ratio | 94 |
| Fri, 31 Jul 2026 02:10:14 GMT | public-phone-count-per-1000 | 92 |
| Fri, 31 Jul 2026 01:48:35 GMT | bread-consumption-expenditure | 163 |
| Fri, 31 Jul 2026 01:48:35 GMT | treatment-rate-schizophrenia-inpatient | 147 |
| Fri, 17 Jul 2026 01:18:13 GMT | new-hire-count | 158 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 83 | hobby-participation-rate-go | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 81 | new-rental-starts | incomplete | 🔴opus | missing-pref-commentary |
| 80 | bowling-alley-public | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 80 | consumer-price-difference-index-overall | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 79 | coffee-shop-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 77 | starting-salary-university | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 77 | tennis-court-public | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 76 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 74 | leek-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 73 | manufacturing-industry-added-value | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 71 | port-count | missing | 🔴opus | - |
| 71 | thermal-power-plant-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 64 | fishery-workers | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 64 | treatment-rate-mood-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 63 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 63 | hamburger-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | katsuobushi-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | nurse-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 62 | physical-therapist-annual-income | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | public-enterprise-accounting-staff | blocker | 🔴opus | paren-number |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

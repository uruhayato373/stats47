# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-01T19:10:50.904Z
- GSC snapshot: 2026-W30 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2176 件)

- ✅ done: 208 件 (9.6% / impressions 計 26198)
- ⏳ needs-regen: 1968 件 (impressions 計 10828)
  - 内訳: incomplete 1682 / missing 221 / blocker 65

## 進捗 (progress-history.csv より)

- 消化ペース: **6.0 件/日** (2026-07-30 からの平均)
- 残り 1968 件 → **完了見込み 約 328 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Fri, 31 Jul 2026 02:10:16 GMT | water-supply-population | 135 |
| Fri, 31 Jul 2026 02:10:16 GMT | white-bread-consumption-quantity | 95 |
| Fri, 31 Jul 2026 02:10:15 GMT | rice-consumption-quantity | 117 |
| Fri, 31 Jul 2026 02:10:15 GMT | sewage-treatment-coverage-rate | 98 |
| Fri, 31 Jul 2026 02:10:14 GMT | public-phone-count-per-1000 | 121 |
| Fri, 31 Jul 2026 02:10:14 GMT | library-books | 111 |
| Fri, 31 Jul 2026 02:10:14 GMT | per-capita-fixed-asset-tax-pref-municipal | 109 |
| Fri, 31 Jul 2026 02:10:14 GMT | road-length-per-km2 | 109 |
| Fri, 31 Jul 2026 02:10:14 GMT | local-tax-prefecture | 99 |
| Fri, 31 Jul 2026 02:10:14 GMT | single-person-household-ratio | 99 |
| Fri, 31 Jul 2026 01:48:35 GMT | bread-consumption-expenditure | 145 |
| Fri, 31 Jul 2026 01:48:35 GMT | treatment-rate-schizophrenia-inpatient | 123 |
| Fri, 17 Jul 2026 01:18:13 GMT | new-hire-count | 143 |
| Fri, 17 Jul 2026 01:18:13 GMT | university-graduates-job-ratio | 120 |
| Fri, 17 Jul 2026 01:18:12 GMT | local-allocation-tax-prefecture | 228 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 88 | coffee-shop-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 84 | shrimp-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 82 | tennis-court-public | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 81 | consumer-price-difference-index-overall | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 80 | bowling-alley-public | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 79 | wheat-flour-consumption-expenditure | incomplete | 🔴opus | missing-pref-commentary |
| 78 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 76 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 73 | manufacturing-industry-added-value | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 72 | disabled-employment-rate | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 70 | nurse-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 70 | port-count | missing | 🔴opus | - |
| 69 | thermal-power-plant-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 66 | leek-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 66 | sports-participation-rate-tennis | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 65 | bacon-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 64 | hobby-participation-rate-go | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 61 | prefectural-natural-park-count | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 59 | treatment-rate-mood-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 58 | geothermal-power-plant-count | incomplete | 🔴opus | missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

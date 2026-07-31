# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-31T00:32:54.200Z
- GSC snapshot: 2026-W30 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2176 件)

- ✅ done: 196 件 (9.0% / impressions 計 24837)
- ⏳ needs-regen: 1980 件 (impressions 計 12189)
  - 内訳: missing 223 / incomplete 1691 / blocker 66

## 進捗 (progress-history.csv より)

- 消化ペース: **0.0 件/日** (2026-07-30 からの平均)
- 残り 1980 件 (完了見込みは未算出)

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Fri, 17 Jul 2026 01:18:13 GMT | new-hire-count | 143 |
| Fri, 17 Jul 2026 01:18:13 GMT | university-graduates-job-ratio | 120 |
| Fri, 17 Jul 2026 01:18:12 GMT | local-allocation-tax-prefecture | 228 |
| Fri, 17 Jul 2026 01:18:12 GMT | main-road-paving-rate | 224 |
| Fri, 17 Jul 2026 01:18:12 GMT | campsite-public | 130 |
| Fri, 17 Jul 2026 01:18:12 GMT | nature-park-area | 124 |
| Fri, 17 Jul 2026 01:18:12 GMT | local-allocation-tax-ratio-pref-finance | 115 |
| Fri, 17 Jul 2026 01:18:12 GMT | cut-flowers-consumption-expenditure | 89 |
| Fri, 17 Jul 2026 01:18:12 GMT | furikake-consumption-expenditure | 73 |
| Fri, 17 Jul 2026 01:18:12 GMT | airport-count | 58 |
| Thu, 16 Jul 2026 12:23:51 GMT | retail-store-count | 412 |
| Thu, 16 Jul 2026 12:23:51 GMT | designated-difficult-disease | 223 |
| Thu, 16 Jul 2026 12:23:51 GMT | retail-store-count-alt | 94 |
| Thu, 16 Jul 2026 12:23:50 GMT | dual-income-household-ratio | 528 |
| Thu, 16 Jul 2026 12:23:50 GMT | psychiatric-bed-count | 401 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 145 | bread-consumption-expenditure | missing | 🔴opus | - |
| 135 | water-supply-population | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 123 | treatment-rate-schizophrenia-inpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 121 | public-phone-count-per-1000 | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 117 | rice-consumption-quantity | missing | 🔴opus | - |
| 111 | library-books | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 109 | per-capita-fixed-asset-tax-pref-municipal | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 109 | road-length-per-km2 | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 99 | local-tax-prefecture | blocker | 🔴opus | paren-number |
| 99 | single-person-household-ratio | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 98 | sewage-treatment-coverage-rate | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 95 | white-bread-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 88 | coffee-shop-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 84 | shrimp-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 82 | tennis-court-public | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 81 | consumer-price-difference-index-overall | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 80 | bowling-alley-public | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 79 | wheat-flour-consumption-expenditure | incomplete | 🔴opus | missing-pref-commentary |
| 78 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 76 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

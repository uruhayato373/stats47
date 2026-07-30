# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-30T01:48:03.536Z
- GSC snapshot: 2026-W30 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2179 件)

- ✅ done: 196 件 (9.0% / impressions 計 25056)
- ⏳ needs-regen: 1983 件 (impressions 計 12252)
  - 内訳: missing 226 / incomplete 1691 / blocker 66

## 進捗 (progress-history.csv より)

- 履歴 1 点。ペース算出には 2 日以上の履歴が必要
- 残り 1983 件 (完了見込みは未算出)

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Fri, 17 Jul 2026 01:18:13 GMT | new-hire-count | 144 |
| Fri, 17 Jul 2026 01:18:13 GMT | university-graduates-job-ratio | 120 |
| Fri, 17 Jul 2026 01:18:12 GMT | local-allocation-tax-prefecture | 253 |
| Fri, 17 Jul 2026 01:18:12 GMT | main-road-paving-rate | 219 |
| Fri, 17 Jul 2026 01:18:12 GMT | campsite-public | 138 |
| Fri, 17 Jul 2026 01:18:12 GMT | nature-park-area | 124 |
| Fri, 17 Jul 2026 01:18:12 GMT | local-allocation-tax-ratio-pref-finance | 119 |
| Fri, 17 Jul 2026 01:18:12 GMT | cut-flowers-consumption-expenditure | 87 |
| Fri, 17 Jul 2026 01:18:12 GMT | furikake-consumption-expenditure | 73 |
| Fri, 17 Jul 2026 01:18:12 GMT | airport-count | 58 |
| Thu, 16 Jul 2026 12:23:51 GMT | retail-store-count | 411 |
| Thu, 16 Jul 2026 12:23:51 GMT | designated-difficult-disease | 229 |
| Thu, 16 Jul 2026 12:23:51 GMT | retail-store-count-alt | 93 |
| Thu, 16 Jul 2026 12:23:50 GMT | dual-income-household-ratio | 529 |
| Thu, 16 Jul 2026 12:23:50 GMT | psychiatric-bed-count | 423 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 149 | bread-consumption-expenditure | missing | 🔴opus | - |
| 136 | water-supply-population | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 126 | rice-consumption-quantity | missing | 🔴opus | - |
| 125 | treatment-rate-schizophrenia-inpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 123 | library-books | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 118 | public-phone-count-per-1000 | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 112 | per-capita-fixed-asset-tax-pref-municipal | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 111 | local-tax-prefecture | blocker | 🔴opus | paren-number |
| 111 | road-length-per-km2 | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 98 | sewage-treatment-coverage-rate | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 94 | single-person-household-ratio | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 90 | white-bread-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 88 | coffee-shop-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 88 | wheat-flour-consumption-expenditure | incomplete | 🔴opus | missing-pref-commentary |
| 84 | shrimp-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 82 | tennis-court-public | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 81 | consumer-price-difference-index-overall | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 79 | bowling-alley-public | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 78 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 74 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

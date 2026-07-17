# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-16T12:31:39.493Z
- GSC snapshot: 2026-W28 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 1124 件)

- ✅ done: 153 件 (impressions 計 32475)
- ⏳ needs-regen: 971 件 (impressions 計 11790)
  - 内訳: incomplete 884 / blocker 26 / missing 61

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Thu, 16 Jul 2026 12:23:51 GMT | retail-store-count | 358 |
| Thu, 16 Jul 2026 12:23:51 GMT | designated-difficult-disease | 168 |
| Thu, 16 Jul 2026 12:23:51 GMT | retail-store-count-alt | 115 |
| Thu, 16 Jul 2026 12:23:50 GMT | prefectural-nature-park-area | 309 |
| Thu, 16 Jul 2026 12:23:50 GMT | dual-income-household-ratio | 194 |
| Thu, 16 Jul 2026 12:23:50 GMT | psychiatric-bed-count | 151 |
| Thu, 16 Jul 2026 12:23:50 GMT | public-phone-count | 150 |
| Thu, 16 Jul 2026 12:23:50 GMT | fishery-species-catch-scallop | 140 |
| Thu, 16 Jul 2026 12:23:50 GMT | peach-consumption-quantity | 119 |
| Thu, 16 Jul 2026 12:23:50 GMT | fishing-port-count-by-type | 115 |
| Fri, 03 Jul 2026 22:49:29 GMT | tuna-consumption-quantity | 588 |
| Fri, 03 Jul 2026 22:49:29 GMT | treatment-rate-mental-disorder-inpatient | 213 |
| Fri, 03 Jul 2026 22:49:29 GMT | yogurt-consumption-expenditure | 58 |
| Fri, 03 Jul 2026 22:49:29 GMT | wine-consumption-quantity | 57 |
| Fri, 03 Jul 2026 22:49:29 GMT | university-professor-annual-income | 37 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 113 | main-road-paving-rate | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 110 | nature-park-area | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 103 | local-allocation-tax-ratio-pref-finance | blocker | 🔴opus | paren-number |
| 99 | cut-flowers-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 99 | university-graduates-job-ratio | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 96 | local-allocation-tax-prefecture | blocker | 🔴opus | paren-number,paren-number |
| 95 | new-hire-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 91 | furikake-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 91 | airport-count | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 88 | campsite-public | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 81 | bacon-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 79 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 73 | nurse-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 73 | leek-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 72 | treatment-rate-mood-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 71 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 71 | public-phone-count-per-1000 | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 68 | geothermal-power-plant-count | incomplete | 🔴opus | missing-pref-commentary |
| 67 | white-bread-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 66 | local-tax-prefecture | blocker | 🔴opus | paren-number |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

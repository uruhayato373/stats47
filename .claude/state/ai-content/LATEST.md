# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-16T11:18:21.544Z
- GSC snapshot: 2026-W28 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 1124 件)

- ✅ done: 143 件 (impressions 計 30656)
- ⏳ needs-regen: 981 件 (impressions 計 13609)
  - 内訳: incomplete 892 / missing 63 / blocker 26

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Fri, 03 Jul 2026 22:49:29 GMT | tuna-consumption-quantity | 588 |
| Fri, 03 Jul 2026 22:49:29 GMT | treatment-rate-mental-disorder-inpatient | 213 |
| Fri, 03 Jul 2026 22:49:29 GMT | yogurt-consumption-expenditure | 58 |
| Fri, 03 Jul 2026 22:49:29 GMT | wine-consumption-quantity | 57 |
| Fri, 03 Jul 2026 22:49:29 GMT | university-professor-annual-income | 37 |
| Fri, 03 Jul 2026 22:49:29 GMT | vinegar-consumption-quantity | 35 |
| Fri, 03 Jul 2026 22:49:29 GMT | treatment-rate-asthma-outpatient | 17 |
| Fri, 03 Jul 2026 22:49:28 GMT | school-teacher-annual-income | 374 |
| Fri, 03 Jul 2026 22:49:28 GMT | soba-udon-dining-consumption-expenditure | 248 |
| Fri, 03 Jul 2026 22:49:28 GMT | tissue-paper-consumption-expenditure | 235 |
| Fri, 03 Jul 2026 22:49:28 GMT | sauce-consumption-quantity | 190 |
| Fri, 03 Jul 2026 22:49:28 GMT | swimming-pool-public | 166 |
| Fri, 03 Jul 2026 22:49:28 GMT | shumai-consumption-expenditure | 151 |
| Fri, 03 Jul 2026 22:49:28 GMT | sports-spectating-consumption-expenditure | 150 |
| Fri, 03 Jul 2026 22:49:28 GMT | roadside-station-count | 142 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 358 | retail-store-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 309 | prefectural-nature-park-area | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 194 | dual-income-household-ratio | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 168 | designated-difficult-disease | missing | 🔴opus | - |
| 151 | psychiatric-bed-count | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 150 | public-phone-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 140 | fishery-species-catch-scallop | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 119 | peach-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 115 | retail-store-count-alt | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 115 | fishing-port-count-by-type | missing | 🔴opus | - |
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

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

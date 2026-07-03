# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-07-03T08:31:04.174Z
- GSC snapshot: 2026-W26 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 1015 件)

- ✅ done: 140 件 (impressions 計 27308)
- ⏳ needs-regen: 875 件 (impressions 計 9284)
  - 内訳: incomplete 812 / missing 48 / blocker 15

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Fri, 03 Jul 2026 05:11:16 GMT | vacant-housing-rate | 7904 |
| Fri, 03 Jul 2026 05:11:16 GMT | sports-participation-rate-swimming | 104 |
| Fri, 03 Jul 2026 05:11:15 GMT | fishery-species-catch-mackerel | 547 |
| Fri, 03 Jul 2026 05:11:15 GMT | retail-sales-amount-by-prefecture | 264 |
| Fri, 03 Jul 2026 05:11:15 GMT | fishery-species-catch-sardine | 202 |
| Fri, 03 Jul 2026 05:11:15 GMT | fishery-species-catch-pacific-saury | 91 |
| Fri, 03 Jul 2026 05:11:15 GMT | governor-salary-prefecture | 89 |
| Fri, 03 Jul 2026 05:11:15 GMT | average-weight-middle-school-second-grade-male | 86 |
| Fri, 03 Jul 2026 05:11:15 GMT | cooking-oil-consumption-quantity | 83 |
| Fri, 03 Jul 2026 05:11:15 GMT | cup-noodles-consumption-expenditure | 74 |
| Sun, 21 Jun 2026 09:51:48 GMT | sauce-consumption-quantity | 140 |
| Sun, 21 Jun 2026 09:51:48 GMT | sugar-consumption-quantity | 70 |
| Sun, 21 Jun 2026 09:51:48 GMT | table-salt-consumption-quantity | 68 |
| Sun, 21 Jun 2026 09:51:48 GMT | yogurt-consumption-expenditure | 65 |
| Sun, 21 Jun 2026 09:51:48 GMT | treatment-rate-asthma-outpatient | 60 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 166 | retail-store-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 114 | retail-store-count-alt | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 78 | miscellaneous-school-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 77 | physical-disability-certificates-issued | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 73 | treatment-rate-mood-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 72 | fishery-species-catch-scallop | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 72 | households-on-public-assistance | incomplete | 🔴opus | missing-pref-commentary |
| 71 | psychiatric-bed-count | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 67 | zoo-count | incomplete | 🔴opus | missing-pref-commentary |
| 66 | deaths-lifestyle-diseases | incomplete | 🔴opus | missing-pref-commentary |
| 65 | airport-count | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 64 | white-bread-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 64 | serious-crime-per-100k | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 63 | psychiatric-hospital-count | incomplete | 🔴opus | missing-insights,missing-pref-commentary |
| 62 | cut-flowers-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 61 | peach-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 60 | designated-difficult-disease | missing | 🔴opus | - |
| 59 | sea-bream-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 58 | tempura-fry-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 58 | fishing-port-count-by-type | missing | 🔴opus | - |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

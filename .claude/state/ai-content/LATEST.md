# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-06-21T09:13:14.924Z
- GSC snapshot: 2026-W24 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 924 件)

- ✅ done: 60 件 (impressions 計 10456)
- ⏳ needs-regen: 864 件 (impressions 計 14664)
  - 内訳: incomplete 807 / missing 38 / blocker 19

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 21 Jun 2026 09:12:52 GMT | tissue-paper-consumption-expenditure | 157 |
| Sun, 21 Jun 2026 09:12:51 GMT | general-hospital-bed-occupancy-rate | 269 |
| Sun, 21 Jun 2026 09:12:51 GMT | retail-establishments-by-prefecture | 255 |
| Sun, 21 Jun 2026 09:12:51 GMT | soba-udon-dining-consumption-expenditure | 253 |
| Sun, 21 Jun 2026 09:12:51 GMT | tuna-consumption-quantity | 252 |
| Sun, 21 Jun 2026 09:12:51 GMT | school-teacher-annual-income | 245 |
| Sun, 21 Jun 2026 09:12:51 GMT | konbu-consumption-quantity | 237 |
| Sun, 21 Jun 2026 09:12:51 GMT | potato-consumption-quantity | 222 |
| Sun, 21 Jun 2026 09:12:51 GMT | garbage-total-output | 218 |
| Sun, 21 Jun 2026 09:12:51 GMT | pork-consumption-expenditure | 215 |
| Sun, 21 Jun 2026 09:12:51 GMT | pork-consumption-quantity | 207 |
| Sun, 21 Jun 2026 09:12:51 GMT | icecream-consumption-expenditure | 205 |
| Sun, 21 Jun 2026 09:12:51 GMT | paved-road-total-length | 204 |
| Sun, 21 Jun 2026 09:12:51 GMT | convenience-store-count-commercial | 191 |
| Sun, 21 Jun 2026 09:12:51 GMT | avg-height-high-school-2nd-male | 187 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 1292 | public-phone-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 150 | pickled-plum-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 150 | marine-fishery-aquaculture-output-value | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 149 | green-tea-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 148 | miso-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 145 | treatment-rate-mental-disorder-inpatient | incomplete | paren-number,missing-pref-commentary |
| 142 | physical-disability-certificates-issued | incomplete | paren-number,missing-pref-commentary |
| 142 | dam-count | incomplete | paren-number,missing-pref-commentary |
| 138 | cake-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 138 | gasoline-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 135 | air-conditioner-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 128 | cup-noodles-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 128 | convenience-store-sales-monthly | missing | - |
| 119 | roadside-station-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 114 | soy-sauce-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 113 | konbu-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 111 | fishery-species-catch-yellowtail | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 110 | total-fertility-rate | incomplete | missing-pref-commentary |
| 108 | mochi-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 103 | sauce-consumption-expenditure | incomplete | paren-number,missing-pref-commentary |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

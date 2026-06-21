# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-06-21T08:55:06.928Z
- GSC snapshot: 2026-W24 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (GSC流入 /ranking/ ページ 924 件)

- ✅ done: 40 件 (impressions 計 6270)
- ⏳ needs-regen: 884 件 (impressions 計 18850)
  - 内訳: incomplete 825 / missing 39 / blocker 20

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | blockers |
|---|---|---|---|
| 1292 | public-phone-count | incomplete | paren-number,paren-number,missing-pref-commentary |
| 269 | general-hospital-bed-occupancy-rate | incomplete | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 255 | retail-establishments-by-prefecture | missing | - |
| 253 | soba-udon-dining-consumption-expenditure | incomplete | paren-number,paren-number,missing-pref-commentary |
| 252 | tuna-consumption-quantity | incomplete | paren-number,missing-pref-commentary |
| 245 | school-teacher-annual-income | incomplete | paren-number,paren-number,missing-pref-commentary |
| 237 | konbu-consumption-quantity | incomplete | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 222 | potato-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 218 | garbage-total-output | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 215 | pork-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 207 | pork-consumption-quantity | incomplete | paren-number,paren-number,missing-pref-commentary |
| 205 | icecream-consumption-expenditure | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 204 | paved-road-total-length | incomplete | paren-number,paren-number,missing-pref-commentary |
| 191 | convenience-store-count-commercial | incomplete | paren-number,paren-number,missing-pref-commentary |
| 187 | avg-height-high-school-2nd-male | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 186 | consumption-expenditure-multi-person-households-per-month | blocker | paren-number,paren-number |
| 185 | fishery-species-catch-tuna | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 173 | squid-consumption-quantity | incomplete | paren-number,missing-pref-commentary |
| 164 | banana-consumption-quantity | incomplete | paren-number,paren-number,paren-number,missing-pref-commentary |
| 161 | other-bread-consumption-quantity | incomplete | paren-number,paren-number,missing-pref-commentary |

> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

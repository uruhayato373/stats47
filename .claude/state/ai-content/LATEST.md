# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-26T08:53:24.825Z
- GSC snapshot: 2026-W34 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2167 件)

- ✅ done: 353 件 (16.3% / impressions 計 49152)
- ⏳ needs-regen: 1814 件 (impressions 計 6410)
  - 内訳: missing 203 / incomplete 1552 / blocker 59
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **5.8 件/日** (2026-07-30 からの平均)
- 残り 1814 件 → **完了見込み 約 312 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 23 Aug 2026 10:25:10 GMT | taro-consumption-quantity | 69 |
| Sun, 23 Aug 2026 10:25:10 GMT | sports-participation-rate-judo | 36 |
| Sun, 23 Aug 2026 10:25:10 GMT | new-housing-starts | 27 |
| Sun, 23 Aug 2026 10:23:14 GMT | watermelon-consumption-quantity | 103 |
| Sun, 23 Aug 2026 10:23:14 GMT | wakame-consumption-quantity | 61 |
| Sun, 23 Aug 2026 10:23:14 GMT | tempura-fry-consumption-expenditure | 56 |
| Sun, 23 Aug 2026 10:23:14 GMT | theft-offenses-recognized | 37 |
| Sun, 23 Aug 2026 10:23:14 GMT | treatment-rate-cancer-inpatient | 33 |
| Sun, 23 Aug 2026 10:23:14 GMT | zoo-count | 30 |
| Sun, 23 Aug 2026 10:23:14 GMT | thermal-power-plant-count | 25 |
| Sun, 23 Aug 2026 10:23:14 GMT | study-participation-rate-arts-culture | 24 |
| Sun, 23 Aug 2026 10:23:13 GMT | salmon-consumption-expenditure | 41 |
| Sun, 23 Aug 2026 10:23:13 GMT | starting-salary-highschool | 23 |
| Sun, 23 Aug 2026 10:23:12 GMT | sausage-consumption-quantity | 47 |
| Sun, 23 Aug 2026 10:23:12 GMT | sports-participation-rate-volleyball | 34 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 50 | gpp-public-service | missing | 🔴opus | - |
| 48 | voter-turnout-governor | incomplete | 🔴opus | missing-pref-commentary |
| 45 | high-school-teacher-annual-income | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | junior-high-club-per100-soft-tennis | missing | 🔴opus | - |
| 42 | junior-high-club-per100-swimming | missing | 🔴opus | - |
| 41 | hobby-participation-rate-camping | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 37 | clam-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 35 | junior-high-school-teachers | missing | 🔴opus | - |
| 32 | agricultural-employment-population | missing | 🔴opus | - |
| 32 | other-fresh-fish-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 31 | game-console-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 31 | manufacturing-establishments | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 30 | cod-roe-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 30 | library-lending-books | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 29 | sole-proprietor-sales | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 27 | coffee-drink-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 27 | deaths-lifestyle-diseases | incomplete | 🔴opus | missing-pref-commentary |
| 27 | junior-high-club-per100-basketball | missing | 🔴opus | - |
| 27 | junior-high-club-per100-volleyball | missing | 🔴opus | - |
| 27 | other-dairy-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

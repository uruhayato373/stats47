# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-26T12:21:04.122Z
- GSC snapshot: 2026-W34 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2167 件)

- ✅ done: 362 件 (16.7% / impressions 計 49524)
- ⏳ needs-regen: 1805 件 (impressions 計 6038)
  - 内訳: incomplete 1548 / missing 198 / blocker 59
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **6.1 件/日** (2026-07-30 からの平均)
- 残り 1805 件 → **完了見込み 約 294 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 26 Aug 2026 12:14:39 GMT | agricultural-employment-population | 32 |
| Wed, 26 Aug 2026 10:57:22 GMT | gpp-public-service | 50 |
| Wed, 26 Aug 2026 10:57:22 GMT | voter-turnout-governor | 48 |
| Wed, 26 Aug 2026 10:57:22 GMT | high-school-teacher-annual-income | 45 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-club-per100-soft-tennis | 42 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-club-per100-swimming | 42 |
| Wed, 26 Aug 2026 10:57:22 GMT | hobby-participation-rate-camping | 41 |
| Wed, 26 Aug 2026 10:57:22 GMT | clam-consumption-quantity | 37 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-school-teachers | 35 |
| Sun, 23 Aug 2026 10:25:10 GMT | taro-consumption-quantity | 69 |
| Sun, 23 Aug 2026 10:25:10 GMT | sports-participation-rate-judo | 36 |
| Sun, 23 Aug 2026 10:25:10 GMT | new-housing-starts | 27 |
| Sun, 23 Aug 2026 10:23:14 GMT | watermelon-consumption-quantity | 103 |
| Sun, 23 Aug 2026 10:23:14 GMT | wakame-consumption-quantity | 61 |
| Sun, 23 Aug 2026 10:23:14 GMT | tempura-fry-consumption-expenditure | 56 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
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
| 26 | bacon-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | green-beans-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | instant-noodles-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 26 | software-engineer-annual-income | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 25 | dried-udon-soba-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 25 | municipal-bonds-outstanding | missing | 🔴opus | - |
| 25 | sports-participation-rate-badminton | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 25 | theater-music-hall | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 25 | treatment-rate-mental-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

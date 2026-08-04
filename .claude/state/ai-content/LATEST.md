# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-04T22:04:07.391Z
- GSC snapshot: 2026-W31 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2176 件)

- ✅ done: 215 件 (9.9% / impressions 計 28655)
- ⏳ needs-regen: 1959 件 (impressions 計 10237)
  - 内訳: incomplete 1673 / missing 221 / blocker 65
- 🚫 not-eligible: 2 件 — 観測値が順位として成立しないので生成しない
  - 内訳: no-variance 2

## 生成しない (接地データが不成立)

`--next` から除外している。metric 側の是正 (軸の絞り込み) か isActive の見直しが要る。

| key | year | 理由 |
|---|---|---|
| gini-coefficient-disposable-income | 2019 | 全 47 県が同じ値 (0) — 順位が成立しない |
| unemployment-measures-project-expenses-prefecture | 2022 | 全 47 県が同じ値 (0) — 順位が成立しない |

## ⚠️ 公開済みだが接地データが不成立 (2 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| convenience-store-count-commercial | 2025 | 1580 | 同一県が複数行: 47 県 (例 13000×2, 27000×2, 14000×2) — 分類軸の絞り忘れ / 94 行 (都道府県は 47 しかない) |
| bowling-alley-public | 2021 | 80 | 全 47 県が同じ値 (0) — 順位が成立しない |

## 進捗 (progress-history.csv より)

- 消化ペース: **3.8 件/日** (2026-07-30 からの平均)
- 残り 1959 件 → **完了見込み 約 516 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Tue, 04 Aug 2026 20:40:26 GMT | hobby-participation-rate-go | 83 |
| Tue, 04 Aug 2026 20:40:26 GMT | new-rental-starts | 81 |
| Tue, 04 Aug 2026 20:40:26 GMT | bowling-alley-public | 80 |
| Tue, 04 Aug 2026 20:40:26 GMT | consumer-price-difference-index-overall | 80 |
| Tue, 04 Aug 2026 20:40:26 GMT | coffee-shop-consumption-expenditure | 79 |
| Tue, 04 Aug 2026 00:37:20 GMT | wheat-flour-consumption-expenditure | 101 |
| Mon, 03 Aug 2026 01:14:32 GMT | shrimp-consumption-quantity | 112 |
| Fri, 31 Jul 2026 02:10:16 GMT | water-supply-population | 144 |
| Fri, 31 Jul 2026 02:10:16 GMT | white-bread-consumption-quantity | 104 |
| Fri, 31 Jul 2026 02:10:15 GMT | rice-consumption-quantity | 141 |
| Fri, 31 Jul 2026 02:10:15 GMT | sewage-treatment-coverage-rate | 95 |
| Fri, 31 Jul 2026 02:10:14 GMT | library-books | 225 |
| Fri, 31 Jul 2026 02:10:14 GMT | local-tax-prefecture | 201 |
| Fri, 31 Jul 2026 02:10:14 GMT | road-length-per-km2 | 151 |
| Fri, 31 Jul 2026 02:10:14 GMT | per-capita-fixed-asset-tax-pref-municipal | 112 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 77 | starting-salary-university | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 77 | tennis-court-public | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 76 | hobby-participation-rate-reading | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 74 | leek-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 73 | manufacturing-industry-added-value | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 71 | port-count | missing | 🔴opus | - |
| 71 | thermal-power-plant-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 64 | fishery-workers | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 64 | treatment-rate-mood-disorder-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 63 | flavor-seasoning-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 63 | hamburger-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | katsuobushi-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | nurse-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 62 | physical-therapist-annual-income | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 62 | public-enterprise-accounting-staff | blocker | 🔴opus | paren-number |
| 61 | cucumber-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 60 | densely-populated-area | incomplete | 🔴opus | missing-pref-commentary |
| 57 | railway-station-count | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 57 | treatment-rate-osteoporosis-outpatient | incomplete | 🔴opus | paren-number,paren-number,missing-pref-commentary |
| 55 | major-lake-area | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

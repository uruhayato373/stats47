# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-08-15T20:51:27.813Z
- GSC snapshot: 2026-W32 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)

## サマリ (active ranking 全件 2173 件)

- ✅ done: 254 件 (11.7% / impressions 計 31151)
- ⏳ needs-regen: 1919 件 (impressions 計 7663)
  - 内訳: incomplete 1640 / missing 215 / blocker 64
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## ⚠️ 公開済みだが接地データが不成立 (1 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| convenience-store-count-commercial | 2025 | 2102 | 同一県が複数行: 47 県 (例 13000×2, 27000×2, 14000×2) — 分類軸の絞り忘れ / 94 行 (都道府県は 47 しかない) |

## 進捗 (progress-history.csv より)

- 消化ペース: **3.6 件/日** (2026-07-30 からの平均)
- 残り 1919 件 → **完了見込み 約 530 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 12 Aug 2026 21:21:55 GMT | treatment-rate-diabetes-outpatient | 45 |
| Wed, 12 Aug 2026 21:21:55 GMT | doctor-annual-income | 44 |
| Wed, 12 Aug 2026 21:21:55 GMT | flood-affected-rivers | 44 |
| Wed, 12 Aug 2026 21:21:55 GMT | hydroelectric-power-plant-count | 44 |
| Wed, 12 Aug 2026 21:21:55 GMT | midwife-count | 44 |
| Tue, 11 Aug 2026 20:44:09 GMT | other-mushroom-consumption-quantity | 47 |
| Tue, 11 Aug 2026 20:44:09 GMT | voluntary-car-insurance-rate-vehicle | 47 |
| Tue, 11 Aug 2026 20:44:09 GMT | wind-power-turbine-count | 46 |
| Tue, 11 Aug 2026 20:44:09 GMT | katsuobushi-consumption-expenditure | 45 |
| Tue, 11 Aug 2026 20:44:09 GMT | total-overnight-guests | 45 |
| Tue, 11 Aug 2026 03:39:38 GMT | treatment-rate-osteoporosis-outpatient | 56 |
| Tue, 11 Aug 2026 03:39:38 GMT | chinese-noodles-consumption-expenditure | 55 |
| Tue, 11 Aug 2026 03:39:38 GMT | sports-participation-rate-tennis | 52 |
| Tue, 11 Aug 2026 03:39:38 GMT | vaccination-recipients-disease | 51 |
| Tue, 11 Aug 2026 03:39:38 GMT | aquarium-count | 50 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 44 | mineral-water-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 44 | national-pension-payment-rate | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 43 | black-tea-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 43 | whitebait-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | final-disposal-site-remaining-capacity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 42 | physical-disability-certificates-issued | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 42 | shochu-consumption-quantity | incomplete | 🔴opus | missing-pref-commentary |
| 41 | dried-shiitake-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 41 | elementary-school-teachers | missing | 🔴opus | - |
| 41 | middle-school-students-1-per | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 40 | other-cosmetics-consumption-expenditure | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 40 | tempura-fry-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 39 | drinking-out-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 39 | fish-paste-consumption-expenditure | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 39 | general-hospital-bed-count | incomplete | 🔴opus | missing-pref-commentary |
| 39 | hobby-participation-rate-instrument | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 39 | new-condo-starts | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 38 | lotus-root-consumption-quantity | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |
| 38 | physicians-in-medical-facilities | incomplete | 🔴opus | paren-number,missing-pref-commentary |
| 38 | standard-price-change-rate-commercial | incomplete | 🔴opus | paren-number,paren-number,paren-number,missing-pref-commentary |

> 生成 (author) は常に **sonnet** (frontmatter 固定・コストゲート)。critic は既定 **sonnet**、
> `review` 列が 🔴opus の上位30件 (高GSC流入) + tier-1 が REVISE した件だけ
> `model: opus` を明示指定してエスカレーション審査 (2段 critic)。
> 次バッチ: `node .claude/scripts/ai-content/build-ai-content-queue.mjs --next 10` で対象 key を取得 →
> ranking-content-author を並列起動 → diff-push-r2 --prefix app/ranking → 本スクリプト再実行で done 反映。

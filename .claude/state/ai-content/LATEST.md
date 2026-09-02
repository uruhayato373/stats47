# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-02T01:41:58.817Z
- GSC snapshot: 2026-W35 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (GSC流入 /ranking/ ページ 1294 件)

- ✅ done: 395 件 (30.5% / impressions 計 57199)
- ⏳ needs-regen: 889 件 (impressions 計 4967)
  - 内訳: incomplete 746 / blocker 25 / missing 118
- 🚫 not-eligible: 10 件 — 観測値が順位として成立しないので生成しない
  - 内訳: no-values 8 / no-variance 2

## 生成しない (接地データが不成立)

`--next` から除外している。metric 側の是正 (軸の絞り込み) か isActive の見直しが要る。

| key | year | 理由 |
|---|---|---|
| manufacturing-net-value-added-private | - | values.json が R2 に無い |
| gini-coefficient-disposable-income | 2019 | 全 47 県が同じ値 (0) — 順位が成立しない |
| port-passengers-landing | - | values.json が R2 に無い |
| manufacturing-sales-private | - | values.json が R2 に無い |
| foreign-population-per-100k | - | values.json が R2 に無い |
| port-ships-total | - | values.json が R2 に無い |
| port-vehicle-ferry-car | - | values.json が R2 に無い |
| prefectural-income-per-capita | - | values.json が R2 に無い |
| traffic-accident-per-100k | - | values.json が R2 に無い |
| unemployment-measures-project-expenses-prefecture | 2022 | 全 47 県が同じ値 (0) — 順位が成立しない |

## ⚠️ 公開済みだが接地データが不成立 (1 件)

既に ai-content が R2 にある。読者価値が無いので削除か metric 是正の判断が要る。

| key | year | impressions | 理由 |
|---|---|---|---|
| bowling-alley-public | 2021 | 44 | 全 47 県が同じ値 (0) — 順位が成立しない |

## 進捗 (progress-history.csv より)

- 消化ペース: **8.7 件/日** (2026-08-26 からの平均)
- 残り 889 件 → **完了見込み 約 103 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 02 Sep 2026 01:29:00 GMT | subsidy-expenses-prefecture | 23 |
| Wed, 02 Sep 2026 01:15:07 GMT | volunteer-activity-annual-participation-rate-15plus | 24 |
| Wed, 02 Sep 2026 01:15:06 GMT | sports-participation-rate-badminton | 38 |
| Wed, 02 Sep 2026 01:15:06 GMT | sports-participation-rate-bowling | 32 |
| Wed, 02 Sep 2026 01:15:06 GMT | treatment-rate-mental-disorder-outpatient | 28 |
| Wed, 02 Sep 2026 01:15:06 GMT | security-guard-annual-income | 28 |
| Wed, 02 Sep 2026 01:15:06 GMT | salted-salmon-consumption-quantity | 27 |
| Wed, 02 Sep 2026 01:15:06 GMT | spinach-consumption-expenditure | 25 |
| Wed, 02 Sep 2026 01:15:06 GMT | single-person-households | 22 |
| Wed, 02 Sep 2026 01:15:06 GMT | taxi-fare-consumption-expenditure | 21 |
| Wed, 02 Sep 2026 00:59:15 GMT | chocolate-consumption-expenditure | 47 |
| Wed, 02 Sep 2026 00:59:15 GMT | moped-count | 24 |
| Wed, 02 Sep 2026 00:59:15 GMT | hat-consumption-quantity | 22 |
| Wed, 02 Sep 2026 00:53:50 GMT | road-total-length | 50 |
| Wed, 02 Sep 2026 00:53:50 GMT | other-fresh-fruit-consumption-quantity | 31 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 21 | hobby-participation-rate-pachinko | incomplete | 🟠手動是正候補 | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 21 | psychiatric-hospital-avg-length-of-stay | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 21 | single-mother-households | incomplete | 🟠手動是正候補 | missing-insights,paren-number,missing-pref-commentary |
| 21 | saury-consumption-quantity | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 21 | whisky-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 21 | hobby-participation-rate-western-dance | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 21 | rental-car-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 21 | sanitation-expenditure-ratio-pref-finance | blocker | 🟠手動是正候補 | paren-number,paren-number |
| 21 | sports-drink-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 20 | mandarin-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 20 | average-height-high-school-second-grade-female | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 20 | emergency-hospital-general-clinic-count-per-100k | missing | 🟠手動是正候補 | - |
| 20 | voter-turnout-pref-assembly | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 20 | yellowtail-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 20 | baseball-field-public | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 20 | onion-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 20 | physical-disability-certificates-issued-per-1000 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 19 | instant-noodles-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 19 | scheduled-salary-male | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 19 | patient-receiving-rate-by-age | missing | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

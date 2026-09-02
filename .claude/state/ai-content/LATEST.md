# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-02T08:04:20.557Z
- GSC snapshot: 2026-W35 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (GSC流入 /ranking/ ページ 1294 件)

- ✅ done: 495 件 (38.3% / impressions 計 58872)
- ⏳ needs-regen: 789 件 (impressions 計 3294)
  - 内訳: incomplete 663 / missing 102 / blocker 24
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

- 消化ペース: **23.0 件/日** (2026-08-26 からの平均)
- 残り 789 件 → **完了見込み 約 35 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 02 Sep 2026 08:02:30 GMT | whisky-consumption-quantity | 21 |
| Wed, 02 Sep 2026 08:02:30 GMT | yellowtail-consumption-quantity | 20 |
| Wed, 02 Sep 2026 08:02:30 GMT | wind-power-plant-count-facility | 17 |
| Wed, 02 Sep 2026 08:02:30 GMT | western-food-dining-consumption-expenditure | 13 |
| Wed, 02 Sep 2026 08:02:29 GMT | voter-turnout-pref-assembly | 20 |
| Wed, 02 Sep 2026 08:02:29 GMT | welfare-expense-municipal | 18 |
| Wed, 02 Sep 2026 08:02:29 GMT | unmarried-ratio-female-40-44 | 18 |
| Wed, 02 Sep 2026 08:02:29 GMT | theater-music-hall | 16 |
| Wed, 02 Sep 2026 08:02:29 GMT | volunteer-activity-annual-participation-rate-10plus | 16 |
| Wed, 02 Sep 2026 08:02:29 GMT | travel-participation-rate-homecoming | 13 |
| Wed, 02 Sep 2026 08:02:29 GMT | treatment-rate-schizophrenia-outpatient | 13 |
| Wed, 02 Sep 2026 08:02:29 GMT | umbrella-consumption-quantity | 13 |
| Wed, 02 Sep 2026 08:02:28 GMT | sports-drink-consumption-expenditure | 21 |
| Wed, 02 Sep 2026 08:02:28 GMT | stillbirths-after-22-weeks | 19 |
| Wed, 02 Sep 2026 08:02:28 GMT | strawberry-consumption-quantity | 18 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 13 | food-business-facility-penalties-per-1000 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 13 | foreign-resident-count-korea | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 13 | kindergarten-teacher-annual-income | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 13 | museum-count-per-million | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 13 | national-pension-partial-exemption-rate | missing | 🟠手動是正候補 | - |
| 13 | orange-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 13 | other-processed-meat-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 13 | physical-disability-rehabilitation-cases-per-1000 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 13 | physical-disability-rehabilitation-center-cases-per-1000 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 13 | traffic-safety-special-grant-prefecture | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 13 | womens-socks-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 12 | laundry-detergent-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 12 | lake-count | missing | 🟠手動是正候補 | - |
| 12 | retail-sales-area-by-class | missing | 🟠手動是正候補 | - |
| 12 | mens-socks-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 12 | nursing-welfare-facility-count-per-100k-65plus | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 12 | avg-salary-all-prefecture | blocker | 🟠手動是正候補 | paren-number |
| 12 | consumer-price-difference-index-clothing-footwear | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 12 | dental-clinic-count | incomplete | 🟠手動是正候補 | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 12 | life-expectancy-0-female | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

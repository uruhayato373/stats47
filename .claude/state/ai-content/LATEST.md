# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-01T02:06:52.915Z
- GSC snapshot: 2026-W35 / スコープ: GSC流入のある /ranking/ ページ (SEO優先母集団)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 1 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (GSC流入 /ranking/ ページ 1294 件)

- ✅ done: 345 件 (26.7% / impressions 計 55337)
- ⏳ needs-regen: 939 件 (impressions 計 6829)
  - 内訳: incomplete 785 / missing 128 / blocker 26
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

- 消化ペース: **1.8 件/日** (2026-08-26 からの平均)
- 残り 939 件 → **完了見込み 約 513 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 26 Aug 2026 19:38:14 GMT | deaths-lifestyle-diseases | 33 |
| Wed, 26 Aug 2026 19:38:14 GMT | junior-high-club-per100-basketball | 27 |
| Wed, 26 Aug 2026 17:04:47 GMT | coffee-drink-consumption-expenditure | 30 |
| Wed, 26 Aug 2026 17:01:06 GMT | sole-proprietor-sales | 69 |
| Wed, 26 Aug 2026 16:41:29 GMT | library-lending-books | 72 |
| Wed, 26 Aug 2026 16:20:48 GMT | manufacturing-establishments | 48 |
| Wed, 26 Aug 2026 16:20:48 GMT | game-console-consumption-expenditure | 43 |
| Wed, 26 Aug 2026 16:20:48 GMT | cod-roe-consumption-expenditure | 40 |
| Wed, 26 Aug 2026 16:20:48 GMT | other-fresh-fish-consumption-expenditure | 39 |
| Wed, 26 Aug 2026 12:14:39 GMT | agricultural-employment-population | 56 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-club-per100-soft-tennis | 76 |
| Wed, 26 Aug 2026 10:57:22 GMT | gpp-public-service | 74 |
| Wed, 26 Aug 2026 10:57:22 GMT | voter-turnout-governor | 63 |
| Wed, 26 Aug 2026 10:57:22 GMT | junior-high-school-teachers | 49 |
| Wed, 26 Aug 2026 10:57:22 GMT | clam-consumption-quantity | 48 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 340 | instant-noodles-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 166 | national-pension-full-exemption-rate | missing | 🟠手動是正候補 | - |
| 51 | average-length-of-stay | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 50 | road-total-length | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 49 | daytime-population-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 47 | chocolate-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 40 | bacon-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 38 | sports-participation-rate-badminton | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 36 | green-beans-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 34 | engel-coefficient | missing | 🟠手動是正候補 | - |
| 32 | sports-participation-rate-bowling | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 32 | gender-wage-gap | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 31 | other-fresh-fruit-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 30 | fire-department-pump-car-count-per-100-thousand-people | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 29 | hobby-participation-rate-tea-ceremony | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 29 | junior-high-club-per100-volleyball | missing | 🟠手動是正候補 | - |
| 28 | public-bath-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 28 | treatment-rate-mental-disorder-outpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 28 | security-guard-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 27 | gpp-forestry | missing | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。Claude は定期経路で使わない。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

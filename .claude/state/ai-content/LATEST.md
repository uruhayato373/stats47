# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-26T00:40:18.289Z
- GSC snapshot: 2026-W38 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2420 件)

- ✅ done: 2166 件 (89.5% / impressions 計 88770)
- ⏳ needs-regen: 242 件 (impressions 計 927)
  - 内訳: missing 241 / incomplete 1
- 🚫 not-eligible: 12 件 — 観測値が順位として成立しないので生成しない
  - 内訳: no-values 12

## 生成しない (接地データが不成立)

`--next` から除外している。metric 側の是正 (軸の絞り込み) か isActive の見直しが要る。

| key | year | 理由 |
|---|---|---|
| auto-insurance-penetration-bodily-injury-actual | - | values.json が R2 に無い |
| auto-insurance-penetration-bodily-injury-fixed | - | values.json が R2 に無い |
| child-abuse-consultation-cases | - | values.json が R2 に無い |
| cram-school-establishment-count | - | values.json が R2 に無い |
| deaths-cerebral-infarction-per-100k | - | values.json が R2 に無い |
| fire-affected-persons-count | - | values.json が R2 に無い |
| fire-damage-amount | - | values.json が R2 に無い |
| fresh-vegetables-consumption-expenditure | - | values.json が R2 に無い |
| mothers-age-at-first-birth | - | values.json が R2 に無い |
| nursery-waiting-children-count | - | values.json が R2 に無い |
| seafood-consumption-expenditure | - | values.json が R2 に無い |
| three-generation-household-members | - | values.json が R2 に無い |

## 進捗 (progress-history.csv より)

- 消化ペース: **34.0 件/日** (2026-07-30 からの平均)
- 残り 242 件 → **完了見込み 約 8 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Thu, 24 Sep 2026 21:32:22 GMT | nurses-per-100k-population | 8 |
| Thu, 24 Sep 2026 21:32:22 GMT | judo-therapist-rate | 2 |
| Thu, 24 Sep 2026 21:32:22 GMT | acupuncturist-rate | 0 |
| Mon, 07 Sep 2026 20:30:52 GMT | consumption-expenditure-total | 15 |
| Mon, 07 Sep 2026 20:30:52 GMT | food-expenditure-total | 7 |
| Mon, 07 Sep 2026 15:23:25 GMT | education-expenditure-total | 24 |
| Mon, 07 Sep 2026 15:23:25 GMT | academic-achievement-test-average-rate | 18 |
| Mon, 07 Sep 2026 15:23:25 GMT | furniture-household-expenditure-total | 6 |
| Mon, 07 Sep 2026 15:23:25 GMT | housing-expenditure-total | 5 |
| Mon, 07 Sep 2026 15:23:25 GMT | clothing-footwear-expenditure-total | 3 |
| Mon, 07 Sep 2026 15:23:25 GMT | culture-recreation-expenditure-total | 3 |
| Mon, 07 Sep 2026 15:23:25 GMT | transport-communication-expenditure-total | 3 |
| Mon, 07 Sep 2026 15:23:25 GMT | information-communication-coefficient | 1 |
| Mon, 07 Sep 2026 15:23:25 GMT | utilities-expenditure-total | 1 |
| Mon, 07 Sep 2026 15:23:25 GMT | health-medical-expenditure-total | 0 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 87 | beef-cattle-count | missing | 🟠手動是正候補 | - |
| 72 | foreign-worker-count | missing | 🟠手動是正候補 | - |
| 62 | specific-health-checkup-participation-rate | missing | 🟠手動是正候補 | - |
| 49 | gini-coefficient-disposable-income | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 43 | forestry-output-value | missing | 🟠手動是正候補 | - |
| 41 | roundwood-production-volume | missing | 🟠手動是正候補 | - |
| 32 | forestry-mushroom-output-value | missing | 🟠手動是正候補 | - |
| 28 | retail-employees | missing | 🟠手動是正候補 | - |
| 27 | furusato-fundraising-cost-prefecture | missing | 🟠手動是正候補 | - |
| 26 | public-school-closures-cumulative | missing | 🟠手動是正候補 | - |
| 22 | domestic-travel-consumption-by-destination | missing | 🟠手動是正候補 | - |
| 22 | laundry-beauty-bath-industry-employees | missing | 🟠手動是正候補 | - |
| 21 | metabolic-syndrome-prevalence-among-checkup-recipients | missing | 🟠手動是正候補 | - |
| 20 | food-manufacturing-employees | missing | 🟠手動是正候補 | - |
| 17 | pm25-general-station-compliance-rate | missing | 🟠手動是正候補 | - |
| 15 | natural-disaster-missing-persons | missing | 🟠手動是正候補 | - |
| 14 | natural-disaster-injured-persons | missing | 🟠手動是正候補 | - |
| 12 | construction-employed-residents | missing | 🟠手動是正候補 | - |
| 12 | forestry-timber-output-value | missing | 🟠手動是正候補 | - |
| 11 | food-manufacturing-shipment-amount | missing | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、
> 大規模な構造補完は `ai:backfill` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

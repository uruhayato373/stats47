# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-10-04T00:38:43.112Z
- GSC snapshot: 2026-W39 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2423 件)

- ✅ done: 2166 件 (89.4% / impressions 計 104657)
- ⏳ needs-regen: 257 件 (impressions 計 2667)
  - 内訳: missing 256 / incomplete 1
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **29.8 件/日** (2026-07-30 からの平均)
- 残り 257 件 → **完了見込み 約 9 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 27 Sep 2026 21:53:16 GMT | young-population-ratio | 51 |
| Sun, 27 Sep 2026 21:53:16 GMT | widowed-ratio-male-60plus | 1 |
| Sun, 27 Sep 2026 21:53:16 GMT | work-avg-time-employed-female | 1 |
| Sun, 27 Sep 2026 21:53:16 GMT | widowed-ratio-female-60plus | 0 |
| Sun, 27 Sep 2026 21:53:16 GMT | work-avg-time-employed-male | 0 |
| Sun, 27 Sep 2026 21:53:16 GMT | young-population-index | 0 |
| Sun, 27 Sep 2026 21:53:15 GMT | unemployment-rate | 33 |
| Sun, 27 Sep 2026 21:53:15 GMT | tertiary-activity-avg-time-unemployed-male | 25 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-female-25-29 | 16 |
| Sun, 27 Sep 2026 21:53:15 GMT | volunteer-activity-annual-participation-rate-10plus | 9 |
| Sun, 27 Sep 2026 21:53:15 GMT | volunteer-activity-annual-participation-rate-15plus | 5 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-male-40-44 | 2 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-male-45-49 | 2 |
| Sun, 27 Sep 2026 21:53:15 GMT | tertiary-activity-avg-time-unemployed-female | 0 |
| Sun, 27 Sep 2026 21:53:15 GMT | travel-leisure-annual-participation-rate-15plus | 0 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 146 | beef-cattle-count | missing | 🟠手動是正候補 | - |
| 110 | foreign-worker-count | missing | 🟠手動是正候補 | - |
| 104 | specific-health-checkup-participation-rate | missing | 🟠手動是正候補 | - |
| 101 | medical-physicians-obstetrics-gynecology | missing | 🟠手動是正候補 | - |
| 87 | medical-physicians-pediatrics | missing | 🟠手動是正候補 | - |
| 87 | public-school-closures-cumulative | missing | 🟠手動是正候補 | - |
| 81 | forestry-output-value | missing | 🟠手動是正候補 | - |
| 79 | pig-count | missing | 🟠手動是正候補 | - |
| 75 | gini-coefficient-disposable-income | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 69 | forestry-mushroom-output-value | missing | 🟠手動是正候補 | - |
| 64 | roundwood-production-volume | missing | 🟠手動是正候補 | - |
| 61 | food-manufacturing-establishments | missing | 🟠手動是正候補 | - |
| 58 | natural-disaster-missing-persons | missing | 🟠手動是正候補 | - |
| 56 | domestic-travel-consumption-by-destination | missing | 🟠手動是正候補 | - |
| 56 | inbound-visitors-by-destination | missing | 🟠手動是正候補 | - |
| 52 | metabolic-syndrome-prevalence-among-checkup-recipients | missing | 🟠手動是正候補 | - |
| 48 | retail-employees | missing | 🟠手動是正候補 | - |
| 45 | natural-disaster-injured-persons | missing | 🟠手動是正候補 | - |
| 41 | furusato-fundraising-cost-prefecture | missing | 🟠手動是正候補 | - |
| 41 | sawmill-count | missing | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、
> 大規模な構造補完は `ai:backfill` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

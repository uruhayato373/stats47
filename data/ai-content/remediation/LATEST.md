# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-11-10T04:08:53.826Z
- GSC snapshot: 2026-W44 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通り (blocker 0)、解説の年が values.json の最新年と同じ
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 730 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2596 件)

- ✅ done: 1360 件 (52.4% / impressions 計 122908)
- ⏳ needs-regen: 1236 件 (impressions 計 99263)
  - 内訳: stale-year 805 / missing 430 / incomplete 1
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (1 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |

## 進捗 (progress-history.csv より)

- 消化ペース: **11.3 件/日** (2026-07-30 からの平均)
- 残り 1236 件 → **完了見込み 約 110 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Mon, 09 Nov 2026 01:48:40 GMT | fishing-port-count-by-type | 4241 |
| Sun, 27 Sep 2026 21:53:16 GMT | work-avg-time-employed-female | 24 |
| Sun, 27 Sep 2026 21:53:16 GMT | widowed-ratio-female-60plus | 10 |
| Sun, 27 Sep 2026 21:53:16 GMT | widowed-ratio-male-60plus | 0 |
| Sun, 27 Sep 2026 21:53:16 GMT | work-avg-time-employed-male | 0 |
| Sun, 27 Sep 2026 21:53:16 GMT | young-population-index | 0 |
| Sun, 27 Sep 2026 21:53:15 GMT | volunteer-activity-annual-participation-rate-15plus | 88 |
| Sun, 27 Sep 2026 21:53:15 GMT | vacant-housing-ratio | 55 |
| Sun, 27 Sep 2026 21:53:15 GMT | unemployment-rate | 42 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-male-40-44 | 28 |
| Sun, 27 Sep 2026 21:53:15 GMT | volunteer-activity-annual-participation-rate-10plus | 26 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-male-45-49 | 18 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-female-25-29 | 17 |
| Sun, 27 Sep 2026 21:53:15 GMT | tertiary-activity-avg-time-unemployed-male | 7 |
| Sun, 27 Sep 2026 21:53:15 GMT | travel-leisure-annual-participation-rate-15plus | 1 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 2837 | natto-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 2827 | manufacturing-shipment-amount | stale-year | 🟠手動是正候補 | - |
| 2000 | inbound-visitors-by-destination | missing | 🟠手動是正候補 | - |
| 1659 | raw-milk-production | missing | 🟠手動是正候補 | - |
| 1647 | convenience-store-count-commercial | stale-year | 🟠手動是正候補 | - |
| 1475 | rice-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 1216 | fishery-species-catch-mackerel | stale-year | 🟠手動是正候補 | - |
| 1193 | food-manufacturing-establishments | missing | 🟠手動是正候補 | - |
| 1172 | designated-difficult-disease | stale-year | 🟠手動是正候補 | - |
| 1159 | fishery-species-catch-pacific-saury | stale-year | 🟠手動是正候補 | - |
| 1056 | beef-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 1002 | specific-health-checkup-participation-rate | missing | 🟠手動是正候補 | - |
| 1001 | pork-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 992 | coffee-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 981 | bacon-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 942 | icecream-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 901 | bacon-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 885 | fishery-species-catch-sardine | stale-year | 🟠手動是正候補 | - |
| 877 | manufacturing-establishments | stale-year | 🟠手動是正候補 | - |
| 861 | cup-noodles-consumption-quantity | stale-year | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、
> 大規模な構造補完は `ai:backfill` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

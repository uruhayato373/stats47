# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-11-14T02:28:25.488Z
- GSC snapshot: 2026-W45 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通り (blocker 0)、解説の年が values.json の最新年と同じ
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 730 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2596 件)

- ✅ done: 1360 件 (52.4% / impressions 計 135377)
- ⏳ needs-regen: 1236 件 (impressions 計 105853)
  - 内訳: stale-year 805 / missing 430 / incomplete 1
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (4 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |
| natto-consumption-expenditure | 3 | gemini-daily | 2026-11-11 |
| manufacturing-shipment-amount | 3 | gemini-daily | 2026-11-11 |
| inbound-visitors-by-destination | 3 | gemini-daily | 2026-11-12 |

## 進捗 (progress-history.csv より)

- 消化ペース: **10.9 件/日** (2026-07-30 からの平均)
- 残り 1236 件 → **完了見込み 約 114 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Mon, 09 Nov 2026 01:48:40 GMT | fishing-port-count-by-type | 4356 |
| Sun, 27 Sep 2026 21:53:16 GMT | work-avg-time-employed-female | 23 |
| Sun, 27 Sep 2026 21:53:16 GMT | widowed-ratio-female-60plus | 8 |
| Sun, 27 Sep 2026 21:53:16 GMT | widowed-ratio-male-60plus | 1 |
| Sun, 27 Sep 2026 21:53:16 GMT | work-avg-time-employed-male | 0 |
| Sun, 27 Sep 2026 21:53:16 GMT | young-population-index | 0 |
| Sun, 27 Sep 2026 21:53:15 GMT | vacant-housing-ratio | 91 |
| Sun, 27 Sep 2026 21:53:15 GMT | volunteer-activity-annual-participation-rate-15plus | 88 |
| Sun, 27 Sep 2026 21:53:15 GMT | unemployment-rate | 73 |
| Sun, 27 Sep 2026 21:53:15 GMT | volunteer-activity-annual-participation-rate-10plus | 58 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-male-40-44 | 31 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-female-25-29 | 22 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-male-45-49 | 17 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-female-45-49 | 5 |
| Sun, 27 Sep 2026 21:53:15 GMT | unmarried-ratio-female-30-34 | 4 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 3902 | manufacturing-shipment-amount | stale-year | 🟠手動是正候補 | - |
| 2961 | inbound-visitors-by-destination | missing | 🟠手動是正候補 | - |
| 2198 | total-population | stale-year | 🟠手動是正候補 | - |
| 2013 | natto-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 1969 | raw-milk-production | missing | 🟠手動是正候補 | - |
| 1383 | rice-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 1377 | convenience-store-count-commercial | stale-year | 🟠手動是正候補 | - |
| 1356 | manufacturing-establishments | stale-year | 🟠手動是正候補 | - |
| 1292 | food-manufacturing-establishments | missing | 🟠手動是正候補 | - |
| 1208 | fishery-species-catch-mackerel | stale-year | 🟠手動是正候補 | - |
| 1111 | fishery-species-catch-pacific-saury | stale-year | 🟠手動是正候補 | - |
| 1055 | specific-health-checkup-participation-rate | missing | 🟠手動是正候補 | - |
| 1016 | designated-difficult-disease | stale-year | 🟠手動是正候補 | - |
| 911 | icecream-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 908 | fishery-species-catch-sardine | stale-year | 🟠手動是正候補 | - |
| 896 | beef-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 894 | fishery-species-catch-bonito | stale-year | 🟠手動是正候補 | - |
| 886 | annual-sales-amount | stale-year | 🟠手動是正候補 | - |
| 858 | gyoza-frozen-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 830 | soba-udon-dining-consumption-expenditure | stale-year | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、
> 大規模な構造補完は `ai:backfill` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

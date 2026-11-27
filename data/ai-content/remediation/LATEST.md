# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-11-27T04:15:48.644Z
- GSC snapshot: 2026-W46 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通り (blocker 0)、解説の年が values.json の最新年と同じ
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 727 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2624 件)

- ✅ done: 1361 件 (51.9% / impressions 計 141015)
- ⏳ needs-regen: 1263 件 (impressions 計 101980)
  - 内訳: stale-year 807 / missing 455 / incomplete 1
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (11 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |
| natto-consumption-expenditure | 3 | gemini-daily | 2026-11-11 |
| manufacturing-shipment-amount | 3 | gemini-daily | 2026-11-11 |
| inbound-visitors-by-destination | 3 | gemini-daily | 2026-11-12 |
| raw-milk-production | 3 | gemini-daily | 2026-11-14 |
| convenience-store-count-commercial | 3 | gemini-daily | 2026-11-15 |
| rice-consumption-quantity | 3 | gemini-daily | 2026-11-15 |
| total-population | 3 | gemini-daily | 2026-11-16 |
| manufacturing-establishments | 3 | gemini-daily | 2026-11-18 |
| food-manufacturing-establishments | 3 | gemini-daily | 2026-11-18 |
| icecream-consumption-expenditure | 3 | gemini-daily | 2026-11-22 |

## 進捗 (progress-history.csv より)

- 消化ペース: **9.7 件/日** (2026-07-30 からの平均)
- 残り 1263 件 → **完了見込み 約 131 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Wed, 25 Nov 2026 04:58:39 GMT | pig-count | 1017 |
| Wed, 25 Nov 2026 04:58:38 GMT | designated-difficult-disease | 849 |
| Tue, 24 Nov 2026 06:04:13 GMT | soba-udon-dining-consumption-expenditure | 1008 |
| Tue, 24 Nov 2026 06:04:13 GMT | fishery-species-catch-bonito | 918 |
| Mon, 23 Nov 2026 02:48:49 GMT | bread-consumption-quantity | 1251 |
| Mon, 23 Nov 2026 02:48:49 GMT | annual-sales-amount | 1192 |
| Mon, 23 Nov 2026 02:48:49 GMT | specific-health-checkup-participation-rate | 1139 |
| Mon, 23 Nov 2026 02:23:44 GMT | traffic-accident-count | 31 |
| Mon, 23 Nov 2026 02:23:44 GMT | smartphone-usage-students | 5 |
| Mon, 23 Nov 2026 02:23:44 GMT | usage-fees-prefecture | 2 |
| Mon, 23 Nov 2026 02:23:44 GMT | public-health-nurse-count-per-100k | 0 |
| Mon, 23 Nov 2026 02:23:44 GMT | special-support-school-expenses-prefecture | 0 |
| Mon, 23 Nov 2026 02:23:43 GMT | national-treasury-disbursement-prefecture | 569 |
| Mon, 23 Nov 2026 02:23:43 GMT | hobby-participation-rate-knitting | 171 |
| Mon, 23 Nov 2026 02:23:43 GMT | junior-high-school-expenses-prefecture | 8 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 4802 | manufacturing-shipment-amount | stale-year | 🟠手動是正候補 | - |
| 3475 | total-population | stale-year | 🟠手動是正候補 | - |
| 3458 | inbound-visitors-by-destination | missing | 🟠手動是正候補 | - |
| 2177 | raw-milk-production | missing | 🟠手動是正候補 | - |
| 1828 | natto-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 1661 | manufacturing-establishments | stale-year | 🟠手動是正候補 | - |
| 1414 | rice-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 1286 | icecream-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 1256 | food-manufacturing-establishments | missing | 🟠手動是正候補 | - |
| 1065 | convenience-store-count-commercial | stale-year | 🟠手動是正候補 | - |
| 818 | general-hospital-count | stale-year | 🟠手動是正候補 | - |
| 815 | pork-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 812 | fishery-species-catch-sardine | stale-year | 🟠手動是正候補 | - |
| 801 | consumer-price-difference-index-housing | stale-year | 🟠手動是正候補 | - |
| 797 | beef-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 784 | table-salt-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 777 | cup-noodles-consumption-expenditure | stale-year | 🟠手動是正候補 | - |
| 750 | foreign-worker-count | missing | 🟠手動是正候補 | - |
| 712 | sugar-consumption-quantity | stale-year | 🟠手動是正候補 | - |
| 697 | gasoline-consumption-quantity | stale-year | 🟠手動是正候補 | - |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、
> 大規模な構造補完は `ai:backfill` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

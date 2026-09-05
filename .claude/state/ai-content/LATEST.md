# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-05T15:52:30.307Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 861 件 (39.8% / impressions 計 61242)
- ⏳ needs-regen: 1302 件 (impressions 計 797)
  - 内訳: incomplete 1128 / missing 127 / blocker 47
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (2 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| public-kindergarten-ratio | 3 | claude-local | 2026-09-05 |
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |

## 進捗 (progress-history.csv より)

- 消化ペース: **18.0 件/日** (2026-07-30 からの平均)
- 残り 1302 件 → **完了見込み 約 73 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 05 Sep 2026 15:50:20 GMT | womens-stockings-consumption-quantity | 4 |
| Sat, 05 Sep 2026 15:50:19 GMT | widowed-ratio-male-60plus | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | total-assessed-land-area | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | tsuyu-tare-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | tuition-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | voter-turnout-mayor | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | water-pollution-control-law-facility-count | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | watermelon-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 15:50:18 GMT | womens-stockings-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 15:50:17 GMT | prefectural-income-growth-rate-h17 | 4 |
| Sat, 05 Sep 2026 15:50:17 GMT | refrigerator-consumption-quantity | 4 |
| Sat, 05 Sep 2026 15:50:17 GMT | securities-balance | 4 |
| Sat, 05 Sep 2026 15:50:17 GMT | solar-panel-housing-rate | 4 |
| Sat, 05 Sep 2026 15:50:17 GMT | sports-participation-rate-walking | 4 |
| Sat, 05 Sep 2026 15:50:17 GMT | table-sofa-consumption-expenditure | 4 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mayonnaise-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | rabies-vaccination-dogs | missing | 🟠手動是正候補 | - |
| 4 | total-area-including-northern-territories-and-takeshima | missing | 🟠手動是正候補 | - |
| 4 | treatment-rate-diabetes-inpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | treatment-rate-musculoskeletal-outpatient | incomplete | 🟠手動是正候補 | faq-speculation,missing-pref-commentary |
| 4 | treatment-rate-neurosis-inpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | usage-fees-prefecture | blocker | 🟠手動是正候補 | paren-number |
| 4 | vet-fee-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 3 | bus-fare-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | commute-on-foot | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | cook-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | cook-licensees-by-prefecture | missing | 🟠手動是正候補 | - |
| 3 | dental-technician-rate | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | dietitian-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | disaster-recovery-project-expenses-prefecture | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | domestic-package-tour-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | education-expense-municipal | missing | 🟠手動是正候補 | - |
| 3 | enoki-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | enoki-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

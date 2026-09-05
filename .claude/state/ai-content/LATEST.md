# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-05T10:59:03.659Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 823 件 (38.0% / impressions 計 61097)
- ⏳ needs-regen: 1340 件 (impressions 計 942)
  - 内訳: incomplete 1162 / missing 129 / blocker 49
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (2 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| public-kindergarten-ratio | 3 | claude-local | 2026-09-05 |
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |

## 進捗 (progress-history.csv より)

- 消化ペース: **16.9 件/日** (2026-07-30 からの平均)
- 残り 1340 件 → **完了見込み 約 80 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 05 Sep 2026 10:57:43 GMT | tableware-consumption-quantity | 5 |
| Sat, 05 Sep 2026 10:57:43 GMT | water-supply-annual-volume | 5 |
| Sat, 05 Sep 2026 10:57:42 GMT | other-consumption-expenditure-ratio-multi-person-households | 5 |
| Sat, 05 Sep 2026 10:57:42 GMT | per-student-public-high-school-expenditure-pref-municipal | 5 |
| Sat, 05 Sep 2026 10:57:42 GMT | hat-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | high-school-education-cost-fulltime-per-student | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | hobby-participation-rate-gardening | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | hobby-participation-rate-manga | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | household-income-by-type | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | housing-charges-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | independent-revenue-prefecture | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | intellectual-crime-per-100k | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | liver-disease-death-rate | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | new-owner-occupied-starts | 4 |
| Sat, 05 Sep 2026 10:57:42 GMT | other-prepared-food-consumption-expenditure | 4 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mayonnaise-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | treatment-rate-neurosis-outpatient | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 4 | air-conditioner-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | healthy-life-expectancy-female | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | hobby-participation-rate-cooking | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | hobby-participation-rate-theater | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | kerosene-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | kindergarten-expenses-prefecture | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | miscellaneous-school-count-per-100k | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | other-staple-prepared-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | paper-diapers-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | per-child-public-elementary-school-expenditure-pref-municipal | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | pickled-chinese-cabbage-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | pilot-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | prefectural-income-growth-rate-h17 | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | rabies-vaccination-dogs | missing | 🟠手動是正候補 | - |
| 4 | refrigerator-consumption-quantity | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 4 | securities-balance | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 4 | solar-panel-housing-rate | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

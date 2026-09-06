# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-06T21:25:38.452Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2154 件)

- ✅ done: 1291 件 (59.9% / impressions 計 61355)
- ⏳ needs-regen: 863 件 (impressions 計 157)
  - 内訳: missing 76 / incomplete 752 / blocker 35
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (2 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| public-kindergarten-ratio | 3 | claude-local | 2026-09-05 |
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |

## 進捗 (progress-history.csv より)

- 消化ペース: **28.8 件/日** (2026-07-30 からの平均)
- 残り 863 件 → **完了見込み 約 30 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sun, 06 Sep 2026 21:23:28 GMT | treatment-rate-diabetes-inpatient | 4 |
| Sun, 06 Sep 2026 21:23:28 GMT | treatment-rate-circulatory-inpatient | 3 |
| Sun, 06 Sep 2026 21:23:28 GMT | unmarried-ratio-male-45-49 | 3 |
| Sun, 06 Sep 2026 21:23:28 GMT | vegetable-seaweed-tsukudani-consumption-expenditure | 3 |
| Sun, 06 Sep 2026 21:23:28 GMT | water-supply-population-ratio-pre2011 | 3 |
| Sun, 06 Sep 2026 21:23:28 GMT | whitebait-consumption-expenditure | 3 |
| Sun, 06 Sep 2026 21:23:28 GMT | womens-shoes-consumption-quantity | 3 |
| Sun, 06 Sep 2026 21:23:28 GMT | treatment-rate-cerebrovascular-outpatient | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | university-new-graduates-unemployment-rate | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | voter-turnout-council-district | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | welfare-expenditure | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | womens-dress-consumption-quantity | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | womens-foundation-garment-consumption-expenditure | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | workers-agriculture-forestry-fishery | 2 |
| Sun, 06 Sep 2026 21:23:28 GMT | wristwatch-consumption-expenditure | 2 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 4 | total-area-including-northern-territories-and-takeshima | missing | 🟠手動是正候補 | - |
| 3 | hobby-participation-rate-knitting | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | household-head-income-worker-households-per-month | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | insecticide-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | japanese-food-dining-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | maternity-hospital-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | melon-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | new-graduate-scheduled-salary-university-female | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 3 | nursing-home-residents-per-1000-65plus | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 3 | private-sports-facility | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 3 | researcher-annual-income | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 3 | total-outpatients | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 3 | traffic-accident-casualties-elderly-65plus | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 2 | block-park-count | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 2 | botanical-garden-count | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 2 | dental-guidance-persons | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 2 | electricity-consumption-expenditure | missing | 🟠手動是正候補 | - |
| 2 | firefighting-expenses-prefecture | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 2 | green-pepper-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 2 | gross-prefectural-income-growth-rate-real-h17 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

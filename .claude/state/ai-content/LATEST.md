# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-05T23:55:52.185Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2154 件)

- ✅ done: 870 件 (40.4% / impressions 計 60774)
- ⏳ needs-regen: 1284 件 (impressions 計 738)
  - 内訳: incomplete 1113 / missing 125 / blocker 46
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (2 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| public-kindergarten-ratio | 3 | claude-local | 2026-09-05 |
| mayonnaise-consumption-quantity | 3 | claude-local | 2026-09-05 |

## 進捗 (progress-history.csv より)

- 消化ペース: **18.2 件/日** (2026-07-30 からの平均)
- 残り 1284 件 → **完了見込み 約 71 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 05 Sep 2026 23:12:48 GMT | port-count | 27 |
| Sat, 05 Sep 2026 23:12:44 GMT | roadside-station-count | 69 |
| Sat, 05 Sep 2026 16:25:35 GMT | vet-fee-consumption-expenditure | 4 |
| Sat, 05 Sep 2026 16:25:34 GMT | rabies-vaccination-dogs | 4 |
| Sat, 05 Sep 2026 16:25:34 GMT | treatment-rate-musculoskeletal-outpatient | 4 |
| Sat, 05 Sep 2026 16:25:34 GMT | financial-debt-balance | 3 |
| Sat, 05 Sep 2026 16:25:33 GMT | treatment-rate-neurosis-inpatient | 4 |
| Sat, 05 Sep 2026 16:25:33 GMT | usage-fees-prefecture | 4 |
| Sat, 05 Sep 2026 16:25:33 GMT | enoki-consumption-quantity | 3 |
| Sat, 05 Sep 2026 16:25:33 GMT | establishment-ratio-300plus-employees-private | 3 |
| Sat, 05 Sep 2026 16:25:33 GMT | female-class-lecture-count-per-million-female | 3 |
| Sat, 05 Sep 2026 16:25:32 GMT | bus-fare-consumption-expenditure | 3 |
| Sat, 05 Sep 2026 16:25:32 GMT | commute-on-foot | 3 |
| Sat, 05 Sep 2026 16:25:32 GMT | cook-annual-income | 3 |
| Sat, 05 Sep 2026 16:25:32 GMT | cook-licensees-by-prefecture | 3 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mayonnaise-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | total-area-including-northern-territories-and-takeshima | missing | 🟠手動是正候補 | - |
| 4 | treatment-rate-diabetes-inpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 3 | education-expense-municipal | missing | 🟠手動是正候補 | - |
| 3 | enoki-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | female-parttime-workers | missing | 🟠手動是正候補 | - |
| 3 | fire-earthquake-insurance-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 3 | fishery-household-sex-age | missing | 🟠手動是正候補 | - |
| 3 | flounder-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | foreign-resident-count-usa | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 3 | game-software-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | hair-coloring-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,faq-speculation,paren-number,missing-pref-commentary |
| 3 | health-checkup-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | hobby-participation-rate-art-appreciation | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | hobby-participation-rate-home-movie | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | hobby-participation-rate-knitting | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | home-helper-count-per-100k | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | household-head-income-worker-households-per-month | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 3 | households-on-public-assistance | incomplete | 🟠手動是正候補 | missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

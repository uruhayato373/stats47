# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-05T08:54:41.412Z
- GSC snapshot: 2026-W35 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2163 件)

- ✅ done: 773 件 (35.7% / impressions 計 60883)
- ⏳ needs-regen: 1390 件 (impressions 計 1156)
  - 内訳: incomplete 1209 / missing 131 / blocker 50
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 🚧 quarantine — critic 常習不合格で自動生成を停止中 (1 件)

`--next` から除外している。生成しても critic を通らないため。手動 agent での再是正か、
プロンプト/データ側の是正が要る (直って PASS すれば自動で解除)。

| key | 連続失敗 | 直近理由 | 最終失敗日 |
|---|---|---|---|
| public-kindergarten-ratio | 3 | claude-local | 2026-09-05 |

## 進捗 (progress-history.csv より)

- 消化ペース: **15.6 件/日** (2026-07-30 からの平均)
- 残り 1390 件 → **完了見込み 約 90 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Sat, 05 Sep 2026 08:53:14 GMT | womens-clothing-consumption-expenditure | 6 |
| Sat, 05 Sep 2026 06:34:07 GMT | travel-bag-consumption-expenditure | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | relaxation-avg-time-female | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | relaxation-avg-time-male | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | resident-foreigner-korea | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | scallop-consumption-quantity | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | sewerage-drainage-population | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | sleep-avg-time-female | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | sports-annual-participation-rate-10plus | 5 |
| Sat, 05 Sep 2026 06:34:06 GMT | sports-participation-rate-skiing | 5 |
| Sat, 05 Sep 2026 06:34:05 GMT | per-student-public-junior-high-school-expenditure-pref-municipal | 5 |
| Sat, 05 Sep 2026 06:34:04 GMT | curry-roux-consumption-expenditure | 5 |
| Sat, 05 Sep 2026 06:34:04 GMT | inpatient-rate-per-100k | 5 |
| Sat, 05 Sep 2026 06:34:04 GMT | kiwi-consumption-expenditure | 5 |
| Sat, 05 Sep 2026 06:34:04 GMT | municipal-intellectual-disability-consultations | 5 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|
| 6 | public-kindergarten-ratio | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mayonnaise-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | mochi-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,ng-word,paren-number,missing-pref-commentary |
| 5 | orange-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | other-consumption-expenditure-ratio-multi-person-households | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | per-capita-kenmin-shotoku-h17 | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | per-student-public-high-school-expenditure-pref-municipal | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | salted-salmon-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | tableware-consumption-quantity | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | treatment-rate-hypertension-inpatient | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 5 | treatment-rate-neurosis-outpatient | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 5 | tuna-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 5 | unmarried-ratio-female-25-29 | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 5 | unmarried-ratio-female-30-34 | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 5 | water-supply-annual-volume | incomplete | 🟠手動是正候補 | paren-number,missing-pref-commentary |
| 5 | water-supply-capacity | incomplete | 🟠手動是正候補 | missing-pref-commentary |
| 5 | youth-class-lecture-count-per-million | incomplete | 🟠手動是正候補 | paren-number,paren-number,missing-pref-commentary |
| 4 | accommodation-consumption-expenditure | missing | 🟠手動是正候補 | - |
| 4 | air-conditioner-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |
| 4 | amusement-park-consumption-expenditure | incomplete | 🟠手動是正候補 | paren-number,paren-number,paren-number,missing-pref-commentary |

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。在庫の量産はローカルの headless claude CLI
> (`run-claude-batch.sh`・同じ監査/critic) で人が量を決めて回す。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位30件。自動失敗が続いた場合だけ agent で是正する。

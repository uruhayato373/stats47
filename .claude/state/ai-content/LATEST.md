# ranking ai-content 是正キュー (LATEST)

- 生成: 2026-09-08T00:28:08.606Z
- GSC snapshot: 2026-W36 / スコープ: R2 の active ranking 全件 (量産フェーズ用・GSC流入なしは impressions 0)
- done 判定: R2 の ai-content が auditRow を通る (blocker 0)
- スコープ境界: このキューは**都道府県ランキング (app/ranking) 専用**。市区町村 (公開 171 key・app/municipalities) と全国 (/japan) は対象外 — 別契約 (backlog MUNI-AI-CONTENT-01 / JAPAN-COMMENTARY-01、正典 ranking-content-standards.md §スコープ境界)

## サマリ (active ranking 全件 2166 件)

- ✅ done: 2166 件 (100.0% / impressions 計 73347)
- ⏳ needs-regen: 0 件 (impressions 計 0)
  - 内訳: —
- 🚫 not-eligible: 0 件 — 観測値が順位として成立しないので生成しない

## 進捗 (progress-history.csv より)

- 消化ペース: **49.3 件/日** (2026-07-30 からの平均)
- 残り 0 件 → **完了見込み 約 0 日**

## いつ修正したか (done を R2 last-modified 降順・上位15)

| R2 last-modified | key | impressions |
|---|---|---|
| Mon, 07 Sep 2026 20:30:52 GMT | consumption-expenditure-total | 14 |
| Mon, 07 Sep 2026 20:30:52 GMT | food-expenditure-total | 7 |
| Mon, 07 Sep 2026 15:23:25 GMT | academic-achievement-test-average-rate | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | clothing-footwear-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | culture-recreation-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | education-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | furniture-household-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | health-medical-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | housing-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | information-communication-coefficient | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | information-communication-expenditure | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | other-living-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | transport-communication-expenditure-total | 0 |
| Mon, 07 Sep 2026 15:23:25 GMT | utilities-expenditure-total | 0 |
| Sun, 06 Sep 2026 23:12:37 GMT | woodland-area | 11 |

## 次にやるべき上位20 (impressions 降順)

| impressions | key | reason | review | blockers |
|---|---|---|---|---|

> 日次は **Gemini API** が author 生成 → 決定的監査 → 別リクエストの Gemini critic を通し、
> 既定 3件を outbox 経由で R2 へ公開する。個別の独自考察改善はローカルの headless author+critic、
> 大規模な構造補完は `ai:backfill` + 全件監査 + 境界サンプル意味レビューを使う。Agent tool 経路の Claude は例外是正のみ。
> 🟠手動是正候補は GSC 流入上位0件。自動失敗が続いた場合だけ agent で是正する。

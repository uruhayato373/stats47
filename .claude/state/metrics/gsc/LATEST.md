# GSC Latest — 2026-W40

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

⚠️ insufficient-data — insufficient-data: finalized7d=partial (missing 2026-09-30,2026-10-01) / previous7d=complete (missing -)。WoW・ゲート判定は停止する。

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 10018 |
| Impressions | 294095 |
| CTR | 3.41% |
| Avg Position | 6.85 |
| Queries rows | 9971 |
| Pages rows | 5491 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

# GSC Latest — 2026-W35

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-08-21 〜 2026-08-27（直前7日: 2026-08-14 〜 2026-08-20・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 1473 | 1651 | -178 (-10.8%) |
| Impressions | 42756 | 44746 | -1990 (-4.4%) |
| CTR | 3.45% | 3.69% | |
| Avg Position | 7.64 | 7.31 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 4921 |
| Impressions | 143811 |
| CTR | 3.42% |
| Avg Position | 7.65 |
| Queries rows | 2865 |
| Pages rows | 3525 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

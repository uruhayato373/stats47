# GSC Latest — 2026-W44

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-10-23 〜 2026-10-29（直前7日: 2026-10-16 〜 2026-10-22・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 5042 | 4136 | +906 (+21.9%) |
| Impressions | 173019 | 129610 | +43409 (+33.5%) |
| CTR | 2.91% | 3.19% | |
| Avg Position | 7 | 6.89 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 16701 |
| Impressions | 528667 |
| CTR | 3.16% |
| Avg Position | 6.82 |
| Queries rows | 16942 |
| Pages rows | 6776 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

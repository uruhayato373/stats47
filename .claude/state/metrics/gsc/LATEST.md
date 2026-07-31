# GSC Latest — 2026-W30

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-07-17 〜 2026-07-23（直前7日: 2026-07-10 〜 2026-07-16・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 892 | 823 | +69 (+8.4%) |
| Impressions | 23239 | 25464 | -2225 (-8.7%) |
| CTR | 3.84% | 3.23% | |
| Avg Position | 8.08 | 8.18 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 3157 |
| Impressions | 94448 |
| CTR | 3.34% |
| Avg Position | 8.12 |
| Queries rows | 2068 |
| Pages rows | 2708 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

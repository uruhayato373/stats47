# GSC Latest — 2026-W43

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-10-16 〜 2026-10-22（直前7日: 2026-10-09 〜 2026-10-15・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 4136 | 3902 | +234 (+6%) |
| Impressions | 129610 | 124700 | +4910 (+3.9%) |
| CTR | 3.19% | 3.13% | |
| Avg Position | 6.89 | 6.58 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 14733 |
| Impressions | 441139 |
| CTR | 3.34% |
| Avg Position | 6.76 |
| Queries rows | 13704 |
| Pages rows | 5945 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

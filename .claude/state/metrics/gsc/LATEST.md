# GSC Latest — 2026-W37

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-09-04 〜 2026-09-10（直前7日: 2026-08-28 〜 2026-09-03・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 2381 | 1998 | +383 (+19.2%) |
| Impressions | 73763 | 61829 | +11934 (+19.3%) |
| CTR | 3.23% | 3.23% | |
| Avg Position | 6.85 | 7.45 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 7503 |
| Impressions | 223094 |
| CTR | 3.36% |
| Avg Position | 7.26 |
| Queries rows | 5720 |
| Pages rows | 4204 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

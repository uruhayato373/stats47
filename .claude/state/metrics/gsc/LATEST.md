# GSC Latest — 2026-W36

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-08-28 〜 2026-09-03（直前7日: 2026-08-21 〜 2026-08-27・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 1998 | 1473 | +525 (+35.6%) |
| Impressions | 61829 | 42756 | +19073 (+44.6%) |
| CTR | 3.23% | 3.45% | |
| Avg Position | 7.45 | 7.64 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 6053 |
| Impressions | 180347 |
| CTR | 3.36% |
| Avg Position | 7.52 |
| Queries rows | 4061 |
| Pages rows | 4096 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

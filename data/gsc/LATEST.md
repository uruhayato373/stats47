# GSC Latest — 2026-W42

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-10-09 〜 2026-10-15（直前7日: 2026-10-02 〜 2026-10-08・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 3902 | 3621 | +281 (+7.8%) |
| Impressions | 124700 | 101338 | +23362 (+23.1%) |
| CTR | 3.13% | 3.57% | |
| Avg Position | 6.58 | 6.75 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 13207 |
| Impressions | 396688 |
| CTR | 3.33% |
| Avg Position | 6.74 |
| Queries rows | 12907 |
| Pages rows | 5859 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

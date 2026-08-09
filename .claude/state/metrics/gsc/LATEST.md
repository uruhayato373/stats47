# GSC Latest — 2026-W32

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-07-31 〜 2026-08-06（直前7日: 2026-07-24 〜 2026-07-30・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 866 | 912 | -46 (-5%) |
| Impressions | 25293 | 26816 | -1523 (-5.7%) |
| CTR | 3.42% | 3.40% | |
| Avg Position | 8.12 | 8.12 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 3493 |
| Impressions | 100812 |
| CTR | 3.46% |
| Avg Position | 8.13 |
| Queries rows | 2416 |
| Pages rows | 2872 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

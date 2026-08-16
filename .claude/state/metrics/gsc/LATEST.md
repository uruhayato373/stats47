# GSC Latest — 2026-W33

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-08-07 〜 2026-08-13（直前7日: 2026-07-31 〜 2026-08-06・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 930 | 866 | +64 (+7.4%) |
| Impressions | 30995 | 25293 | +5702 (+22.5%) |
| CTR | 3.00% | 3.42% | |
| Avg Position | 7.79 | 8.12 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 3600 |
| Impressions | 106343 |
| CTR | 3.39% |
| Avg Position | 8.02 |
| Queries rows | 2433 |
| Pages rows | 3055 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

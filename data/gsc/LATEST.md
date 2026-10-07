# GSC Latest — 2026-W40

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-09-25 〜 2026-10-01（直前7日: 2026-09-18 〜 2026-09-24・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 3074 | 2610 | +464 (+17.8%) |
| Impressions | 85491 | 85159 | +332 (+0.4%) |
| CTR | 3.60% | 3.06% | |
| Avg Position | 6.85 | 6.83 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 11023 |
| Impressions | 321856 |
| CTR | 3.42% |
| Avg Position | 6.84 |
| Queries rows | 10663 |
| Pages rows | 5613 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

# GSC Latest — 2026-W47

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-11-13 〜 2026-11-19（直前7日: 2026-11-06 〜 2026-11-12・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 3401 | 5241 | -1840 (-35.1%) |
| Impressions | 99473 | 208092 | -108619 (-52.2%) |
| CTR | 3.42% | 2.52% | |
| Avg Position | 7.39 | 7.21 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 19196 |
| Impressions | 681779 |
| CTR | 2.82% |
| Avg Position | 7.15 |
| Queries rows | 22661 |
| Pages rows | 8712 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

## 明細 (queries / pages) の期間と捕捉率

| 明細 | 期間 | サイト全体のクリック | キーワード表のクリック | キーワード表の捕捉率 | ページ表の捕捉率 |
|---|---|---|---|---|---|
| 28 日 (queries.csv / pages.csv) | 2026-10-23 〜 2026-11-19 | 19196 | 3693 (22661 語) | 19.2% | 101.4% |
| 確定 7 日 (queries-finalized7d.csv / pages-finalized7d.csv) | 2026-11-13 〜 2026-11-19 | 3401 | 629 (8710 語) | 18.5% | 101.2% |

> キーワード表に無いクリックは GSC が検索語を伏せた分で、推定で埋めない。カテゴリ別の需要は [`DEMAND-LATEST.md`](./DEMAND-LATEST.md) を読む。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

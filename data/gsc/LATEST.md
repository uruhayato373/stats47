# GSC Latest — 2026-W46

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-11-06 〜 2026-11-12（直前7日: 2026-10-30 〜 2026-11-05・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 5241 | 5512 | -271 (-4.9%) |
| Impressions | 208092 | 201195 | +6897 (+3.4%) |
| CTR | 2.52% | 2.74% | |
| Avg Position | 7.21 | 7.11 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 19931 |
| Impressions | 711916 |
| CTR | 2.80% |
| Avg Position | 7.07 |
| Queries rows | 21650 |
| Pages rows | 8112 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

## 明細 (queries / pages) の期間と捕捉率

| 明細 | 期間 | サイト全体のクリック | キーワード表のクリック | キーワード表の捕捉率 | ページ表の捕捉率 |
|---|---|---|---|---|---|
| 28 日 (queries.csv / pages.csv) | 2026-10-16 〜 2026-11-12 | 19931 | 3770 (21650 語) | 18.9% | 101.4% |
| 確定 7 日 (queries-finalized7d.csv / pages-finalized7d.csv) | 2026-11-06 〜 2026-11-12 | 5241 | 974 (12435 語) | 18.6% | 101.6% |

> キーワード表に無いクリックは GSC が検索語を伏せた分で、推定で埋めない。カテゴリ別の需要は [`DEMAND-LATEST.md`](./DEMAND-LATEST.md) を読む。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

# GSC Latest — 2026-W45

## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)

期間: 2026-10-30 〜 2026-11-05（直前7日: 2026-10-23 〜 2026-10-29・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Clicks | 5512 | 5042 | +470 (+9.3%) |
| Impressions | 201195 | 173019 | +28176 (+16.3%) |
| CTR | 2.74% | 2.91% | |
| Avg Position | 7.11 | 7 | |

## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)

| Metric | ローリング28日 |
|---|---|
| Clicks | 18592 |
| Impressions | 628524 |
| CTR | 2.96% |
| Avg Position | 6.93 |
| Queries rows | 19744 |
| Pages rows | 7578 |

> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない。

## 明細 (queries / pages) の期間と捕捉率

| 明細 | 期間 | サイト全体のクリック | キーワード表のクリック | キーワード表の捕捉率 | ページ表の捕捉率 |
|---|---|---|---|---|---|
| 28 日 (queries.csv / pages.csv) | 2026-10-02 〜 2026-10-29 | 16701 | 3163 (16942 語) | 18.9% | 101.3% |

確定 7 日の明細はこの週の snapshot に無い (2026-11-14 の取得の追加より前の週は保存していない)。
> キーワード表に無いクリックは GSC が検索語を伏せた分で、推定で埋めない。カテゴリ別の需要は [`DEMAND-LATEST.md`](./DEMAND-LATEST.md) を読む。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から
> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の
> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。

# GA4 Latest — 2026-W34

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-08-16 〜 2026-08-22（直前7日: 2026-08-09 〜 2026-08-15・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 3309 | 1919 | +1390 (+72.4%) |
| Sessions | 3801 | 2243 | +1558 (+69.5%) |
| Engaged Sessions | 2609 | 1617 | +992 (+61.3%) |
| Pageviews | 8164 | 5210 | +2954 (+56.7%) |
| Engagement Rate | 68.64% | 72.09% | |

> pollution 監視: raw sessions 4535 − JP 3801 = 734 (16.2%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 3290 | jp-calendar-week |
| Sessions | 3800 | jp-calendar-week |
| Pageviews | 7958 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

# GA4 Latest — 2026-W33

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-08-09 〜 2026-08-15（直前7日: 2026-08-02 〜 2026-08-08・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 1919 | 2002 | -83 (-4.1%) |
| Sessions | 2243 | 2386 | -143 (-6%) |
| Engaged Sessions | 1617 | 1716 | -99 (-5.8%) |
| Pageviews | 5210 | 6090 | -880 (-14.4%) |
| Engagement Rate | 72.09% | 71.92% | |

> pollution 監視: raw sessions 2630 − JP 2243 = 387 (14.7%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 1928 | jp-calendar-week |
| Sessions | 2254 | jp-calendar-week |
| Pageviews | 5262 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

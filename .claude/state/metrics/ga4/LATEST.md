# GA4 Latest — 2026-W39

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-09-20 〜 2026-09-26（直前7日: 2026-09-13 〜 2026-09-19・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 3836 | 4284 | -448 (-10.5%) |
| Sessions | 4393 | 5001 | -608 (-12.2%) |
| Engaged Sessions | 2924 | 3330 | -406 (-12.2%) |
| Pageviews | 9489 | 12211 | -2722 (-22.3%) |
| Engagement Rate | 66.56% | 66.59% | |

> pollution 監視: raw sessions 5439 − JP 4393 = 1046 (19.2%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 3844 | jp-calendar-week |
| Sessions | 4361 | jp-calendar-week |
| Pageviews | 9352 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

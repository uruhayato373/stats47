# GA4 Latest — 2026-W35

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-08-23 〜 2026-08-29（直前7日: 2026-08-16 〜 2026-08-22・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 2843 | 3309 | -466 (-14.1%) |
| Sessions | 3333 | 3801 | -468 (-12.3%) |
| Engaged Sessions | 2257 | 2609 | -352 (-13.5%) |
| Pageviews | 7560 | 8164 | -604 (-7.4%) |
| Engagement Rate | 67.72% | 68.64% | |

> pollution 監視: raw sessions 4380 − JP 3333 = 1047 (23.9%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 2837 | jp-calendar-week |
| Sessions | 3357 | jp-calendar-week |
| Pageviews | 7586 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

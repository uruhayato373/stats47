# GA4 Latest — 2026-W36

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-08-30 〜 2026-09-05（直前7日: 2026-08-23 〜 2026-08-29・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 3596 | 2843 | +753 (+26.5%) |
| Sessions | 4062 | 3333 | +729 (+21.9%) |
| Engaged Sessions | 2817 | 2257 | +560 (+24.8%) |
| Pageviews | 9612 | 7560 | +2052 (+27.1%) |
| Engagement Rate | 69.35% | 67.72% | |

> pollution 監視: raw sessions 5200 − JP 4062 = 1138 (21.9%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 3636 | jp-calendar-week |
| Sessions | 4043 | jp-calendar-week |
| Pageviews | 9825 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

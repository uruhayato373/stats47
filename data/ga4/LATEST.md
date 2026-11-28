# GA4 Latest — 2026-W47

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-11-15 〜 2026-11-21（直前7日: 2026-11-08 〜 2026-11-14・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 5493 | 7288 | -1795 (-24.6%) |
| Sessions | 6608 | 8657 | -2049 (-23.7%) |
| Engaged Sessions | 4699 | 6165 | -1466 (-23.8%) |
| Pageviews | 12770 | 16510 | -3740 (-22.7%) |
| Engagement Rate | 71.11% | 71.21% | |

> pollution 監視: raw sessions 10920 − JP 6608 = 4312 (39.5%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 5444 | jp-calendar-week |
| Sessions | 6376 | jp-calendar-week |
| Pageviews | 12479 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (2026-10-10 以前の日曜実行分は末日未確定。金曜に前週を取る現行は確定済み)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

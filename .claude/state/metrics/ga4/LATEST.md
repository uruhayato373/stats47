# GA4 Latest — 2026-W38

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-09-13 〜 2026-09-19（直前7日: 2026-09-06 〜 2026-09-12・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 4284 | 3865 | +419 (+10.8%) |
| Sessions | 5001 | 4507 | +494 (+11%) |
| Engaged Sessions | 3330 | 3034 | +296 (+9.8%) |
| Pageviews | 12211 | 11424 | +787 (+6.9%) |
| Engagement Rate | 66.59% | 67.32% | |

> pollution 監視: raw sessions 5773 − JP 5001 = 772 (13.4%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 4191 | jp-calendar-week |
| Sessions | 4915 | jp-calendar-week |
| Pageviews | 11598 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

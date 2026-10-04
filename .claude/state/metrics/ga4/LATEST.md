# GA4 Latest — 2026-W40

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-09-27 〜 2026-10-03（直前7日: 2026-09-20 〜 2026-09-26・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 4872 | 3836 | +1036 (+27%) |
| Sessions | 5651 | 4393 | +1258 (+28.6%) |
| Engaged Sessions | 4021 | 2924 | +1097 (+37.5%) |
| Pageviews | 10783 | 9489 | +1294 (+13.6%) |
| Engagement Rate | 71.16% | 66.56% | |

> pollution 監視: raw sessions 6812 − JP 5651 = 1161 (17%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 4872 | jp-calendar-week |
| Sessions | 5672 | jp-calendar-week |
| Pageviews | 10505 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

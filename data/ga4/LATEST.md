# GA4 Latest — 2026-W42

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-10-11 〜 2026-10-17（直前7日: 2026-10-04 〜 2026-10-10・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 5442 | 5484 | -42 (-0.8%) |
| Sessions | 6338 | 6242 | +96 (+1.5%) |
| Engaged Sessions | 4495 | 4245 | +250 (+5.9%) |
| Pageviews | 12099 | 12179 | -80 (-0.7%) |
| Engagement Rate | 70.92% | 68.01% | |

> pollution 監視: raw sessions 7320 − JP 6338 = 982 (13.4%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 5521 | jp-calendar-week |
| Sessions | 6439 | jp-calendar-week |
| Pageviews | 12288 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (2026-10-10 以前の日曜実行分は末日未確定。金曜に前週を取る現行は確定済み)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

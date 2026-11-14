# GA4 Latest — 2026-W45

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-11-01 〜 2026-11-07（直前7日: 2026-10-25 〜 2026-10-31・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 7224 | 7088 | +136 (+1.9%) |
| Sessions | 8326 | 8127 | +199 (+2.4%) |
| Engaged Sessions | 6065 | 5820 | +245 (+4.2%) |
| Pageviews | 15757 | 15400 | +357 (+2.3%) |
| Engagement Rate | 72.84% | 71.61% | |

> pollution 監視: raw sessions 11715 − JP 8326 = 3389 (28.9%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 7294 | jp-calendar-week |
| Sessions | 8446 | jp-calendar-week |
| Pageviews | 16246 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (2026-10-10 以前の日曜実行分は末日未確定。金曜に前週を取る現行は確定済み)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

# GA4 Latest — 2026-W44

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-10-25 〜 2026-10-31（直前7日: 2026-10-18 〜 2026-10-24・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 7088 | 6062 | +1026 (+16.9%) |
| Sessions | 8127 | 7270 | +857 (+11.8%) |
| Engaged Sessions | 5820 | 5076 | +744 (+14.7%) |
| Pageviews | 15400 | 13277 | +2123 (+16%) |
| Engagement Rate | 71.61% | 69.82% | |

> pollution 監視: raw sessions 10649 − JP 8127 = 2522 (23.7%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 7144 | jp-calendar-week |
| Sessions | 8165 | jp-calendar-week |
| Pageviews | 15362 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (2026-10-10 以前の日曜実行分は末日未確定。金曜に前週を取る現行は確定済み)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

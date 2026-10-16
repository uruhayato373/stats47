# GA4 Latest — 2026-W41

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-10-04 〜 2026-10-10（直前7日: 2026-09-27 〜 2026-10-03・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 5484 | 4872 | +612 (+12.6%) |
| Sessions | 6242 | 5651 | +591 (+10.5%) |
| Engaged Sessions | 4245 | 4021 | +224 (+5.6%) |
| Pageviews | 12179 | 10783 | +1396 (+12.9%) |
| Engagement Rate | 68.01% | 71.16% | |

> pollution 監視: raw sessions 7636 − JP 6242 = 1394 (18.3%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 5415 | jp-calendar-week |
| Sessions | 6268 | jp-calendar-week |
| Pageviews | 12059 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (2026-10-10 以前の日曜実行分は末日未確定。金曜に前週を取る現行は確定済み)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

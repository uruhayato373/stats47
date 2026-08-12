# GA4 Latest — 2026-W32

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-08-02 〜 2026-08-08（直前7日: 2026-07-26 〜 2026-08-01・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 2002 | 2054 | -52 (-2.5%) |
| Sessions | 2383 | 2508 | -125 (-5%) |
| Engaged Sessions | 1546 | 1700 | -154 (-9.1%) |
| Pageviews | 6055 | 6233 | -178 (-2.9%) |
| Engagement Rate | 64.88% | 67.78% | |

> pollution 監視: raw sessions 4698 − JP 2383 = 2315 (49.3%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 1917 | jp-calendar-week |
| Sessions | 2271 | jp-calendar-week |
| Pageviews | 5752 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

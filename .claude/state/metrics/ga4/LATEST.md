# GA4 Latest — 2026-W31

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-07-26 〜 2026-08-01（直前7日: 2026-07-19 〜 2026-07-25・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 2054 | 2101 | -47 (-2.2%) |
| Sessions | 2508 | 2545 | -37 (-1.5%) |
| Engaged Sessions | 1700 | 1692 | +8 (+0.5%) |
| Pageviews | 6233 | 6725 | -492 (-7.3%) |
| Engagement Rate | 67.78% | 66.48% | |

> pollution 監視: raw sessions 3893 − JP 2508 = 1385 (35.6%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 1998 | jp-calendar-week |
| Sessions | 2425 | jp-calendar-week |
| Pageviews | 5661 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

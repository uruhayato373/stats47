# GA4 Latest — 2026-W30

## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)

期間: 2026-07-19 〜 2026-07-25（直前7日: 2026-07-12 〜 2026-07-18・重複なし）

| Metric | 確定7日 | 直前7日 | WoW |
|---|---|---|---|
| Active Users | 2101 | 2255 | -154 (-6.8%) |
| Sessions | 2545 | 2710 | -165 (-6.1%) |
| Engaged Sessions | 1692 | 1766 | -74 (-4.2%) |
| Pageviews | 6725 | 6748 | -23 (-0.3%) |
| Engagement Rate | 66.48% | 65.17% | |

> pollution 監視: raw sessions 3392 − JP 2545 = 847 (25%)。raw を KPI へ混ぜない。

## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)

| Metric | 値 | basis |
|---|---|---|
| Active Users | 2134 | jp-calendar-week |
| Sessions | 2586 | jp-calendar-week |
| Pageviews | 7112 | jp-calendar-week |

> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、
> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。

履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)

> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only
> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。

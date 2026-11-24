# AdSense Latest — 2026-W46

## 確定7日 KPI (finalized7d・前週比は直前の重複しない7日)

期間: 2026-11-08 〜 2026-11-14 (前週比の相手: 2026-11-01 〜 2026-11-07)

| Metric | 確定7日 | 前週比 |
|---|---|---|
| Earnings | 858.00 ▲ |  (+86.1%) |
| Page Views | 12368 ▲ |  (+6.2%) |
| Page RPM | 69.000 ▲ | |
| Impressions | 26058 ▲ |  (+67.6%) |
| 公式 Imp RPM | ¥33.00 | |
| Clicks | 126 ▲ |  (+129.1%) |
| CTR | 0.48% · | |
| 公式 CPC | ¥7.00 | |
| Viewability | 53.5% ▼ | |
| Ad Requests | 43032 | |
| Coverage | 77.9% | |

## 収益分解

- Impression density (imp/PV): **2.107** (前週 1.335)
- Viewable imp / PV: **1.128**
- 公式 Imp RPM: ¥33.00 / 公式 CPC: ¥7.00

## デバイス別（確定7日 / 前週比）

| Platform | RPM | Viewability | 公式CPC | 収益/click(legacy) | imp/PV | Earnings |
|---|---|---|---|---|---|---|
| Connected TV | ¥32.00 ▲ | 42.1% ▲ +42.1pp | ¥0.00 | ¥0.00 | 3.167 | ¥0.00 |
| Desktop | ¥35.00 ▲ | 50.7% ▲ | ¥7.00 | ¥6.78 | 1.694 | ¥271.00 (+80.7%) |
| Mobile | ¥136.00 ▲ | 56.7% ▼ -12.2pp | ¥7.00 | ¥6.75 | 2.918 | ¥567.00 (+85.3%) |
| Tablet | ¥59.00 ▲ | 53.4% ▲ | ¥10.00 | ¥10.00 | 1.618 | ¥20.00 (+300.0%) |

> ⚠️ **要確認の退行**: Mobile viewability -12.2pp（68.9%→56.7%）

## ページ種別 (GA4・確定7日と同じ窓・全世界)

| ページ種別 | PV | 広告の表示 | クリック | 収益 | 1,000 PV あたり | 前週の 1,000 PV あたり |
|---|---|---|---|---|---|---|
| ランキング | 6524 | 11639 | 36 | ¥368 | ¥56.4 | ¥35.8 |
| ブログ記事 | 3474 | 5694 | 26 | ¥195 | ¥56.1 | ¥32.2 |
| その他 | 4503 | 3123 | 12 | ¥147 | ¥32.6 | ¥13.2 |
| テーマ | 1759 | 2297 | 5 | ¥52 | ¥29.4 | ¥15.9 |
| 地域 (県・市区町村) | 1514 | 850 | 3 | ¥41 | ¥26.9 | ¥15.1 |
| ホーム | 509 | 635 | 1 | ¥20 | ¥39.5 | ¥20.7 |
| カテゴリ | 321 | 446 | 0 | ¥7 | ¥22.5 | ¥19.2 |
| 検索 | 607 | 140 | 0 | ¥1 | ¥2.4 | ¥1.4 |
| 合計 | 19211 | 24824 | 83 | ¥831 | ¥43.2 | |

> GA4 の AdSense 連携 (2026-10-13〜) のページ別の値を `page-type.mjs` で分類した。合計は AdSense の値より少なく出る週がある (W43 ¥182 対 ¥210、W44 ¥266 対 ¥313。11-04〜11-10 は ¥596 対 ¥611)。収益の総額は上の AdSense の値を使い、この表はページ種別どうしの比較に使う。クリックは少ないので、判断は 1,000 PV あたりで行う。

履歴: [`history.csv`](./history.csv) / [`history-devices.csv`](./history-devices.csv) (デバイス別) / [`history-units.csv`](./history-units.csv) (ユニット別) / [`history-formats.csv`](./history-formats.csv) (フォーマット別) / [`history-placements.csv`](./history-placements.csv) (配置別) / [`history-bid-types.csv`](./history-bid-types.csv) (入札型別) / [`history-page-types.csv`](./history-page-types.csv) (ページ種別)

> schema v2 (2026-07-28): 公式 `COST_PER_CLICK`/`IMPRESSIONS_RPM`/`AD_REQUESTS`/`AD_REQUESTS_COVERAGE` を追加。
> 旧 `cpc` 列 (earnings/clicks) は**公式 CPC ではない**ため `earnings_per_click_legacy` へ改名した (値は不変)。
> 公式値が無い過去週は `-` (null)。0 で埋めない。ESTIMATED_EARNINGS は月次確定まで変動しうる推定値。

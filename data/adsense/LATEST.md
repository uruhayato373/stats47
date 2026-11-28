# AdSense Latest — 2026-W47

## 確定7日 KPI (finalized7d・前週比は直前の重複しない7日)

期間: 2026-11-15 〜 2026-11-21 (前週比の相手: 2026-11-08 〜 2026-11-14)

| Metric | 確定7日 | 前週比 |
|---|---|---|
| Earnings | 784.00 ▼ |  (-8.6%) |
| Page Views | 10551 ▼ |  (-14.7%) |
| Page RPM | 74.000 ▲ | |
| Impressions | 24067 ▼ |  (-7.6%) |
| 公式 Imp RPM | ¥33.00 | |
| Clicks | 135 ▲ |  (+7.1%) |
| CTR | 0.56% · | |
| 公式 CPC | ¥6.00 | |
| Viewability | 57.0% ▲ | |
| Ad Requests | 43664 | |
| Coverage | 74.2% | |

## 収益分解

- Impression density (imp/PV): **2.281** (前週 2.107)
- Viewable imp / PV: **1.301**
- 公式 Imp RPM: ¥33.00 / 公式 CPC: ¥6.00

## デバイス別（確定7日 / 前週比）

| Platform | RPM | Viewability | 公式CPC | 収益/click(legacy) | imp/PV | Earnings |
|---|---|---|---|---|---|---|
| Desktop | ¥40.00 ▲ | 61.1% ▲ +10.4pp | ¥6.00 | ¥6.17 | 1.798 | ¥290.00 (+7.0%) |
| Mobile | ¥160.00 ▲ | 52.2% ▼ -4.5pp | ¥6.00 | ¥5.61 | 3.490 | ¥477.00 (-15.9%) |
| Tablet | ¥51.00 ▼ | 49.5% ▼ -3.9pp | ¥6.00 | ¥5.67 | 1.900 | ¥17.00 (-15.0%) |

## ページ種別 (GA4・確定7日と同じ窓・全世界)

| ページ種別 | PV | 広告の表示 | クリック | 収益 | 1,000 PV あたり | 前週の 1,000 PV あたり |
|---|---|---|---|---|---|---|
| ランキング | 5826 | 11120 | 46 | ¥339 | ¥58.1 | ¥56.4 |
| ブログ記事 | 2202 | 4700 | 26 | ¥189 | ¥86.0 | ¥56.1 |
| その他 | 4009 | 3247 | 20 | ¥138 | ¥34.3 | ¥32.6 |
| テーマ | 1421 | 1292 | 6 | ¥38 | ¥27.0 | ¥29.4 |
| 地域 (県・市区町村) | 1179 | 1321 | 4 | ¥34 | ¥28.6 | ¥26.9 |
| ホーム | 419 | 651 | 1 | ¥15 | ¥35.0 | ¥39.5 |
| カテゴリ | 227 | 412 | 0 | ¥7 | ¥30.1 | ¥22.5 |
| 検索 | 573 | 396 | 0 | ¥6 | ¥9.9 | ¥2.4 |
| 合計 | 15856 | 23139 | 103 | ¥765 | ¥48.2 | |

> GA4 の AdSense 連携 (2026-10-13〜) のページ別の値を `page-type.mjs` で分類した。合計は AdSense の値より少なく出る週がある (W43 ¥182 対 ¥210、W44 ¥266 対 ¥313。11-04〜11-10 は ¥596 対 ¥611)。収益の総額は上の AdSense の値を使い、この表はページ種別どうしの比較に使う。クリックは少ないので、判断は 1,000 PV あたりで行う。

履歴: [`history.csv`](./history.csv) / [`history-devices.csv`](./history-devices.csv) (デバイス別) / [`history-units.csv`](./history-units.csv) (ユニット別) / [`history-formats.csv`](./history-formats.csv) (フォーマット別) / [`history-placements.csv`](./history-placements.csv) (配置別) / [`history-bid-types.csv`](./history-bid-types.csv) (入札型別) / [`history-page-types.csv`](./history-page-types.csv) (ページ種別)

> schema v2 (2026-07-28): 公式 `COST_PER_CLICK`/`IMPRESSIONS_RPM`/`AD_REQUESTS`/`AD_REQUESTS_COVERAGE` を追加。
> 旧 `cpc` 列 (earnings/clicks) は**公式 CPC ではない**ため `earnings_per_click_legacy` へ改名した (値は不変)。
> 公式値が無い過去週は `-` (null)。0 で埋めない。ESTIMATED_EARNINGS は月次確定まで変動しうる推定値。

# ブログ改善優先度キュー

生成日: 2026-05-17 / GSC 参照週: 2026-W20 / ブログ記事数: 115 / 平均 CTR: 2.67%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | habitable-area-land-use | 658 | 0.30% | +2.37% | 0.067 |
| 2 | manufacturing-aichi-dominance | 497 | 0.20% | +2.47% | 0.067 |
| 3 | overnight-guests-inbound-recovery | 383 | 0.26% | +2.41% | 0.062 |
| 4 | child-height-regional-gap | 1,719 | 0.76% | +1.91% | 0.062 |
| 5 | manufacturing-shipment-prefecture-ranking | 159 | 0.00% | +2.67% | 0.059 |
| 6 | minimum-wage-1000yen-breakthrough | 118 | 0.00% | +2.67% | 0.055 |
| 7 | sunshine-pacific-vs-nihonkai | 118 | 0.00% | +2.67% | 0.055 |
| 8 | consumer-price-regional-gap | 250 | 0.40% | +2.27% | 0.055 |
| 9 | fishery-catch-aquaculture-shift | 96 | 0.00% | +2.67% | 0.053 |
| 10 | birth-death-gap-decline | 71 | 0.00% | +2.67% | 0.050 |
| 11 | precipitation-snow-regional-gap | 192 | 0.52% | +2.15% | 0.049 |
| 12 | agriculture-hokkaido-dominance | 66 | 0.00% | +2.67% | 0.049 |
| 13 | truck-driver-2024-crisis | 65 | 0.00% | +2.67% | 0.049 |
| 14 | electricity-demand-gap | 54 | 0.00% | +2.67% | 0.047 |
| 15 | aging-rate-akita-vs-okinawa | 46 | 0.00% | +2.67% | 0.045 |
| 16 | school-nonattendance-pattern | 44 | 0.00% | +2.67% | 0.044 |
| 17 | cpi-change-regional-pattern | 42 | 0.00% | +2.67% | 0.044 |
| 18 | marriage-divorce-okinawa | 41 | 0.00% | +2.67% | 0.043 |
| 19 | food-spending-pattern | 38 | 0.00% | +2.67% | 0.043 |
| 20 | water-sewage-crisis | 38 | 0.00% | +2.67% | 0.043 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog-article habitable-area-land-use
/brushup-blog-article manufacturing-aichi-dominance
/brushup-blog-article overnight-guests-inbound-recovery
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)

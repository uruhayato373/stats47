---
type: blog-plan
status: active
tags: [brushup, ctr-improvement]
---

# ブログ改善優先度キュー

生成日: 2026-05-10 / GSC 参照週: 2026-W19 / ブログ記事数: 114 / 平均 CTR: 2.65%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | manufacturing-aichi-dominance | 280 | 0.00% | +2.65% | 0.065 |
| 2 | habitable-area-land-use | 608 | 0.33% | +2.32% | 0.064 |
| 3 | foreign-residents-diversity-map | 186 | 0.00% | +2.65% | 0.060 |
| 4 | consumer-price-regional-gap | 340 | 0.29% | +2.36% | 0.060 |
| 5 | overnight-guests-inbound-recovery | 336 | 0.30% | +2.35% | 0.059 |
| 6 | minimum-wage-1000yen-breakthrough | 111 | 0.00% | +2.65% | 0.054 |
| 7 | manufacturing-shipment-prefecture-ranking | 100 | 0.00% | +2.65% | 0.053 |
| 8 | child-height-regional-gap | 921 | 0.87% | +1.78% | 0.053 |
| 9 | birth-death-gap-decline | 78 | 0.00% | +2.65% | 0.050 |
| 10 | barber-beauty-salon-regional-gap | 69 | 0.00% | +2.65% | 0.049 |
| 11 | cpi-change-regional-pattern | 66 | 0.00% | +2.65% | 0.048 |
| 12 | truck-driver-2024-crisis | 64 | 0.00% | +2.65% | 0.048 |
| 13 | fishery-species-prefecture-specialty | 186 | 0.54% | +2.11% | 0.048 |
| 14 | post-office-last-window | 51 | 0.00% | +2.65% | 0.045 |
| 15 | food-spending-pattern | 50 | 0.00% | +2.65% | 0.045 |
| 16 | school-nonattendance-pattern | 49 | 0.00% | +2.65% | 0.045 |
| 17 | aging-rate-akita-vs-okinawa | 48 | 0.00% | +2.65% | 0.045 |
| 18 | electricity-demand-gap | 48 | 0.00% | +2.65% | 0.045 |
| 19 | housing-cost-livability-trend | 45 | 0.00% | +2.65% | 0.044 |
| 20 | wage-vs-living-cost | 44 | 0.00% | +2.65% | 0.044 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog-article manufacturing-aichi-dominance
/brushup-blog-article habitable-area-land-use
/brushup-blog-article foreign-residents-diversity-map
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)

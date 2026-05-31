# ブログ改善優先度キュー

生成日: 2026-05-30 / GSC 参照週: 2026-W22 / ブログ記事数: 185 / 平均 CTR: 2.77%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | child-height-regional-gap | 2,071 | 0.77% | +2.00% | 0.066 |
| 2 | consumer-price-regional-gap | 199 | 0.00% | +2.77% | 0.064 |
| 3 | manufacturing-aichi-dominance | 1,047 | 0.67% | +2.10% | 0.063 |
| 4 | fishery-catch-aquaculture-shift | 184 | 0.00% | +2.77% | 0.063 |
| 5 | overnight-guests-inbound-recovery | 318 | 0.31% | +2.46% | 0.061 |
| 6 | precipitation-snow-regional-gap | 151 | 0.00% | +2.77% | 0.060 |
| 7 | foreign-overnight-guests-prefecture-gap | 148 | 0.00% | +2.77% | 0.060 |
| 8 | habitable-area-land-use | 592 | 0.68% | +2.09% | 0.058 |
| 9 | agriculture-hokkaido-dominance | 117 | 0.00% | +2.77% | 0.057 |
| 10 | park-green-space-gap | 368 | 0.54% | +2.23% | 0.057 |
| 11 | fertility-rate-prefecture-gap | 216 | 0.46% | +2.31% | 0.054 |
| 12 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%81%AE%E6%8E%A8%E7%A7%BB9%E5%B9%B4%E3%81%A7%E7%94%B7%E6%80%A7226%E6%AD%B3%E3%81%97%E3%81%8B%E3%81%97%E4%B8%8D%E5%81%A5%E5%BA%B7%E6%9C%9F%E9%96%93%E3%81%AF%E7%B8%AE%E3%81%BE%E3%82%89%E3%81%AA%E3%81%84 | 78 | 0.00% | +2.77% | 0.052 |
| 13 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B01%E4%BD%8D%E3%81%AF%E5%A4%A7%E5%88%86%E7%9C%8C47%E4%BD%8D%E3%81%AF%E5%B2%A9%E6%89%8B%E7%9C%8C | 78 | 0.00% | +2.77% | 0.052 |
| 14 | health-life-expectancy-structure#%E5%85%A8%E5%9B%BD%E3%83%9E%E3%83%83%E3%83%97 | 78 | 0.00% | +2.77% | 0.052 |
| 15 | health-life-expectancy-structure#%E5%8C%BB%E5%B8%AB%E6%95%B0%E3%81%AE%E6%8E%A8%E7%A7%BB47%E5%B9%B4%E3%81%A726%E5%80%8D | 60 | 0.00% | +2.77% | 0.049 |
| 16 | temperature-extremes-map | 2,699 | 1.33% | +1.44% | 0.049 |
| 17 | marriage-divorce-okinawa | 47 | 0.00% | +2.77% | 0.047 |
| 18 | minimum-wage-1000yen-breakthrough | 45 | 0.00% | +2.77% | 0.046 |
| 19 | alcohol-prefecture-map | 44 | 0.00% | +2.77% | 0.046 |
| 20 | brazilian-resident-population-prefecture-gap | 44 | 0.00% | +2.77% | 0.046 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog --target article child-height-regional-gap
/brushup-blog --target article consumer-price-regional-gap
/brushup-blog --target article manufacturing-aichi-dominance
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)

# ブログ改善優先度キュー

生成日: 2026-06-06 / GSC 参照週: 2026-W23 / ブログ記事数: 237 / 平均 CTR: 2.15%

**スコア** = CTR ギャップ（平均 - ページ）× log10(impressions + 1)

| 優先度 | slug | imp | CTR | 平均比 | score |
|---|---|---:|---:|---:|---:|
| 1 | consumer-price-regional-gap | 241 | 0.00% | +2.15% | 0.051 |
| 2 | dairy-cattle-hokkaido-monopoly | 437 | 0.23% | +1.92% | 0.051 |
| 3 | fishery-catch-aquaculture-shift | 214 | 0.00% | +2.15% | 0.050 |
| 4 | foreign-overnight-guests-prefecture-gap | 189 | 0.00% | +2.15% | 0.049 |
| 5 | child-height-regional-gap | 1,834 | 0.71% | +1.44% | 0.047 |
| 6 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B01%E4%BD%8D%E3%81%AF%E5%A4%A7%E5%88%86%E7%9C%8C47%E4%BD%8D%E3%81%AF%E5%B2%A9%E6%89%8B%E7%9C%8C | 145 | 0.00% | +2.15% | 0.047 |
| 7 | health-life-expectancy-structure#%E5%85%A8%E5%9B%BD%E3%83%9E%E3%83%83%E3%83%97 | 145 | 0.00% | +2.15% | 0.047 |
| 8 | health-life-expectancy-structure#%E5%81%A5%E5%BA%B7%E5%AF%BF%E5%91%BD%E3%81%AE%E6%8E%A8%E7%A7%BB9%E5%B9%B4%E3%81%A7%E7%94%B7%E6%80%A7226%E6%AD%B3%E3%81%97%E3%81%8B%E3%81%97%E4%B8%8D%E5%81%A5%E5%BA%B7%E6%9C%9F%E9%96%93%E3%81%AF%E7%B8%AE%E3%81%BE%E3%82%89%E3%81%AA%E3%81%84 | 144 | 0.00% | +2.15% | 0.047 |
| 9 | manufacturing-aichi-dominance | 1,112 | 0.63% | +1.52% | 0.046 |
| 10 | health-life-expectancy-structure#%E5%8C%BB%E5%B8%AB%E6%95%B0%E3%81%AE%E6%8E%A8%E7%A7%BB47%E5%B9%B4%E3%81%A726%E5%80%8D | 110 | 0.00% | +2.15% | 0.044 |
| 11 | agriculture-hokkaido-dominance | 97 | 0.00% | +2.15% | 0.043 |
| 12 | park-green-space-gap | 369 | 0.54% | +1.61% | 0.041 |
| 13 | fertility-rate-prefecture-gap | 357 | 0.56% | +1.59% | 0.041 |
| 14 | recycling-rate-gap | 69 | 0.00% | +2.15% | 0.040 |
| 15 | local-government-debt-burden#%E5%9C%B0%E6%96%B9%E5%82%B5%E7%8F%BE%E5%9C%A8%E9%AB%98%E5%89%B2%E5%90%88%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B02022%E5%B9%B4%E5%BA%A6 | 55 | 0.00% | +2.15% | 0.038 |
| 16 | sewerage-water-supply-gap | 51 | 0.00% | +2.15% | 0.037 |
| 17 | overnight-guests-inbound-recovery | 185 | 0.54% | +1.61% | 0.037 |
| 18 | local-government-debt-burden#%E5%9C%B0%E6%96%B9%E5%82%B5%E5%89%B2%E5%90%88%E3%81%A8%E5%B0%86%E6%9D%A5%E8%B2%A0%E6%8B%85%E6%AF%94%E7%8E%87%E3%81%AE%E9%96%A2%E4%BF%82 | 49 | 0.00% | +2.15% | 0.037 |
| 19 | pharmacy-count-prefecture-ranking | 49 | 0.00% | +2.15% | 0.037 |
| 20 | alcohol-prefecture-map | 45 | 0.00% | +2.15% | 0.036 |

## 次のステップ

```bash
# 上位記事から順に補強
/brushup-blog --target article consumer-price-regional-gap
/brushup-blog --target article dairy-cattle-hokkaido-monopoly
/brushup-blog --target article fishery-catch-aquaculture-shift
```

## 注記

- CTR 0.00% = 計測週中クリックゼロ（検索表示はされている）
- スコア式: `(avg_ctr - page_ctr) × log10(impressions + 1)`
- 自動更新: `.github/workflows/fetch-metrics-weekly.yml` (毎週日曜 JST 20:00)

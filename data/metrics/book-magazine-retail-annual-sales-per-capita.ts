import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const bookMagazineRetailAnnualSalesPerCapita: MetricConfig = {
  "key": "book-magazine-retail-annual-sales-per-capita",
  "title": "書籍・雑誌小売業年間商品販売額",
  "subtitle": "1人当たり",
  "unit": "円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G05102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1978,
      1981,
      1984,
      1987,
      1990,
      1993,
      1996,
      2001,
      2006,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "book-magazine-retail-annual-sales",
  "seoTitle": "書籍・雑誌小売業年間商品販売額ランキング都道府県【2006年】｜1位東京都（40,070円）",
  "seoDescription": "2006年の書籍・雑誌小売業年間商品販売額の都道府県別ランキング。1位東京都（40,070円）、最下位茨城県（9,748円）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

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
    "from": 2006,
    "to": 2006,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "book-magazine-retail-annual-sales",
  "seoTitle": "書籍・雑誌小売業年間商品販売額ランキング都道府県【2006年】｜1位東京都（40,070円）",
  "seoDescription": "2006年の書籍・雑誌小売業年間商品販売額の都道府県別ランキング。1位東京都（40,070円）、最下位茨城県（9,748円）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

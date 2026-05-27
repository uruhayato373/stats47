import type { MetricConfig } from "../types";

export const perTaxpayerIncome: MetricConfig = {
  "key": "per-taxpayer-income",
  "title": "納税義務者1人当たり課税所得",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020304",
    "cdCat01": "#D02206",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 1985,
    "to": 2023,
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
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "納税義務者1人当たり課税所得ランキング市区町村【2023年】｜1位東京都 港区（13,968千円）",
  "seoDescription": "2023年の納税義務者1人当たり課税所得の市区町村別ランキング。1位東京都 港区（13,968千円）、最下位熊本県 熊本市 北区（0千円）で地図やグラフで市区町村を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

import type { MetricConfig } from "../types";

export const crimeRatePer1k: MetricConfig = {
  "key": "crime-rate-per-1k",
  "title": "刑法犯認知件数（人口千人当たり）",
  "subtitle": "人口1000人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020311",
    "cdCat01": "#K06101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "件/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "刑法犯認知件数（人口千人当たり）ランキング市区町村【2005年】｜1位大阪府 大阪市 中央区（191.03件）",
  "seoDescription": "2005年の刑法犯認知件数（人口千人当たり）の市区町村別ランキング。1位大阪府 大阪市 中央区（191.03件）、最下位沖縄県 北大東村（0件）で地図やグラフで市区町村を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

import type { MetricConfig } from "../types";

export const marriagesPerTotalPopulation: MetricConfig = {
  "key": "marriages-per-total-population",
  "title": "婚姻率",
  "description": "1年間の婚姻件数を総人口で除し、人口千人当たりに換算した率です。",
  "unit": "人口千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A06601",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "‐/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "‐/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "婚姻率ランキング都道府県【2022年】｜1位東京都（5.36人口千対）",
  "seoDescription": "2022年の婚姻率（人口千対）の都道府県別ランキング。1位は東京都（5.36人口千対）、最下位は秋田県（2.63人口千対）で2.0倍の差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

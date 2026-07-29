import type { MetricConfig } from "../types";

export const agriculturalFarmCount: MetricConfig = {
  "key": "agricultural-farm-count",
  "title": "農家数",
  "unit": "戸",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
        "unit": "戸/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "戸/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "農家数ランキング都道府県【2019年】｜1位長野県（89,786戸）",
  "seoDescription": "2019年の農家数の都道府県別ランキング。1位長野県（89,786戸）、最下位東京都（9,567戸）で9.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

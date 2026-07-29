import type { MetricConfig } from "../types";

export const securitiesBalance: MetricConfig = {
  "key": "securities-balance",
  "title": "有価証券保有額",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L430104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2014,
    "to": 2014,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.001,
    "decimalPlaces": 0,
    "displayUnit": "万円",
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
  "groupKey": "household-finance",
  "seoTitle": "有価証券保有額ランキング都道府県【2014年】｜1位東京都（4,303千円）",
  "seoDescription": "2014年の有価証券保有額の都道府県別ランキング。1位東京都（4,303千円）、最下位鹿児島県（508千円）で8.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

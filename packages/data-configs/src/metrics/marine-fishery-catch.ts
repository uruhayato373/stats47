import type { MetricConfig } from "../types";

export const marineFisheryCatch: MetricConfig = {
  "key": "marine-fishery-catch",
  "title": "海面漁業漁獲量",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C312101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
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
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "fishery",
  "seoTitle": "海面漁業漁獲量ランキング都道府県【2023年】｜1位北海道（842,704トン）",
  "seoDescription": "2023年の海面漁業漁獲量の都道府県別ランキング。1位北海道（842,704トン）、最下位奈良県（0トン）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

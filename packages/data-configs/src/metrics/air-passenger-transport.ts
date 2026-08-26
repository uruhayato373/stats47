import type { MetricConfig } from "../types";

export const airPassengerTransport: MetricConfig = {
  "key": "air-passenger-transport",
  "title": "航空輸送人員",
  "unit": "千人",
  "category": "tourism",
  "description": "旅客地域流動調査で集計された、定期国内航空便による年間の旅客輸送人員。",
  "note": "国内旅客だけを対象とし、大阪国際空港の輸送人員は大阪府に帰属させている。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3706",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "航空輸送人員ランキング都道府県【2023年】｜1位東京都（30,475.3千人）",
  "seoDescription": "2023年の航空輸送人員の都道府県別ランキング。1位東京都（30,475.3千人）、最下位奈良県（0千人）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

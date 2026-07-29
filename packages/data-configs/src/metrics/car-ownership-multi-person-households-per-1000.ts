import type { MetricConfig } from "../types";

export const carOwnershipMultiPersonHouseholdsPer1000: MetricConfig = {
  "key": "car-ownership-multi-person-households-per-1000",
  "title": "自動車所有数量",
  "unit": "台",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L03607",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "自動車所有数量ランキング都道府県【2014年】｜1位山形県（2,111台）",
  "seoDescription": "2014年の自動車所有数量の都道府県別ランキング。1位山形県（2,111台）、最下位東京都（665台）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

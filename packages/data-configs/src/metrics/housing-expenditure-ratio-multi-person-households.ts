import type { MetricConfig } from "../types";

export const housingExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "housing-expenditure-ratio-multi-person-households",
  "title": "住居費割合",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02412",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2000,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "住居費割合ランキング都道府県【2024年】｜1位宮城県（10.5％）",
  "seoDescription": "2024年の住居費割合の都道府県別ランキング。1位宮城県（10.5％）、最下位佐賀県（3.7％）で2.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

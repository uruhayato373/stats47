import type { MetricConfig } from "../types";

export const totalFarmHouseholdIncome: MetricConfig = {
  "key": "total-farm-household-income",
  "title": "農家総所得",
  "unit": "千円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L01100",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1995,
    "to": 2003,
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
  "seoTitle": "農家総所得ランキング都道府県【2003年】｜1位大阪府（12,836千円）",
  "seoDescription": "2003年の農家総所得の都道府県別ランキング。1位大阪府（12,836千円）、最下位沖縄県（4,457千円）で2.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

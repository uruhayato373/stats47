import type { MetricConfig } from "../types";

export const longTermCareMedicalFacilityCountPer100k65plus: MetricConfig = {
  "key": "long-term-care-medical-facility-count-per-100k-65plus",
  "title": "介護療養型医療施設数",
  "unit": "所",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0910206",
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
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "介護療養型医療施設数ランキング都道府県【2023年】｜1位香川県（2.7所）",
  "seoDescription": "2023年の介護療養型医療施設数の都道府県別ランキング。1位香川県（2.7所）、最下位島根県（0所）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

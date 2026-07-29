import type { MetricConfig } from "../types";

export const fireDepartmentDispatchCountPer100ThousandPeople: MetricConfig = {
  "key": "fire-department-dispatch-count-per-100-thousand-people",
  "title": "消防機関出動回数",
  "unit": "回",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K01401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2021,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
        "unit": "回/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "回/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "消防機関出動回数ランキング都道府県【2021年】｜1位島根県（4,401.5回）",
  "seoDescription": "2021年の消防機関出動回数の都道府県別ランキング。1位島根県（4,401.5回）、最下位沖縄県（1,070.2回）で4.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

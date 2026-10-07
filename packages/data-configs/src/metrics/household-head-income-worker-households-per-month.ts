import type { MetricConfig } from "../types";

export const householdHeadIncomeWorkerHouseholdsPerMonth: MetricConfig = {
  "key": "household-head-income-worker-households-per-month",
  "title": "世帯主収入",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L01204",
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
    "decimalPlaces": 1,
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
  "seoTitle": "世帯主収入ランキング都道府県【2024年】｜1位埼玉県（605.2千円）",
  "seoDescription": "2024年の世帯主収入の都道府県別ランキング。1位埼玉県（605.2千円）、最下位沖縄県（344.7千円）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

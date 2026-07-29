import type { MetricConfig } from "../types";

export const householdHeadAnnualIncomePerHousehold: MetricConfig = {
  "key": "household-head-annual-income-per-household",
  "title": "年間世帯主収入",
  "unit": "千円",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L07602",
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
  "seoTitle": "年間世帯主収入ランキング都道府県【2019年】｜1位神奈川県（3,631千円）",
  "seoDescription": "2019年の年間世帯主収入の都道府県別ランキング。1位神奈川県（3,631千円）、最下位高知県（1,891千円）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const avgDailyOutpatientsPsychiatricHospitalPer100k: MetricConfig = {
  "key": "avg-daily-outpatients-psychiatric-hospital-per-100k",
  "title": "精神科病院の1日平均外来患者数",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0420103",
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "精神科病院の1日平均外来患者数ランキング都道府県【2023年】｜1位熊本県（105.4人）",
  "seoDescription": "2023年の精神科病院の1日平均外来患者数の都道府県別ランキング。1位熊本県（105.4人）、最下位奈良県（11.1人）で9.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const averageWeightPrimarySchoolFifthGradeMale: MetricConfig = {
  "key": "average-weight-primary-school-fifth-grade-male",
  "title": "平均体重",
  "subtitle": "小学5年・男子",
  "unit": "kg",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0210201",
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
        "unit": "kg/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "kg/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "平均体重ランキング都道府県【2023年】｜1位青森県（37.5kg）",
  "seoDescription": "2023年の平均体重の都道府県別ランキング。1位青森県（37.5kg）、最下位京都府（34kg）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

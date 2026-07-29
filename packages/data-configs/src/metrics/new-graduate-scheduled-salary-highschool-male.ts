import type { MetricConfig } from "../types";

export const newGraduateScheduledSalaryHighschoolMale: MetricConfig = {
  "key": "new-graduate-scheduled-salary-highschool-male",
  "title": "新規学卒者所定内給与額",
  "subtitle": "高卒・男性",
  "unit": "千円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0620307",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
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
  "seoTitle": "新規学卒者所定内給与額ランキング都道府県【2024年】｜1位大阪府（213.9千円）",
  "seoDescription": "2024年の新規学卒者所定内給与額の都道府県別ランキング。1位大阪府（213.9千円）、最下位沖縄県（170千円）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

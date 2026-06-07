import type { MetricConfig } from "../types";

export const newGraduateScheduledSalaryUniversityFemale: MetricConfig = {
  "key": "new-graduate-scheduled-salary-university-female",
  "title": "新規学卒者所定内給与額",
  "subtitle": "大卒・女性",
  "unit": "千円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0620312",
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
  "seoTitle": "新規学卒者所定内給与額ランキング都道府県【2024年】｜1位滋賀県（267.9千円）",
  "seoDescription": "2024年の新規学卒者所定内給与額の都道府県別ランキング。1位滋賀県（267.9千円）、最下位徳島県（211.6千円）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

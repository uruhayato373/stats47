import type { MetricConfig } from "../types";

export const compulsoryEducationSchoolCountPer100k614: MetricConfig = {
  "key": "compulsory-education-school-count-per-100k-6-14",
  "title": "義務教育学校数",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0110107",
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
        "unit": "校/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "校/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "義務教育学校数ランキング都道府県【2024年】｜1位鳥取県（13.9校）",
  "seoDescription": "2024年の義務教育学校数の都道府県別ランキング。1位鳥取県（13.9校）、最下位沖縄県（0校）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

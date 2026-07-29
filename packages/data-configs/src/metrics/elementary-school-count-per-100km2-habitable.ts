import type { MetricConfig } from "../types";

export const elementarySchoolCountPer100km2Habitable: MetricConfig = {
  "key": "elementary-school-count-per-100km2-habitable",
  "title": "小学校数",
  "subtitle": "可住地100km²当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0110201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
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
    "decimalPlaces": 2,
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
  "groupKey": "elementary-school-count",
  "seoTitle": "小学校数ランキング都道府県【2024年】｜1位東京都（92.39校）",
  "seoDescription": "2024年の小学校数の都道府県別ランキング。1位東京都（92.39校）、最下位北海道（4.12校）で22.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

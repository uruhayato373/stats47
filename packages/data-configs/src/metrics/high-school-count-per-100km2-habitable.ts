import type { MetricConfig } from "../types";

export const highSchoolCountPer100km2Habitable: MetricConfig = {
  "key": "high-school-count-per-100km2-habitable",
  "title": "高等学校数",
  "subtitle": "可住地100km²当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0110203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": {
    "from": 1978,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "high-school-count",
  "seoTitle": "高等学校数ランキング都道府県【2024年】｜1位東京都（30.03校）",
  "seoDescription": "2024年の高等学校数の都道府県別ランキング。1位東京都（30.03校）、最下位北海道（1.19校）で25.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

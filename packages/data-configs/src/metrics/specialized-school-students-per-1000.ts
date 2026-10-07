import type { MetricConfig } from "../types";

export const specializedSchoolStudentsPer1000: MetricConfig = {
  "key": "specialized-school-students-per-1000",
  "title": "専修学校生徒数",
  "subtitle": "人口1000人当たり",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E08201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
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
  "groupKey": "specialized-school-students",
  "seoTitle": "専修学校生徒数ランキング都道府県【2024年】｜1位東京都（9.04人）",
  "seoDescription": "2024年の専修学校生徒数の都道府県別ランキング。1位東京都（9.04人）、最下位滋賀県（1.1人）で8.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

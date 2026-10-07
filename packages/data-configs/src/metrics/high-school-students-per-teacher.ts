import type { MetricConfig } from "../types";

export const highSchoolStudentsPerTeacher: MetricConfig = {
  "key": "high-school-students-per-teacher",
  "title": "高等学校生徒数",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0510303",
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
  "seoTitle": "高等学校生徒数ランキング都道府県【2024年】｜1位東京都（15.65人）",
  "seoDescription": "2024年の高等学校生徒数の都道府県別ランキング。1位東京都（15.65人）、最下位高知県（8.56人）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

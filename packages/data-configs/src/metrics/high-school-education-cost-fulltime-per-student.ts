import type { MetricConfig } from "../types";

export const highSchoolEducationCostFulltimePerStudent: MetricConfig = {
  "key": "high-school-education-cost-fulltime-per-student",
  "title": "高等学校教育費",
  "unit": "円",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E10104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1983,
      1984,
      1985,
      1986,
      1987,
      1988,
      1989,
      1990,
      1991,
      1992,
      1993,
      2022,
    ],
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
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "高等学校教育費ランキング都道府県【2022年】｜1位高知県（1,907,930円）",
  "seoDescription": "2022年の高等学校教育費の都道府県別ランキング。1位高知県（1,907,930円）、最下位千葉県（1,040,309円）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

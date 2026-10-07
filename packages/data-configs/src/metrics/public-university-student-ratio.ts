import type { MetricConfig } from "../types";

export const publicUniversityStudentRatio: MetricConfig = {
  "key": "public-university-student-ratio",
  "title": "公立大学学生数割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0620402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1983,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
        1982,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
  },
  "seoTitle": "公立大学学生数割合ランキング都道府県【2024年】｜1位高知県（39.8％）",
  "seoDescription": "2024年の公立大学学生数割合の都道府県別ランキング。1位高知県（39.8％）、最下位鹿児島県（0％）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

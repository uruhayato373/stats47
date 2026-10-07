import type { MetricConfig } from "../types";

export const publicHighSchoolStudentRatio: MetricConfig = {
  "key": "public-high-school-student-ratio",
  "title": "公立高等学校生徒比率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E05203",
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
  "seoTitle": "公立高等学校生徒比率ランキング都道府県【2024年】｜1位徳島県（95.8％）",
  "seoDescription": "2024年の公立高等学校生徒比率の都道府県別ランキング。1位徳島県（95.8％）、最下位東京都（41.5％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

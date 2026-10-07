import type { MetricConfig } from "../types";

export const universityNewGraduatesUnemploymentRate: MetricConfig = {
  "key": "university-new-graduates-unemployment-rate",
  "title": "大学新規卒業者の無業者率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1992,
    "to": 2023,
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
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
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
  "seoTitle": "大学新規卒業者の無業者率ランキング都道府県【2023年】｜1位沖縄県（20.7％）",
  "seoDescription": "2023年の大学新規卒業者の無業者率の都道府県別ランキング。1位沖縄県（20.7％）、最下位福井県（3.3％）で6.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

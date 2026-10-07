import type { MetricConfig } from "../types";

export const psychiatricHospitalCountPer100k: MetricConfig = {
  "key": "psychiatric-hospital-count-per-100k",
  "title": "精神科病院数",
  "subtitle": "人口10万人当たり",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0910107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1986,
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "groupKey": "psychiatric-hospital-count",
  "seoTitle": "精神科病院数ランキング都道府県【2023年】｜1位鹿児島県（2.5施設）",
  "seoDescription": "2023年の精神科病院数の都道府県別ランキング。1位鹿児島県（2.5施設）、最下位奈良県（0.3施設）で8.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

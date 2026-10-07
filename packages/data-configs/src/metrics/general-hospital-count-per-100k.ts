import type { MetricConfig } from "../types";

export const generalHospitalCountPer100k: MetricConfig = {
  "key": "general-hospital-count-per-100k",
  "title": "一般病院数",
  "subtitle": "人口10万人当たり",
  "description": "医療施設調査で一般病院に区分された施設数を、総人口で除して人口10万人当たりに換算した値です。",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I0910103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": {
    "from": 1980,
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
  "groupKey": "general-hospital-count",
  "seoTitle": "一般病院数ランキング都道府県【2023年】｜1位高知県（16.1施設）",
  "seoDescription": "2023年の一般病院数の都道府県別ランキング。1位高知県（16.1施設）、最下位神奈川県（3.1施設）で5.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

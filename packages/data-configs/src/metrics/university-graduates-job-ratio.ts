import type { MetricConfig } from "../types";

export const universityGraduatesJobRatio: MetricConfig = {
  "key": "university-graduates-job-ratio",
  "title": "大学卒業者に占める就職者の割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
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
  "seoTitle": "大学卒業者に占める就職者の割合ランキング都道府県【2023年】｜1位埼玉県（81.4％）",
  "seoDescription": "2023年の大学卒業者に占める就職者の割合の都道府県別ランキング。1位埼玉県（81.4％）、最下位鳥取県（61.4％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

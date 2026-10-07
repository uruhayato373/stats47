import type { MetricConfig } from "../types";

export const healthcareExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "healthcare-expenditure-ratio-multi-person-households",
  "title": "保健医療費割合",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02416",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        2000,
        2001,
        2002,
        2003,
        2004,
        2005,
        2006,
        2007,
        2008,
        2009,
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
  "seoTitle": "保健医療費割合ランキング都道府県【2024年】｜1位神奈川県（5.8％）",
  "seoDescription": "2024年の保健医療費割合の都道府県別ランキング。1位神奈川県（5.8％）、最下位高知県（3.8％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

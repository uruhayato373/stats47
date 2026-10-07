import type { MetricConfig } from "../types";

export const publicKindergartenStudentRatio: MetricConfig = {
  "key": "public-kindergarten-student-ratio",
  "title": "公立幼稚園在園者比率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E05204",
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "公立幼稚園在園者比率ランキング都道府県【2024年】｜1位島根県（81.9％）",
  "seoDescription": "2024年の公立幼稚園在園者比率の都道府県別ランキング。1位島根県（81.9％）、最下位石川県（0％）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};

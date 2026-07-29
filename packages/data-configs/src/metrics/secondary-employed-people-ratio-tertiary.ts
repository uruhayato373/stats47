import type { MetricConfig } from "../types";

export const secondaryEmployedPeopleRatioTertiary: MetricConfig = {
  "key": "secondary-employed-people-ratio-tertiary",
  "title": "第2次・第3次産業就業者比率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F01204",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2015,
      2020,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "第2次・第3次産業就業者比率ランキング都道府県【2020年】｜1位神奈川県（96％）",
  "seoDescription": "2020年の第2次・第3次産業就業者比率の都道府県別ランキング。1位神奈川県（96％）、最下位高知県（86.7％）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

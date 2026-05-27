import type { MetricConfig } from "../types";

export const gdpGrowthRatePrefH17: MetricConfig = {
  "key": "gdp-growth-rate-pref-h17",
  "title": "県内総生産額対前年増加率",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2004,
    "to": 2014,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "県内総生産額対前年増加率ランキング都道府県【2014年】｜1位広島県（4.1％）",
  "seoDescription": "2014年の県内総生産額対前年増加率の都道府県別ランキング。1位広島県（4.1％）、最下位長崎県（-1.3％）で-3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

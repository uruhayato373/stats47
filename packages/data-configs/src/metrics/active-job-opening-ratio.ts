import type { MetricConfig } from "../types";

export const activeJobOpeningRatio: MetricConfig = {
  "key": "active-job-opening-ratio",
  "title": "有効求人倍率",
  "unit": "倍",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 1,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "有効求人倍率ランキング都道府県【2022年】｜1位福井県（1.94倍）",
  "seoDescription": "2022年の有効求人倍率の都道府県別ランキング。1位福井県（1.94倍）、最下位神奈川県（0.88倍）で2.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

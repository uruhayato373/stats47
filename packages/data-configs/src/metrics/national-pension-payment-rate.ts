import type { MetricConfig } from "../types";

export const nationalPensionPaymentRate: MetricConfig = {
  "key": "national-pension-payment-rate",
  "title": "国民年金保険料納付率",
  "unit": "%",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdCat01": "J520120",
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
  "groupKey": "pension-payment",
  "seoTitle": "国民年金保険料納付率ランキング都道府県【2022年】｜1位島根県（86.8%）",
  "seoDescription": "2022年の国民年金保険料納付率の都道府県別ランキング。1位島根県（86.8%）、最下位大阪府（69.2%）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

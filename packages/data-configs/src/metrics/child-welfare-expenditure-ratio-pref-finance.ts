import type { MetricConfig } from "../types";

export const childWelfareExpenditureRatioPrefFinance: MetricConfig = {
  "key": "child-welfare-expenditure-ratio-pref-finance",
  "title": "児童福祉費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0310601",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "児童福祉費割合ランキング都道府県【2022年】｜1位神奈川県（5.33％）",
  "seoDescription": "2022年の児童福祉費割合の都道府県別ランキング。1位神奈川県（5.33％）、最下位長野県（1.98％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

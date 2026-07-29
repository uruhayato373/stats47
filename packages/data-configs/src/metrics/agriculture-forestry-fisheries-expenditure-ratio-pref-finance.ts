import type { MetricConfig } from "../types";

export const agricultureForestryFisheriesExpenditureRatioPrefFinance: MetricConfig = {
  "key": "agriculture-forestry-fisheries-expenditure-ratio-pref-finance",
  "title": "農林水産業費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0311001",
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
    "colorScheme": "interpolateGreens",
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
  "seoTitle": "農林水産業費割合ランキング都道府県【2022年】｜1位秋田県（10.8％）",
  "seoDescription": "2022年の農林水産業費割合の都道府県別ランキング。1位秋田県（10.8％）、最下位東京都（0.29％）で37.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

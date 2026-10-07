import type { MetricConfig } from "../types";

export const standardPriceChangeRateResidential: MetricConfig = {
  "key": "standard-price-change-rate-residential",
  "title": "標準価格対前年平均変動率",
  "subtitle": "住宅地",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "標準価格対前年平均変動率ランキング都道府県【2024年】｜1位沖縄県（5.8％）",
  "seoDescription": "2024年の標準価格対前年平均変動率の都道府県別ランキング。1位沖縄県（5.8％）、最下位愛媛県（-1.2％）で-4.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

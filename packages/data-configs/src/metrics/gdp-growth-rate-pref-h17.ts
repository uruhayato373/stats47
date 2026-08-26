import type { MetricConfig } from "../types";

export const gdpGrowthRatePrefH17: MetricConfig = {
  "key": "gdp-growth-rate-pref-h17",
  "title": "県内総生産額対前年増加率",
  "subtitle": "H17年基準",
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
  "seoTitle": "県内総生産額対前年増加率 都道府県ランキング【2014年】｜1位宮城県（4.1％）",
  "seoDescription": "2014年の県内総生産額対前年増加率を都道府県別に比較。1位は宮城県（4.1％）、最下位は長崎県（-1.3％）。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

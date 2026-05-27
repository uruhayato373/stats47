import type { MetricConfig } from "../types";

export const otherConsumptionExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "other-consumption-expenditure-ratio-multi-person-households",
  "title": "その他の消費支出割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02420",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2013,
      2024,
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
  "seoTitle": "その他の消費支出割合ランキング都道府県【2024年】｜1位長崎県（22.5％）",
  "seoDescription": "2024年のその他の消費支出割合の都道府県別ランキング。1位長崎県（22.5％）、最下位北海道（15.8％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

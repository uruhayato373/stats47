import type { MetricConfig } from "../types";

export const perCapitaSocialWelfareExpenditurePrefMunicipal: MetricConfig = {
  "key": "per-capita-social-welfare-expenditure-pref-municipal",
  "title": "社会福祉費",
  "subtitle": "都道府県・市町村財政合計",
  "unit": "千円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0330303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1979,
      1980,
      1981,
      1982,
      1983,
      1984,
      1985,
      1986,
      1987,
      1988,
      1989,
      1990,
      2022,
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
  "groupKey": "social-welfare-expenses-prefecture",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};

import type { MetricConfig } from "../types";

export const perCapitaPublicAssistanceExpenditureProtectedPrefMunicipal: MetricConfig = {
  "key": "per-capita-public-assistance-expenditure-protected-pref-municipal",
  "title": "生活保護費",
  "subtitle": "都道府県・市町村財政合計",
  "unit": "千円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0330603",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
      2014,
      2015,
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
  "groupKey": "public-assistance-expenses-prefecture",
  "seoTitle": "被保護実人員1人当たり生活保護費",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};

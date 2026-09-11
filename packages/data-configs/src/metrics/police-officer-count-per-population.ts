import type { MetricConfig } from "../types";

export const policeOfficerCountPerPopulation: MetricConfig = {
  "key": "police-officer-count-per-population",
  "title": "警察官数",
  "subtitle": "人口千人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "description": "警察官数を総人口で除し、人口千人当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K05103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "groupKey": "police-officer-count",
  "seoTitle": "警察官数（人口千人当たり）ランキング都道府県",
  "seoDescription": "人口千人当たりの警察官数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};

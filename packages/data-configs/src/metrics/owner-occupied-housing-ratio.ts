import type { MetricConfig } from "../types";

export const ownerOccupiedHousingRatio: MetricConfig = {
  "key": "owner-occupied-housing-ratio",
  "title": "持ち家比率",
  "description": "そこに居住する世帯が全部または一部を所有する持ち家数を、居住世帯のある住宅数で割り、100倍した値。",
  "note": "持ち家は登記の有無を問わず、分割払いが完了していない分譲住宅も含む。空き家など居住世帯のない住宅は分母に含まれない。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H01301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
      2013,
      2018,
      2023,
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
  "seoTitle": "持ち家比率ランキング都道府県【2023年】｜1位秋田県（77.1％）",
  "seoDescription": "2023年の持ち家比率の都道府県別ランキング。1位秋田県（77.1％）、最下位沖縄県（42.6％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const unemploymentRate: MetricConfig = {
  "key": "unemployment-rate",
  "title": "完全失業率",
  "subtitle": "総数",
  "description": "国勢調査の完全失業者数を、就業者と完全失業者を合わせた労働力人口で割り、100倍した値。",
  "note": "完全失業者は調査週間に収入を伴う仕事をせず、就業可能で、積極的に仕事を探していた人。ふだんの就業・不就業状態ではなく調査週間の状態を表す。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F01301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2000,
      2005,
      2010,
      2015,
      2020,
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
  "seoTitle": "完全失業率ランキング都道府県【2020年】｜1位沖縄県（5.5％）",
  "seoDescription": "2020年の完全失業率の都道府県別ランキング。1位沖縄県（5.5％）、最下位島根県（2.7％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

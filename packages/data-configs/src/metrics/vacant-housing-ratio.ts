import type { MetricConfig } from "../types";

export const vacantHousingRatio: MetricConfig = {
  "key": "vacant-housing-ratio",
  "title": "空き家比率",
  "description": "住宅・土地統計調査の空き家数を総住宅数で割り、100倍した値。空き家には二次的住宅、賃貸用・売却用住宅、その他の人が住んでいない住宅を含む。",
  "note": "別荘など一時的に使用する住宅も空き家に含むため、管理不全・放置住宅だけの割合ではない。",
  "unit": "％",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H01405",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
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
  "seoTitle": "空き家比率ランキング都道府県【2023年】｜1位徳島県（21.3％）",
  "seoDescription": "2023年の空き家比率の都道府県別ランキング。1位徳島県（21.3％）、最下位埼玉県（9.3％）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

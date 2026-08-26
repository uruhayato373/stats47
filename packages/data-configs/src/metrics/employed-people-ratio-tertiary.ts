import type { MetricConfig } from "../types";

export const employedPeopleRatioTertiary: MetricConfig = {
  "key": "employed-people-ratio-tertiary",
  "title": "第3次産業就業者比率",
  "description": "国勢調査の就業者数に占める、第1次・第2次産業と分類不能を除く、サービス業や公務などの産業で働く就業者数の割合。",
  "note": "産業は調査週間に実際に働いた主な事業所で分類する。産業分類不能の就業者は分子に含まれないため、第1〜3次産業比率の合計が必ずしも100％にはならない。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F01203",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1975,
      1980,
      1985,
      1990,
      1995,
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
  "seoTitle": "第3次産業就業者比率ランキング都道府県【2020年】｜1位東京都（81.1％）",
  "seoDescription": "2020年の第3次産業就業者比率の都道府県別ランキング。1位東京都（81.1％）、最下位長野県（61.3％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

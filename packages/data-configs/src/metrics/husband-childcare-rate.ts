import type { MetricConfig } from "../types";

export const husbandChildcareRate: MetricConfig = {
  "key": "husband-childcare-rate",
  "title": "夫の育児参加率",
  "subtitle": "6歳未満の子がいる世帯で夫が育児をしている割合",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0004008627",
    "cdCat01": "0",
    "cdCat03": "0",
    "cdCat04": "0",
    "cdCat05": "0",
    "axisRatio": {
      "axis": "cat02",
      "numeratorCodes": ["1"],
      "denominatorCodes": ["0"],
    },
    "displayName": "就業構造基本調査",
    "url": "https://www.stat.go.jp/data/shugyou/2022/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "夫の育児参加率ランキング都道府県【2022年】｜1位茨城県（97.6％）",
  "seoDescription": "2022年の夫の育児参加率の都道府県別ランキング。1位茨城県（97.6％）、最下位三重県（91％）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

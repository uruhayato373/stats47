import type { MetricConfig } from "../types";

export const houseworkAvgTimeFemale: MetricConfig = {
  "key": "housework-avg-time-female",
  "title": "家事の平均時間",
  "subtitle": "女性・15歳以上の1日平均",
  "description": "社会生活基本調査による、15歳以上の女性の家事の総平均時間です。家事を行わなかった人も含む一週全体の1日当たり平均で、夫婦に限定した値ではありません。",
  "unit": "分",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010113",
    "cdCat01": "M240200",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1976,
      1981,
      1986,
      1991,
      1996,
      2001,
      2006,
      2011,
      2016,
      2021,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};

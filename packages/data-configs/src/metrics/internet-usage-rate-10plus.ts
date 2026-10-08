import type { MetricConfig } from "../types";

/**
 * 社会・人口統計体系 G7000 (社会生活基本調査のインターネットの利用行動者率)。
 * 表 0000010107 の調査年 (5年おき) のうち値がある年だけが配信される。取り込み後に availableYearCodes で年を確定する。
 */
export const internetUsageRate10plus: MetricConfig = {
  "key": "internet-usage-rate-10plus",
  "title": "インターネットの利用行動者率",
  "subtitle": "10歳以上",
  "description": "社会生活基本調査で、過去1年間にインターネットを利用した10歳以上人口の割合(行動者率)。男女計。",
  "note": "調査は5年おきで、都道府県別に値がある年だけを載せる。利用の頻度や時間は含まず、利用した人の割合を示す。",
  "unit": "％",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G7000",
    "displayName": "社会・人口統計体系（社会生活基本調査）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2001,
    "to": 2006,
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
  "isActive": true,
};

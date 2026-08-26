import type { MetricConfig } from "../types";

export const jobChangeRate: MetricConfig = {
  "key": "job-change-rate",
  "title": "転職率",
  "description": "1年前の勤め先と現在の勤め先が異なる転職者数を、現在の有業者数で割り、100倍した値。",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F04101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "転職率 都道府県ランキング【2022年】｜1位東京都（5.4％）",
  "seoDescription": "2022年の転職率を都道府県別に比較。1位は東京都（5.4％）、最下位は愛媛県（3.3％）、最大と最小の差は1.6倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

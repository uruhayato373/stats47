import type { MetricConfig } from "../types";

export const middleAgedEmploymentRate45plus: MetricConfig = {
  "key": "middle-aged-employment-rate-45plus",
  "title": "中高年齢者就職率",
  "unit": "％",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F0350101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2018,
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
  "seoTitle": "中高年齢者就職率 都道府県ランキング【2018年】｜1位福井県（10.9％）",
  "seoDescription": "2018年の中高年齢者就職率を都道府県別に比較。1位は福井県（10.9％）、最下位は神奈川県（4.3％）、最大と最小の差は2.5倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

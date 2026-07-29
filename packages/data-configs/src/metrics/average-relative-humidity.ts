import type { MetricConfig } from "../types";

export const averageRelativeHumidity: MetricConfig = {
  "key": "average-relative-humidity",
  "title": "年平均相対湿度",
  "unit": "％",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4111",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
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
  "seoTitle": "年平均相対湿度ランキング都道府県【2024年】｜1位山口県（77％）",
  "seoDescription": "2024年の年平均相対湿度の都道府県別ランキング。1位山口県（77％）、最下位広島県（62％）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

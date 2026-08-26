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
  "seoTitle": "年平均相対湿度 都道府県ランキング【2024年】｜1位青森県（77％）",
  "seoDescription": "2024年の年平均相対湿度を都道府県別に比較。1位は青森県（77％）、最下位は広島県（62％）、最大と最小の差は1.2倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

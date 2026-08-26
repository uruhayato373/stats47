import type { MetricConfig } from "../types";

export const convenienceStoreSalesMonthly: MetricConfig = {
  "key": "convenience-store-sales-monthly",
  "title": "コンビニエンスストア販売額（都道府県別・年計）",
  "subtitle": "月次",
  "unit": "百万円",
  "seoTitle": "コンビニエンスストア販売額（都道府県別・年計） 都道府県ランキング【2024年】｜1位東京都（1,896,372.0百万円）",
  "seoDescription": "2024年のコンビニエンスストア販売額（都道府県別・年計）を都道府県別に比較。1位は東京都（1,896,372.0百万円）、最下位は鳥取県（48,922.0百万円）、最大と最小の差は38.8倍です。地図やグラフで47都道府県の違いを確認できます。",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032502",
    "cdCat01": "0101300",
    "cdCat02": "01040100",
    "cdCat03": "01030100",
    "timeScope": "annual",
    "displayName": "コンビニエンスストア販売額（都道府県別・年計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004032502",
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
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};

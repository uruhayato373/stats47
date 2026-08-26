import type { MetricConfig } from "../types";

export const retailSalesAmountByPrefecture: MetricConfig = {
  "key": "retail-sales-amount-by-prefecture",
  "title": "小売業年間商品販売額（経済センサス活動調査）",
  "unit": "百万円",
  "seoTitle": "小売業年間商品販売額（経済センサス活動調査） 都道府県ランキング【2021年】｜1位東京都（19,249,055.0百万円）",
  "seoDescription": "2021年の小売業年間商品販売額（経済センサス活動調査）を都道府県別に比較。1位は東京都（19,249,055.0百万円）、最下位は鳥取県（580,513.0百万円）、最大と最小の差は33.2倍です。地図やグラフで47都道府県の違いを確認できます。",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004003259",
    "cdCat01": "I2",
    "cdCat02": "0",
    "cdCat03": "0",
    "cdTab": "703-2021",
    "displayName": "小売業年間商品販売額（経済センサス活動調査2021）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004003259",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2021,
    "to": 2021,
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

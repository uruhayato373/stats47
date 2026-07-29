import type { MetricConfig } from "../types";

export const convenienceStoreSalesMonthly: MetricConfig = {
  "key": "convenience-store-sales-monthly",
  "title": "コンビニエンスストア販売額（都道府県別・年計）",
  "subtitle": "月次",
  "unit": "百万円",
  "seoTitle": "コンビニ販売額ランキング都道府県｜東京は鳥取の39倍【2024】",
  "seoDescription": "コンビニの販売額は都道府県で39倍の差があります──1位東京都約1.9兆円、最下位鳥取県489億円。人口と店舗密度が生む商圏の差、47都道府県の分布を2024年データで比較します。",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0004032502",
    "cdCat01": "0101300",
    "cdCat02": "01040100",
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

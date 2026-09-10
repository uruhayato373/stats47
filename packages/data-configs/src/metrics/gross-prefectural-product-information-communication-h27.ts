import type { MetricConfig } from "../types";

export const grossPrefecturalProductInformationCommunicationH27: MetricConfig = {
  "key": "gross-prefectural-product-information-communication-h27",
  "title": "情報通信業の県内総生産額",
  "description": "情報通信業の県内総生産額を都道府県別に比較する。",
  "note": "2015年基準・名目県内総生産。情報通信業の生産額から中間投入を除いた付加価値。年度計であり企業売上高ではない。2021年6月1日の事業所従業者数で割算して生産性を作らない。採用窓は原典で47県を確認した2011〜2021年度。",
  "unit": "百万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C1122122",
    "displayName": "社会・人口統計体系（県民経済計算）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0000010103"
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2011,
    "to": 2021
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "県内総生産額（情報通信業）（平成27年基準）",
  "isActive": true,
};

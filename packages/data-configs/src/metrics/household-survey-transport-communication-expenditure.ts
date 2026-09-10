import type { MetricConfig } from '../types';

export const householdSurveyTransportCommunicationExpenditure: MetricConfig = {
  "key": "household-survey-transport-communication-expenditure",
  "title": "交通・通信支出",
  "subtitle": "都道府県全域・二人以上世帯・10〜11月の月平均",
  "description": "全国家計構造調査の二人以上の世帯について、「交通・通信支出」の10月と11月の2か月を平均した1世帯当たり月平均額です。都道府県全域を対象とし、用途分類を使用します。",
  "note": "通年の月平均、単身世帯、県庁所在市だけの家計調査とは異なります。2019年と2024年は別の標本調査であり、同じ世帯を追跡した値ではありません。",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L720107",
    "displayName": "社会・人口統計体系（原典：全国家計構造調査）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/L"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "years": [
      2019,
      2024
    ]
  },
  "yearFormat": "calendar",
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true
};

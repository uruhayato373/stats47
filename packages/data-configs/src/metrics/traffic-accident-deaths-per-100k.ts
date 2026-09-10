import type { MetricConfig } from "../types";

export const trafficAccidentDeathsPer100k: MetricConfig = {
  "key": "traffic-accident-deaths-per-100k",
  "title": "交通事故死者数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "description": "交通事故統計の交通事故死者数を総人口で除し、人口10万人当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04106",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "groupKey": "traffic-accident-deaths-per-100-accidents",
  "seoTitle": "交通事故死者数（人口10万人当たり）ランキング都道府県",
  "seoDescription": "人口10万人当たりの交通事故死者数を都道府県別に比較。総数とは区別し、人口規模を揃えて地域差と経年変化を地図やグラフで確認できます。",
  "isActive": true,
};

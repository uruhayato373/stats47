import type { MetricConfig } from "../types";

export const averageRoadTrafficVolume: MetricConfig = {
  "key": "average-road-traffic-volume",
  "title": "道路平均交通量",
  "unit": "台/12h",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06413",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2020,
    "to": 2020
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
    "displayUnit": "台"
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "道路平均交通量ランキング都道府県【2020年】｜1位大阪府（16,472台/12h）",
  "seoDescription": "2020年の道路平均交通量の都道府県別ランキング。1位大阪府（16,472台/12h）、最下位島根県（2,724台/12h）で6.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "subtitle": "昼間12時間の平均交通量"
};

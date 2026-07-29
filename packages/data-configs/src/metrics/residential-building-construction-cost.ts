import type { MetricConfig } from "../types";

export const residentialBuildingConstructionCost: MetricConfig = {
  "key": "residential-building-construction-cost",
  "title": "着工居住用建築物工事費予定額",
  "subtitle": "総額",
  "unit": "万円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H4320",
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
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "億円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "residential-building-construction-cost",
  "seoTitle": "着工居住用建築物工事費予定額ランキング都道府県【2024】東京 vs 高知で66倍の住宅投資格差",
  "seoDescription": "新築住宅にいくら投じられているか?──1位東京(約3.3兆円)、最下位高知(約499億円)で66倍の格差。住宅投資の一極集中を2024年ランキングで可視化、47都道府県を地図とグラフで比較。",
  "isActive": true,
};

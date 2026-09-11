import type { MetricConfig } from "../types";

export const averageTemperature: MetricConfig = {
  "key": "average-temperature",
  "title": "年平均気温",
  "unit": "℃",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2024,
    "to": 2024
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "年平均気温ランキング都道府県【2024年】｜1位沖縄県（24.4℃）",
  "seoDescription": "2024年の年平均気温の都道府県別ランキング。1位沖縄県（24.4℃）、最下位北海道（10.5℃）で2.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};

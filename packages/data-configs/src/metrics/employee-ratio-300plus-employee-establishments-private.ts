import type { MetricConfig } from "../types";

export const employeeRatio300plusEmployeeEstablishmentsPrivate: MetricConfig = {
  "key": "employee-ratio-300plus-employee-establishments-private",
  "title": "300人以上事業所の従業者割合",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C03210",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "300人以上事業所の従業者割合ランキング都道府県【2021年】｜1位東京都（29.06％）",
  "seoDescription": "2021年の300人以上事業所の従業者割合の都道府県別ランキング。1位東京都（29.06％）、最下位高知県（4.95％）で5.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

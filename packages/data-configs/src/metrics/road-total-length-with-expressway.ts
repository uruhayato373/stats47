import type { MetricConfig } from "../types";

export const roadTotalLengthWithExpressway: MetricConfig = {
  "key": "road-total-length-with-expressway",
  "title": "道路実延長（高速道路を含む）",
  "subtitle": "合計（高速道路を含む）",
  "unit": "km",
  "category": "infrastructure",
  "description": "道路法に基づく路線の総延長から、重用延長、未供用延長、渡船延長を除いた実延長について、高速自動車国道、一般国道、都道府県道、市町村道を合計した値。",
  "note": "3月31日現在。自転車専用道と歩道は道路実延長に含まれない。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H711001",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "km/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "km/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "道路実延長（高速道路を含む）ランキング都道府県【2023年】｜1位北海道（90,774.5km）",
  "seoDescription": "2023年の道路実延長（高速道路を含む）の都道府県別ランキング。1位北海道（90,774.5km）、最下位沖縄県（8,267.8km）で11.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const residentialBuildingStarts: MetricConfig = {
  "key": "residential-building-starts",
  "title": "着工居住用建築物数",
  "unit": "棟",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H1700",
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
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "棟/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "棟/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "着工居住用建築物数ランキング都道府県【2024年】｜1位東京都（37,678棟）",
  "seoDescription": "2024年の着工居住用建築物数の都道府県別ランキング。1位東京都（37,678棟）、最下位高知県（1,853棟）で20.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

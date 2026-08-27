import type { MetricConfig } from "../types";

export const numberOfHotelRooms: MetricConfig = {
  "key": "number-of-hotel-rooms",
  "title": "ホテル営業施設客室数",
  "description": "ホテル営業施設が保有する客室の総数。都道府県の宿泊受入容量を示す。",
  "unit": "室",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3804",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1997,
    "to": 2017,
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "室/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "室/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ホテル営業施設客室数ランキング都道府県【2017年】｜1位東京都（110,641室）",
  "seoDescription": "2017年のホテル営業施設客室数の都道府県別ランキング。1位東京都（110,641室）、最下位徳島県（3,195室）で34.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

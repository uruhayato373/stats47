import type { MetricConfig } from "../types";

export const riceCultivatedArea: MetricConfig = {
  "key": "rice-cultivated-area",
  "title": "水稲作付面積",
  "subtitle": "水稲（子実用）の作付面積",
  "unit": "ha",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003418934",
    "cdCat01": "100",
    "displayName": "作物統計調査",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/sakumotu/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateGreens",
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
        "unit": "ha/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ha/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "ha/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "水稲作付面積ランキング都道府県【2019年】｜1位新潟県（119,200ha）",
  "seoDescription": "2019年の水稲作付面積の都道府県別ランキング。1位新潟県（119,200ha）、最下位東京都（129ha）で924.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

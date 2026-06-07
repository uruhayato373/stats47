import type { MetricConfig } from "../types";

export const riceHarvestVolume: MetricConfig = {
  "key": "rice-harvest-volume",
  "title": "水稲収穫量",
  "subtitle": "水稲（子実用）の収穫量",
  "unit": "t",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003418934",
    "cdCat01": "120",
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
        "unit": "t/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "t/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "水稲収穫量ランキング都道府県【2019年】｜1位新潟県（646,100t）",
  "seoDescription": "2019年の水稲収穫量の都道府県別ランキング。1位新潟県（646,100t）、最下位東京都（519t）で1244.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

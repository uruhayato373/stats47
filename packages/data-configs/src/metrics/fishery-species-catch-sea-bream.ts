import type { MetricConfig } from "../types";

export const fisherySpeciesCatchSeaBream: MetricConfig = {
  "key": "fishery-species-catch-sea-bream",
  "title": "タイ類漁獲量",
  "description": "海面漁業によるたい類（まだい・ちだい・きだい・くろだい等の合計）の漁獲量。1956年以降の長期累年データ。 本データは海面漁業による漁獲量で、内陸県（栃木・群馬・埼玉・山梨・長野・岐阜・滋賀・奈良）は対象外（40都道府県）。1956年〜2015年の60年分。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003238633",
    "cdCat01": "0660",
    "displayName": "海面漁業生産統計調査",
    "url": "https://www.maff.go.jp/j/tokei/kouhyou/kaimen_gyosei/",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1956,
    "to": 2015,
  },
  "yearFormat": "calendar",
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
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "fishery-species",
  "seoTitle": "タイ類漁獲量ランキング都道府県【2015年】｜1位長崎県（4,262トン）",
  "seoDescription": "2015年のタイ類漁獲量の都道府県別ランキング。1位長崎県（4,262トン）、最下位福島県（1トン）で4262.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

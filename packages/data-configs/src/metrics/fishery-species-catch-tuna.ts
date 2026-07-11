import type { MetricConfig } from "../types";

export const fisherySpeciesCatchTuna: MetricConfig = {
  "key": "fishery-species-catch-tuna",
  "title": "マグロ類漁獲量",
  "description": "海面漁業によるまぐろ類（くろまぐろ・みなみまぐろ・びんなが・めばち・きはだ等の合計）の漁獲量。1956年以降の長期累年データ。 本データは海面漁業による漁獲量で、内陸県（栃木・群馬・埼玉・山梨・長野・岐阜・滋賀・奈良）は対象外（40都道府県）。1956年〜2015年の60年分。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003238633",
    "cdCat01": "0120",
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
  "seoTitle": "マグロ類漁獲量ランキング｜なぜ静岡が1位?【2015】",
  "seoDescription": "マグロの水揚げ日本一は静岡県で30,660トン──焼津・清水港を擁する静岡がなぜトップなのか。遠洋漁業の拠点構造と47都道府県の漁獲量を2015年データで解説します。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

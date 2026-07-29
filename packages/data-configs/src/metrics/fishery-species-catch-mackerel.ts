import type { MetricConfig } from "../types";

export const fisherySpeciesCatchMackerel: MetricConfig = {
  "key": "fishery-species-catch-mackerel",
  "title": "サバ類漁獲量",
  "description": "海面漁業によるさば類の漁獲量。1956年以降の長期累年データ。茨城・長崎・静岡が主産地。 本データは海面漁業による漁獲量で、内陸県（栃木・群馬・埼玉・山梨・長野・岐阜・滋賀・奈良）は対象外（40都道府県）。1956年〜2015年の60年分。",
  "unit": "トン",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003238633",
    "cdCat01": "0410",
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
  "seoTitle": "サバ類漁獲量ランキング｜1位は意外にも茨城、なぜ?【2015】",
  "seoDescription": "サバの水揚げ日本一は意外にも茨城県で143,403トン──なぜ茨城なのか。太平洋岸の漁場に集中する理由と47都道府県の漁獲量を2015年データで読み解きます。",
  "isActive": true,
};

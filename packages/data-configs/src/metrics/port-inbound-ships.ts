import type { MetricConfig } from "../types";

export const portInboundShips: MetricConfig = {
  "key": "port-inbound-ships",
  "title": "入港船舶隻数（港湾統計）",
  "subtitle": "港湾統計調査",
  "description": "港湾調査（港湾統計年報）による都道府県別の入港船舶隻数。甲種・乙種港湾の合計。内陸7県（栃木・群馬・埼玉・山梨・長野・岐阜・奈良）はデータなし。",
  "unit": "隻",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130773",
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "隻/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "隻/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "additionalCategories": [
    "infrastructure",
  ],
  "seoTitle": "入港船舶隻数（港湾統計）ランキング都道府県【2023年】｜1位広島県（518,835隻）",
  "seoDescription": "2023年の入港船舶隻数（港湾統計）の都道府県別ランキング。1位広島県（518,835隻）、最下位山形県（3,062隻）で169.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

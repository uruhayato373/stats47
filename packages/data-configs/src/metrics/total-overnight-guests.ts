import type { MetricConfig } from "../types";

export const totalOvernightGuests: MetricConfig = {
  "key": "total-overnight-guests",
  "title": "延べ宿泊者数",
  "description": "延べ宿泊者数（全施設タイプ合計、宿泊旅行統計調査）",
  "unit": "人泊",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G7101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万人泊",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人泊/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人泊/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人泊/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "延べ宿泊者数ランキング都道府県【2024年】｜1位東京都（91,633,100人泊）",
  "seoDescription": "2024年の延べ宿泊者数の都道府県別ランキング。1位東京都（91,633,100人泊）、最下位徳島県（1,701,370人泊）で53.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

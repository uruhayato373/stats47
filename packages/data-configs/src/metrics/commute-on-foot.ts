import type { MetricConfig } from "../types";

export const commuteOnFoot: MetricConfig = {
  "key": "commute-on-foot",
  "title": "自宅外通勤・通学者数（徒歩）",
  "subtitle": "徒歩",
  "unit": "人",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H730101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2010,
      2020,
    ],
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "人/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "自宅外通勤・通学者数（徒歩）ランキング都道府県【2020年】｜1位東京都（493,788人）",
  "seoDescription": "2020年の自宅外通勤・通学者数（徒歩）の都道府県別ランキング。1位東京都（493,788人）、最下位徳島県（14,146人）で34.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

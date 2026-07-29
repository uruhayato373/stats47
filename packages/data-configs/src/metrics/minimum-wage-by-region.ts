import type { MetricConfig } from "../types";

export const minimumWageByRegion: MetricConfig = {
  "key": "minimum-wage-by-region",
  "title": "地域別最低賃金",
  "description": "地域別最低賃金（時間額、各都道府県の地域別最低賃金額）",
  "unit": "円",
  "category": "laborwage",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010106",
    "cdCat01": "F6501",
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
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "地域別最低賃金ランキング都道府県【2024年】｜1位東京都（1,163円）",
  "seoDescription": "2024年の地域別最低賃金の都道府県別ランキング。1位東京都（1,163円）、最下位秋田県（951円）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

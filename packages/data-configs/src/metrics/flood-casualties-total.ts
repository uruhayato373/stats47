import type { MetricConfig } from "../types";

export const floodCasualtiesTotal: MetricConfig = {
  "key": "flood-casualties-total",
  "title": "水害死傷者数（計）",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003155647",
    "cdCat01": "100",
    "displayName": "水害統計調査",
    "url": "https://www.mlit.go.jp/river/toukei_chousa/kasen/suigaitoukei/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2014,
    "to": 2014,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
    ],
  },
  "seoTitle": "水害死傷者数（計） 都道府県ランキング【2014年】｜1位広島県（145人）",
  "seoDescription": "2014年の水害死傷者数（計）を都道府県別に比較。1位は広島県（145人）、最下位は沖縄県（1人）、最大と最小の差は145.0倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

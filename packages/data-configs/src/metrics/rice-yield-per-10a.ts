import type { MetricConfig } from "../types";

export const riceYieldPer10a: MetricConfig = {
  "key": "rice-yield-per-10a",
  "title": "水稲10a当たり収量",
  "subtitle": "水稲の10aあたり収穫量",
  "unit": "kg",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003418934",
    "cdCat01": "110",
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
        "unit": "kg/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "kg/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "水稲10a当たり収量 都道府県ランキング【2019年】｜1位青森県（627kg）",
  "seoDescription": "2019年の水稲10a当たり収量を都道府県別に比較。1位は青森県（627kg）、最下位は沖縄県（295kg）、最大と最小の差は2.1倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

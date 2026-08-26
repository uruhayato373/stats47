import type { MetricConfig } from "../types";

export const floodDamageBridge: MetricConfig = {
  "key": "flood-damage-bridge",
  "title": "水害橋梁被害額",
  "unit": "百万円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003155647",
    "cdCat01": "2600",
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
    "conversionFactor": 0.01,
    "decimalPlaces": 1,
    "displayUnit": "億円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "水害橋梁被害額 都道府県ランキング【2014年】｜1位岐阜県（574.0百万円）",
  "seoDescription": "2014年の水害橋梁被害額を都道府県別に比較。1位は岐阜県（574.0百万円）、最下位は三重県（0.0百万円）。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

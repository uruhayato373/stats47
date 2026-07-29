import type { MetricConfig } from "../types";

export const floodDamageGeneralAssets: MetricConfig = {
  "key": "flood-damage-general-assets",
  "title": "水害一般資産等被害額",
  "unit": "百万円",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003155647",
    "cdCat01": "1500",
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
  "seoTitle": "水害一般資産等被害額ランキング都道府県【2014年】｜1位広島県（33,811百万円）",
  "seoDescription": "2014年の水害一般資産等被害額の都道府県別ランキング。1位広島県（33,811百万円）、最下位福井県（2百万円）で16905.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

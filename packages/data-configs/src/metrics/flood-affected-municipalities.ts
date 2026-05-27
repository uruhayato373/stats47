import type { MetricConfig } from "../types";

export const floodAffectedMunicipalities: MetricConfig = {
  "key": "flood-affected-municipalities",
  "title": "水害被災市区町村数（一般資産等）",
  "unit": "延数",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0003155647",
    "cdCat01": "1100",
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
        "unit": "延数/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "延数/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "延数/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "水害被災市区町村数（一般資産等）ランキング都道府県【2014年】｜1位神奈川県（33延数）",
  "seoDescription": "2014年の水害被災市区町村数（一般資産等）の都道府県別ランキング。1位神奈川県（33延数）、最下位熊本県（1延数）で33.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};

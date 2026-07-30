import type { MetricConfig } from "../types";

export const portShipsTonnage: MetricConfig = {
  "key": "port-ships-tonnage",
  "title": "入港船舶総トン数（港湾統計）",
  "unit": "総トン",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130773",
    "cdTab": "130",
    "axisSum": {
          "axis": "cat03",
          "codes": ["110", "120"],
        },
    "cdCat01": "100",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
    "port",
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
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万総トン",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "総トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "総トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "入港船舶総トン数（港湾統計）ランキング都道府県【2023年】｜1位神奈川県（399,226,924総トン）",
  "seoDescription": "2023年の入港船舶総トン数（港湾統計）の都道府県別ランキング。1位神奈川県（399,226,924総トン）、最下位滋賀県（3,203,855総トン）で124.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

import type { MetricConfig } from "../types";

export const portCargoExport: MetricConfig = {
  "key": "port-cargo-export",
  "title": "輸出貨物量（港湾統計）",
  "description": "港湾を通じて国外へ輸出された貨物量。都道府県の港湾別データを集計した重量で示す。",
  "unit": "トン",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130738",
    "axisSum": {
          "axis": "cat03",
          "codes": ["110", "120", "130"],
        },
    "cdCat01": "110",
    "cdCat02": "100",
  },
  "entities": [
    "prefecture",
    "port",
  ],
  "years": {
    "from": 2009,
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
    "displayUnit": "万トン",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "トン/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "トン/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "輸出貨物量（港湾統計）ランキング都道府県【2023年】｜1位愛知県（53,405,445トン）",
  "seoDescription": "2023年の輸出貨物量（港湾統計）の都道府県別ランキング。1位愛知県（53,405,445トン）、最下位島根県（57,392トン）で930.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

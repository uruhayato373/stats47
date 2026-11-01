import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const newOwnerOccupiedStarts: MetricConfig = {
  "key": "new-owner-occupied-starts",
  "title": "着工新設持家数",
  "unit": "戸",
  "description": "国土交通省『建築着工統計調査』の新設住宅のうち、利用関係が「持家」(建築主が自分で居住する目的で建てる住宅) の着工戸数。社会・人口統計体系の都道府県別の値。",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H1801",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
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
        "unit": "戸/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "戸/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "着工新設持家数ランキング都道府県【2024年】｜1位愛知県（15,980戸）",
  "seoDescription": "2024年の着工新設持家数の都道府県別ランキング。1位愛知県（15,980戸）、最下位高知県（1,234戸）で12.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};

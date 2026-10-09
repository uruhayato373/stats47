import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const portCargoTotal: MetricConfig = {
  "key": "port-cargo-total",
  "title": "海上出入貨物量（港湾統計）",
  "description": "港湾調査（港湾統計年報）による都道府県別の海上出入貨物量（輸出入・移出入の合計）。内陸7県はデータなし。",
  "unit": "トン",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0003130738",
    "axisSum": {
          "axis": "cat03",
          "codes": ["110", "120", "130"],
        },
    "cdCat01": "100",
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
  "yearExclusions": [
    {
      "years": [
        2005,
        2006,
        2007,
        2008,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
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
  "additionalCategories": [
    "infrastructure",
  ],
  "seoTitle": "海上出入貨物量（港湾統計） 都道府県ランキング【2023年】｜1位愛知県（200,603,167.0トン）",
  "seoDescription": "2023年の海上出入貨物量（港湾統計）を都道府県別に比較。1位は愛知県（200,603,167.0トン）、最下位は山形県（2,714,251.0トン）、最大と最小の差は73.9倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};

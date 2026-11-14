// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: data/themes/catalogs/freight-logistics.json
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const FREIGHT_LOGISTICS_SET: IndicatorSet = {
  "key": "freight-logistics",
  "title": "物流と貨物輸送",
  "description": "発送県と到着県の組合せを鉄道・自動車・海運・航空別に確認します。2024年度の貨物流動が基本ですが、海運は2024暦年のフレートトンです。単位と期間を分け、輸送機関横断の合計は作りません。",
  "category": "tourism",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "primary"
    },
    {
      "rankingKey": "air-cargo-transport",
      "shortLabel": "航空貨物輸送量",
      "role": "secondary"
    },
    {
      "rankingKey": "number-of-freight-cars",
      "shortLabel": "貨物車数",
      "role": "context"
    },
    {
      "rankingKey": "truck-operators",
      "shortLabel": "トラック事業者",
      "role": "secondary"
    },
    {
      "rankingKey": "main-road-length-per-km2",
      "shortLabel": "主要道路実延長(面積あたり)",
      "role": "secondary"
    },
    {
      "rankingKey": "maritime-import-export-cargo",
      "shortLabel": "海上出入貨物",
      "role": "secondary"
    },
    {
      "rankingKey": "port-count",
      "shortLabel": "港湾の対象港数",
      "role": "secondary"
    },
    {
      "rankingKey": "airport-count",
      "shortLabel": "空港数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "物流",
    "貨物",
    "輸送",
    "トラック"
  ]
};

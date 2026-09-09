// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/freight-logistics.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const FREIGHT_LOGISTICS_SET: IndicatorSet = {
  "key": "freight-logistics",
  "title": "物流と貨物輸送",
  "description": "JR貨物、航空貨物、貨物車両、トラック事業者の規模を輸送手段別に比較します。輸送量を単純合算して物流量とはしません。",
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
      "role": "secondary"
    },
    {
      "rankingKey": "truck-operators",
      "shortLabel": "トラック事業者",
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

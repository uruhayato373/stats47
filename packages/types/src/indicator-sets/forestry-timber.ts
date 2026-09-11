// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/forestry-timber.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const FORESTRY_TIMBER_SET: IndicatorSet = {
  "key": "forestry-timber",
  "title": "森林・林業・木材産業",
  "description": "森林資源と木材の生産・出荷に加え、2025年農林業センサスの経営体・労働力と2024年の林業産出額を比較します。労働力は経営体ごとの過去1年間の人数で、雇用と経営内部を分けます。県別産出額は全国表と集計対象が異なり、木材・きのこ以外に薪炭・林野副産物を含みます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "woodland-area",
      "shortLabel": "森林面積",
      "role": "primary"
    },
    {
      "rankingKey": "forest-area-ratio",
      "shortLabel": "林野面積割合",
      "role": "secondary"
    },
    {
      "rankingKey": "artificial-forest-area",
      "shortLabel": "人工造林面積",
      "role": "secondary"
    },
    {
      "rankingKey": "forest-road-length",
      "shortLabel": "林道延長",
      "role": "secondary"
    },
    {
      "rankingKey": "roundwood-production-volume",
      "shortLabel": "素材生産量（2024年確報）",
      "role": "secondary"
    },
    {
      "rankingKey": "roundwood-sugi-production-volume",
      "shortLabel": "すぎの素材生産量",
      "role": "secondary"
    },
    {
      "rankingKey": "roundwood-hinoki-production-volume",
      "shortLabel": "ひのきの素材生産量",
      "role": "secondary"
    },
    {
      "rankingKey": "sawmill-count",
      "shortLabel": "製材工場数（7.5kW以上）",
      "role": "secondary"
    },
    {
      "rankingKey": "sawnwood-shipment-volume",
      "shortLabel": "製材品出荷量",
      "role": "secondary"
    },
    {
      "rankingKey": "forestry-management-entities",
      "shortLabel": "林業経営体数（2025年調査）",
      "role": "secondary"
    },
    {
      "rankingKey": "forestry-hired-workers",
      "shortLabel": "林業経営体の雇用者数（2025年調査）",
      "role": "secondary"
    },
    {
      "rankingKey": "forestry-internal-workers",
      "shortLabel": "林業経営体の内部労働者数（2025年調査）",
      "role": "secondary"
    },
    {
      "rankingKey": "forestry-output-value",
      "shortLabel": "林業産出額（2024年確報）",
      "role": "primary"
    },
    {
      "rankingKey": "forestry-timber-output-value",
      "shortLabel": "木材生産産出額（2024年確報）",
      "role": "secondary"
    },
    {
      "rankingKey": "forestry-mushroom-output-value",
      "shortLabel": "栽培きのこ類産出額（2024年確報）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "森林",
    "林業",
    "人工林",
    "林道"
  ]
};

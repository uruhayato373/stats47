// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/water-services.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const WATER_SERVICES_SET: IndicatorSet = {
  "key": "water-services",
  "title": "水道の持続性",
  "description": "2024年度の法適用水道について、経年管・更新管を同じ総延長で比較します。末端給水・用水供給・法適用簡易水道を含み、同一会計内簡易水道の内数は二重計上しません。法非適用・民営等は除外し、事業団体の所属県別で集計しています。管路の物理所在地別や破損確率ではありません。上水道給水量・能力と下水道普及率は対象を分けて読みます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "public-water-pipe-aging-rate",
      "shortLabel": "水道管路の経年化率",
      "role": "primary"
    },
    {
      "rankingKey": "public-water-pipe-renewal-rate",
      "shortLabel": "水道管路の更新率",
      "role": "primary"
    },
    {
      "rankingKey": "public-water-pipe-length",
      "shortLabel": "水道管路の総延長",
      "role": "secondary"
    },
    {
      "rankingKey": "public-water-aged-pipe-length",
      "shortLabel": "法定耐用年数を経過した水道管路延長",
      "role": "secondary"
    },
    {
      "rankingKey": "public-water-renewed-pipe-length",
      "shortLabel": "年度内に更新した水道管路延長",
      "role": "secondary"
    },
    {
      "rankingKey": "water-supply-population-ratio-2012on",
      "shortLabel": "上水道給水人口比率",
      "role": "primary"
    },
    {
      "rankingKey": "sewerage-coverage-rate",
      "shortLabel": "下水道処理人口普及率",
      "role": "secondary"
    },
    {
      "rankingKey": "water-supply-annual-volume",
      "shortLabel": "上水道年間給水量",
      "role": "secondary"
    },
    {
      "rankingKey": "water-supply-capacity",
      "shortLabel": "上水道施設能力",
      "role": "secondary"
    }
  ],
  "keywords": [
    "水道",
    "上水道",
    "下水道",
    "持続性"
  ]
};

// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/regional-energy.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const REGIONAL_ENERGY_SET: IndicatorSet = {
  "key": "regional-energy",
  "title": "エネルギー消費",
  "description": "最終エネルギー消費量と1人当たり消費、電力需要、住宅の太陽光設備率を規模と普及に分けて比較します。電源構成は別統計として扱います。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "final-energy-consumption",
      "shortLabel": "最終エネルギー消費量",
      "role": "primary"
    },
    {
      "rankingKey": "final-energy-consumption-per-capita",
      "shortLabel": "1人当たり最終エネルギー消費量",
      "role": "secondary"
    },
    {
      "rankingKey": "electricity-demand",
      "shortLabel": "電力需要量",
      "role": "secondary"
    },
    {
      "rankingKey": "solar-panel-housing-rate",
      "shortLabel": "太陽光発電機のある住宅率",
      "role": "secondary"
    }
  ],
  "keywords": [
    "エネルギー",
    "電力",
    "太陽光",
    "消費"
  ]
};

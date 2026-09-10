// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/regional-energy.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const REGIONAL_ENERGY_SET: IndicatorSet = {
  "key": "regional-energy",
  "title": "エネルギー消費",
  "description": "最終エネルギー消費量と1人当たり消費、電力需要、住宅の太陽光設備率を規模と普及に分けて比較します。電源構成は別統計として扱います。2023年度・暫定値の直接利用分（TJ）。非エネルギー利用を含みます。産業は農林水産鉱建設業と製造業の合計です。運輸は家庭乗用車に限り、営業用輸送等を含みません。電力・熱の寄与損失配分後総量やCO₂排出量、別年度の設備容量とは分けて比較します。",
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
    },
    {
      "rankingKey": "regional-industry-final-energy-consumption",
      "shortLabel": "産業部門の最終エネルギー消費量",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-business-final-energy-consumption",
      "shortLabel": "業務他部門の最終エネルギー消費量",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-household-final-energy-consumption",
      "shortLabel": "家庭部門の最終エネルギー消費量",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-household-car-final-energy-consumption",
      "shortLabel": "家庭乗用車の最終エネルギー消費量",
      "role": "secondary"
    },
    {
      "rankingKey": "fit-fip-installed-capacity",
      "shortLabel": "FIT・FIP導入設備容量の合計",
      "role": "secondary"
    },
    {
      "rankingKey": "fit-fip-new-approved-installed-capacity",
      "shortLabel": "制度開始後の新規認定分の導入容量",
      "role": "secondary"
    },
    {
      "rankingKey": "fit-transition-installed-capacity",
      "shortLabel": "旧制度から移行した設備の導入容量",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-co2-emissions-estimate",
      "shortLabel": "地域のCO₂排出量推計・合計",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-industry-co2-emissions-estimate",
      "shortLabel": "産業部門のCO₂推計",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-business-co2-emissions-estimate",
      "shortLabel": "業務その他部門のCO₂推計",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-household-co2-emissions-estimate",
      "shortLabel": "家庭部門のCO₂推計",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-transport-co2-emissions-estimate",
      "shortLabel": "運輸部門のCO₂推計（航空を除く）",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-waste-co2-emissions-estimate",
      "shortLabel": "一般廃棄物焼却のCO₂推計",
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

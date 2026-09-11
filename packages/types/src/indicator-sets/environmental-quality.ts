// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/environmental-quality.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const ENVIRONMENTAL_QUALITY_SET: IndicatorSet = {
  "key": "environmental-quality",
  "title": "大気と水環境",
  "description": "PM2.5の一般環境大気測定局について、有効測定局を分母とした環境基準達成率と局数を比較します。自動車排出ガス測定局や住民の平均曝露濃度は含みません。河川・湖沼・海域の水質は2023年度の県別原表掲載行と達成判定を確認できます。汚濁負荷量は濃度・環境基準達成割合と分けて表示します。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "pm25-general-station-compliance-rate",
      "shortLabel": "PM2.5環境基準達成率（一般局）",
      "role": "primary"
    },
    {
      "rankingKey": "pm25-compliant-general-station-count",
      "shortLabel": "PM2.5環境基準達成局数（一般局）",
      "role": "secondary"
    },
    {
      "rankingKey": "pm25-valid-general-station-count",
      "shortLabel": "PM2.5有効測定局数（一般局）",
      "role": "secondary"
    },
    {
      "rankingKey": "pm25-general-station-count",
      "shortLabel": "PM2.5総測定局数（一般局）",
      "role": "secondary"
    },
    {
      "rankingKey": "bod-pollution-load",
      "shortLabel": "BOD汚濁負荷量",
      "role": "secondary"
    },
    {
      "rankingKey": "cod-pollution-load",
      "shortLabel": "COD汚濁負荷量",
      "role": "secondary"
    }
  ],
  "keywords": [
    "大気",
    "水環境",
    "PM2.5",
    "環境基準"
  ]
};

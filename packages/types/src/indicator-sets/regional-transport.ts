// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: data/themes/catalogs/regional-transport.json
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const REGIONAL_TRANSPORT_SET: IndicatorSet = {
  "key": "regional-transport",
  "title": "自動車依存と移動手段",
  "description": "自動車保有、通勤・通学の交通手段、バス事業者を別々に比較します。自動車保有台数から交通空白を直接判定しません。",
  "category": "tourism",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "car-ownership-multi-person-households-per-1000",
      "shortLabel": "自動車所有数量（二人以上世帯千世帯当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "commute-by-car",
      "shortLabel": "自家用車通勤・通学者数",
      "role": "secondary"
    },
    {
      "rankingKey": "commute-by-bus",
      "shortLabel": "乗合バス通勤・通学者数",
      "role": "secondary"
    },
    {
      "rankingKey": "commute-by-train",
      "shortLabel": "鉄道・電車通勤・通学者数",
      "role": "secondary"
    },
    {
      "rankingKey": "bus-operators",
      "shortLabel": "バス事業者",
      "role": "secondary"
    },
    {
      "rankingKey": "household-survey-transport-communication-expenditure",
      "shortLabel": "交通・通信支出（二人以上世帯・10〜11月の月平均）",
      "role": "secondary"
    },
    {
      "rankingKey": "commuters-total",
      "shortLabel": "自宅外通勤・通学者数",
      "role": "context"
    },
    {
      "rankingKey": "gasoline-consumption-quantity",
      "shortLabel": "ガソリン消費量（県庁所在市・二人以上世帯の年間値）",
      "role": "secondary"
    },
    {
      "rankingKey": "automobile-related-group-consumption-expenditure",
      "shortLabel": "自動車等関係費（県庁所在市・二人以上世帯の年間値）",
      "role": "secondary"
    },
    {
      "rankingKey": "bus-fare-consumption-expenditure",
      "shortLabel": "バス代（県庁所在市・二人以上世帯の年間値）",
      "role": "secondary"
    },
    {
      "rankingKey": "taxi-driver-annual-income",
      "shortLabel": "タクシー運転者の平均年収",
      "role": "secondary"
    },
    {
      "rankingKey": "bus-driver-annual-income",
      "shortLabel": "バス運転者の平均年収",
      "role": "secondary"
    }
  ],
  "keywords": [
    "自動車",
    "交通",
    "通勤",
    "バス"
  ]
};

// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-services.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_SERVICES_SET: IndicatorSet = {
  "key": "local-services",
  "title": "飲食・生活関連サービス",
  "description": "飲食店、宿泊施設、生活関連サービスの規模を実値で比較します。飲食・宿泊・その他サービスは別の産業分類として表示します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "restaurant-count-per-1000",
      "shortLabel": "飲食店数（人口千人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "number-of-hotel-facilities",
      "shortLabel": "ホテル営業施設数",
      "role": "secondary"
    },
    {
      "rankingKey": "number-of-hotel-rooms",
      "shortLabel": "ホテル営業施設客室数",
      "role": "secondary"
    },
    {
      "rankingKey": "personal-items-service-consumption-expenditure",
      "shortLabel": "身の回り用品関連サービス支出",
      "role": "secondary"
    }
  ],
  "keywords": [
    "飲食店",
    "宿泊",
    "生活関連サービス"
  ]
};

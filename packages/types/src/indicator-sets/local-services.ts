// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-services.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_SERVICES_SET: IndicatorSet = {
  "key": "local-services",
  "title": "飲食・生活関連サービス",
  "description": "飲食店数と、洗濯・理容・美容・浴場業の事業活動を比較します。事業所・従業者は2021年6月1日の事業所所在地別、売上・純付加価値は2020年の企業本所所在地別です。対象年と県への帰属が異なるため、両者を割って生産性とはしません。産業中分類78で、その他の生活関連サービス79と娯楽80を含みません。",
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
      "shortLabel": "身の回り用品関連サービスへの家計支出（県庁所在市・二人以上世帯・年額）",
      "role": "context"
    },
    {
      "rankingKey": "laundry-beauty-bath-industry-establishments",
      "shortLabel": "洗濯・理容・美容・浴場業の事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "laundry-beauty-bath-industry-employees",
      "shortLabel": "洗濯・理容・美容・浴場業の従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "laundry-beauty-bath-industry-revenue",
      "shortLabel": "洗濯・理容・美容・浴場業の企業売上高",
      "role": "secondary"
    },
    {
      "rankingKey": "laundry-beauty-bath-industry-net-value-added",
      "shortLabel": "洗濯・理容・美容・浴場業の企業純付加価値額",
      "role": "secondary"
    },
    {
      "rankingKey": "media-production-establishments",
      "shortLabel": "映像・音声・文字情報制作業の事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "media-production-employees",
      "shortLabel": "映像・音声・文字情報制作業の従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "media-production-revenue",
      "shortLabel": "映像・音声・文字情報制作業の企業売上高",
      "role": "secondary"
    },
    {
      "rankingKey": "media-production-net-value-added",
      "shortLabel": "映像・音声・文字情報制作業の企業純付加価値額",
      "role": "secondary"
    },
    {
      "rankingKey": "amusement-industry-establishments",
      "shortLabel": "娯楽業の事業所数",
      "role": "secondary"
    },
    {
      "rankingKey": "amusement-industry-employees",
      "shortLabel": "娯楽業の従業者数",
      "role": "secondary"
    },
    {
      "rankingKey": "amusement-industry-revenue",
      "shortLabel": "娯楽業の企業売上高",
      "role": "secondary"
    },
    {
      "rankingKey": "amusement-industry-net-value-added",
      "shortLabel": "娯楽業の企業純付加価値額",
      "role": "secondary"
    }
  ],
  "keywords": [
    "飲食店",
    "宿泊",
    "生活関連サービス"
  ]
};

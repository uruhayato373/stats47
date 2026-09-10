// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-government-digital.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_GOVERNMENT_DIGITAL_SET: IndicatorSet = {
  "key": "local-government-digital",
  "title": "自治体DX",
  "description": "都道府県行政のオンライン化と申請利用を分けて比較します。eLTAX・採用申請は2022年度、環境性能割は2023年度の実績、手続のオンライン化状況は2023年4月1日調査時点です。利用率をオンライン化率と混同せず、市町村分を合算しません。",
  "category": "finance",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "prefectural-dx-online-procedure-rate",
      "shortLabel": "手続オンライン化率（2023年調査）",
      "role": "primary"
    },
    {
      "rankingKey": "prefectural-dx-online-procedure-count",
      "shortLabel": "オンライン化済手続数",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-dx-applicable-procedure-count",
      "shortLabel": "実施している対象手続数",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-eltax-online-application-rate",
      "shortLabel": "eLTAX申請利用率（2022年度）",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-recruitment-online-application-rate",
      "shortLabel": "採用試験申請利用率（2022年度）",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-auto-environment-tax-online-application-rate",
      "shortLabel": "環境性能割申告のオンライン利用率（2023年度）",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-auto-environment-tax-online-application-count",
      "shortLabel": "環境性能割のオンライン申請件数",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-auto-environment-tax-application-count",
      "shortLabel": "環境性能割の申請総件数",
      "role": "secondary"
    }
  ],
  "keywords": [
    "自治体DX",
    "オンライン申請",
    "行政",
    "デジタル"
  ]
};

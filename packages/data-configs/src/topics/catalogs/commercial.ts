import type { CategoryTopicCatalog } from "../types";

/** 商業・サービス業 (73 件) — 店舗の種類 / 販売額 / 事業所規模 / 生活サービス */
export const COMMERCIAL_TOPICS: CategoryTopicCatalog = {
  categoryKey: "commercial",
  topics: [
    {
      key: "store-count",
      label: "店舗・事業所の数",
      matchers: [{ kind: "title", pattern: "(店舗|店|所|事業所)数$" }],
    },
    {
      key: "sales",
      label: "販売額",
      matchers: [{ kind: "title", pattern: "販売額|商品手持額|売場面積" }],
    },
    {
      key: "establishment-size",
      label: "事業所の規模",
      matchers: [{ kind: "title", pattern: "人(以上)?(の)?事業所|従業者割合|事業所割合" }],
    },
    {
      key: "life-service",
      label: "生活サービス",
      matchers: [{ kind: "title", pattern: "クリーニング|公衆浴場|理容|美容|旅券|ホテル|旅館" }],
    },
    {
      key: "employment",
      label: "従業者",
      matchers: [{ kind: "title", pattern: "従業者数|就業者数" }],
    },
  ],
};

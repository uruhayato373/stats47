import type { CategoryTopicCatalog } from "../types";

/** 住宅・土地・建設 (76 件) — 住宅の種類 / 広さ / 家賃・地価 / 設備 / 建設業 */
export const CONSTRUCTION_TOPICS: CategoryTopicCatalog = {
  categoryKey: "construction",
  topics: [
    {
      key: "housing-type",
      label: "住宅の種類・所有関係",
      matchers: [{ kind: "title", pattern: "(一戸建|共同住宅|借家|持家|公営|空き家|長屋)(住宅)?(比率|率)|住宅比率|住宅率" }],
    },
    {
      key: "housing-size",
      label: "住宅の広さ",
      matchers: [{ kind: "title", pattern: "延べ面積|敷地面積|畳数|居住室|部屋数" }],
    },
    {
      key: "rent-land-price",
      label: "家賃・地価",
      matchers: [{ kind: "title", pattern: "家賃|地価|敷地価額|住宅費|住居費" }],
    },
    {
      key: "housing-equipment",
      label: "住宅の設備・性能",
      matchers: [{ kind: "title", pattern: "バリアフリー|オートロック|耐震|リフォーム|水洗|設備" }],
    },
    {
      key: "construction-industry",
      label: "建設業",
      matchers: [{ kind: "title", pattern: "工事請負|完成工事高|建設業|着工|大工|投資額" }],
    },
  ],
};

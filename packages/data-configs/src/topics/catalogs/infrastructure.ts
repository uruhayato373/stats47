import type { CategoryTopicCatalog } from "../types";

/** 社会基盤施設 (48 件) — 上下水道 / 道路 / 港湾 / 公園 */
export const INFRASTRUCTURE_TOPICS: CategoryTopicCatalog = {
  categoryKey: "infrastructure",
  topics: [
    {
      key: "water",
      label: "上下水道",
      matchers: [{ kind: "title", pattern: "上水道|下水道|汚水処理|給水|水洗化" }],
    },
    {
      key: "road",
      label: "道路",
      matchers: [{ kind: "title", pattern: "道路|舗装|林道|延長" }],
    },
    {
      key: "port",
      label: "港湾",
      matchers: [{ kind: "title", pattern: "港湾|入港|海上|コンテナ" }],
    },
    {
      key: "park",
      label: "公園",
      matchers: [{ kind: "title", pattern: "公園" }],
    },
    {
      key: "dam",
      label: "ダム・治水",
      matchers: [{ kind: "title", pattern: "ダム|堤防|治水" }],
    },
  ],
};

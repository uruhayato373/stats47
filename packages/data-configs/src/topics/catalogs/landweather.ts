import type { CategoryTopicCatalog } from "../types";

/** 国土・気象 (41 件) — 気象観測 / 土地利用 / 自然公園 */
export const LANDWEATHER_TOPICS: CategoryTopicCatalog = {
  categoryKey: "landweather",
  topics: [
    {
      key: "weather",
      label: "気象",
      matchers: [{ kind: "title", pattern: "気温|湿度|日照|降水|降雪|快晴|曇天|雨|雪|風速" }],
    },
    {
      key: "land-use",
      label: "土地利用",
      matchers: [{ kind: "title", pattern: "地域面積比率|市街化|可住地|宅地|土地生産性" }],
    },
    {
      key: "nature-park",
      label: "自然公園・森林",
      matchers: [{ kind: "title", pattern: "国立公園|国定公園|自然公園|造林|湖沼" }],
    },
    {
      key: "area",
      label: "面積",
      matchers: [{ kind: "title", pattern: "面積" }],
    },
  ],
};

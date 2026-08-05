import type { CategoryTopicCatalog } from "../types";

/**
 * 教育・文化・スポーツ (257 件)
 *
 * 最大の塊は社会生活基本調査の「◯◯の行動者率」69 件 (趣味・スポーツ・学習の実施率)。
 * 残りは学校統計 (学校数・在学者数・教員数)、教育費、体格 (身長・体重)、部活動。
 */
export const EDUCATIONSPORTS_TOPICS: CategoryTopicCatalog = {
  categoryKey: "educationsports",
  topics: [
    {
      key: "activity-rate",
      label: "趣味・スポーツ・学習の行動者率",
      matchers: [{ kind: "title", pattern: "行動者率" }],
    },
    {
      key: "school-count",
      label: "学校・施設の数",
      matchers: [
        { kind: "title", pattern: "(学校|大学|園|館|施設|教室|クラブ|学級|講座)数$" },
        { kind: "title", pattern: "(場|コート|プール)数（公共）" },
      ],
    },
    {
      key: "student-count",
      label: "在学者・教員の数",
      matchers: [
        { kind: "title", pattern: "(児童|生徒|学生|園児|教員|職員|部員)数" },
        { kind: "title", pattern: "あたり部員数" },
      ],
    },
    {
      key: "education-cost",
      label: "教育費",
      matchers: [
        { kind: "title", pattern: "教育費|学習費|授業料|給与額|初任給|奨学" },
        { kind: "title", pattern: "(小学校|中学校|高等学校|特別支援学校|大学|社会教育|保健体育|児童福祉)費" },
      ],
    },
    {
      key: "advancement",
      label: "進学・卒業後の進路",
      matchers: [
        { kind: "title", pattern: "進学率|就職率|卒業者|中退|不登校|最終学歴|収容力|入学者|長期欠席" },
      ],
    },
    {
      key: "child-welfare",
      label: "児童福祉・保育",
      matchers: [{ kind: "title", pattern: "児童相談所|児童福祉|こども園|保育" }],
    },
    {
      key: "physique",
      label: "体格・体力",
      matchers: [{ kind: "title", pattern: "平均身長|平均体重|体力|運動能力" }],
    },
    {
      key: "library-culture",
      label: "図書館・文化施設の利用",
      matchers: [{ kind: "title", pattern: "図書館|博物館|貸出|入館|文化" }],
    },
  ],
};

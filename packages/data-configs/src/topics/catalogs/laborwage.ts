import type { CategoryTopicCatalog } from "../types";

/**
 * 労働・賃金 (110 件)
 *
 * 分布の実測 (2026-08-05): 「◯◯の平均時間」24 / 「◯◯の平均年収」18 / 給与・賃金 14 /
 * 産業別就業構造 7 / 求人・就職 6。この 8 群で 80% を占める。
 *
 * 「生活時間」24 件は社会生活基本調査で、9 種類の活動 × (男女 × 有業/非有業) の
 * 掛け合わせ。UI 側でタイトル同値を畳むと 9 行に見える。
 */
export const LABORWAGE_TOPICS: CategoryTopicCatalog = {
  categoryKey: "laborwage",
  topics: [
    {
      key: "occupation-income",
      label: "職業別の平均年収",
      matchers: [{ kind: "title", pattern: "の平均年収$" }],
    },
    {
      key: "living-time",
      label: "生活時間",
      matchers: [
        { kind: "title", pattern: "の平均時間$" },
        { kind: "title", pattern: "実労働時間" },
      ],
    },
    {
      key: "wage",
      label: "賃金・給与",
      matchers: [
        { kind: "title", pattern: "給与|賃金|初任給|年収|報酬" },
      ],
    },
    {
      key: "industry-structure",
      label: "産業別の就業構造",
      matchers: [
        { kind: "title", pattern: "次産業(就業者|従業者)" },
        { kind: "title", pattern: "^(就業者|雇用者)比率$" },
      ],
    },
    {
      key: "job-opening",
      label: "求人・就職",
      matchers: [
        { kind: "title", pattern: "求人|求職|就職率|充足率|職業紹介" },
      ],
    },
    {
      key: "work-style",
      label: "働き方",
      matchers: [
        { kind: "title", pattern: "非正規|副業|テレワーク|転職率|労働災害" },
      ],
    },
    {
      key: "employment-rate",
      label: "就業率・労働力",
      matchers: [
        { kind: "title", pattern: "就業率|有業|労働力率|失業|就業異動|高齢(一般労働者|就業者)" },
      ],
    },
    {
      key: "commute",
      label: "通勤・県外就職",
      matchers: [{ kind: "title", pattern: "通勤|通学者|県外就職" }],
    },
    {
      key: "disability-employment",
      label: "障害者雇用",
      matchers: [{ kind: "title", pattern: "障害者" }],
    },
  ],
  overrides: {
    // 都道府県財政の費目であって賃金指標ではない。「賃金」に吸われるのを止め、
    // 独立させるほどの件数もないので受け皿へ落とす。
    "labor-expenses-prefecture": "other",
  },
};

import type { CategoryTopicCatalog } from "../types";

/**
 * 行財政 (129 件)
 *
 * 単位「千円」が 75 件を占め、その大半が歳出の目的別費目 (民生費・土木費・衛生費…)。
 * 他に歳入、財政指標、公務員、選挙。
 */
export const ADMINISTRATIVEFINANCIAL_TOPICS: CategoryTopicCatalog = {
  categoryKey: "administrativefinancial",
  topics: [
    {
      key: "expenditure",
      label: "歳出の費目",
      matchers: [
        { kind: "title", pattern: "(民生|土木|衛生|教育|警察|消防|農林水産業|商工|議会|総務|労働|災害復旧|公債|都市計画|住宅|清掃|保健所)費" },
        { kind: "title", pattern: "歳出|支出済|投資額" },
      ],
    },
    {
      key: "revenue",
      label: "歳入",
      matchers: [
        { kind: "title", pattern: "歳入|税収|地方税|地方交付税|国庫支出金|財産収入|諸収入|使用料|手数料|寄附金" },
        { kind: "title", pattern: "事業税|繰越金|繰入金|一般財源|自主財源|実収入|年間収入|出資金" },
      ],
    },
    {
      key: "fiscal-health",
      label: "財政指標",
      matchers: [
        { kind: "title", pattern: "財政力指数|公債費比率|将来負担|実質収支|経常収支|基準財政|地方債|積立金|基金" },
      ],
    },
    {
      key: "public-servant",
      label: "公務員",
      matchers: [{ kind: "title", pattern: "職員数|給与月額|給料月額|職員給|人件費|議員数|平均年齢|手当" }],
    },
    {
      key: "election",
      label: "選挙",
      matchers: [{ kind: "title", pattern: "投票率|選挙人名簿|選挙" }],
    },
    {
      key: "land-value",
      label: "土地評価",
      matchers: [{ kind: "title", pattern: "評価総地積|地積" }],
    },
  ],
};

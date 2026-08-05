import type { CategoryTopicCatalog } from "../types";

/**
 * 社会保障・衛生 (244 件)
 *
 * 医療提供体制 (病院・診療所・病床・医療従事者)、受療状況 (受療率・患者数・通院者率)、
 * 福祉 (障害者支援・生活保護・高齢者福祉)、社会保険、衛生・死亡が主な塊。
 */
export const SOCIALSECURITY_TOPICS: CategoryTopicCatalog = {
  categoryKey: "socialsecurity",
  topics: [
    {
      key: "medical-staff",
      label: "医療従事者",
      matchers: [{ kind: "title", pattern: "(医師|歯科医師|薬剤師|看護師|准看護師|保健師|助産師|療法士|衛生士|はり師|きゅう師|マッサージ師|調理師|栄養士)数" }],
    },
    {
      key: "medical-facility",
      label: "医療施設・病床",
      matchers: [{ kind: "title", pattern: "(病院|診療所|薬局|販売業|病床|センター|理容所|美容所)数|病床|在院日数" }],
    },
    {
      key: "receiving-care",
      label: "受療状況・患者数",
      matchers: [{ kind: "title", pattern: "受療率|患者数|通院者率|入院|外来|診療|による死亡|死亡数" }],
    },
    {
      key: "welfare-disability",
      label: "障害者福祉",
      matchers: [{ kind: "title", pattern: "身体障害|知的障害|精神障害|障害者" }],
    },
    {
      key: "welfare-elderly",
      label: "高齢者・介護",
      matchers: [{ kind: "title", pattern: "老人|高齢者|介護|養護" }],
    },
    {
      key: "public-assistance",
      label: "生活保護・社会福祉費",
      matchers: [{ kind: "title", pattern: "生活保護|社会福祉費|民生費|扶助" }],
    },
    {
      key: "insurance",
      label: "社会保険",
      matchers: [{ kind: "title", pattern: "保険|年金|給付" }],
    },
    {
      key: "hygiene",
      label: "衛生・健康",
      matchers: [{ kind: "title", pattern: "衛生|健康|検診|予防接種|平均余命|食中毒|有訴者率|中絶|老年化指数" }],
    },
    {
      key: "childcare",
      label: "保育・子育て支援",
      matchers: [{ kind: "title", pattern: "保育|児童|乳児|幼児" }],
    },
  ],
};

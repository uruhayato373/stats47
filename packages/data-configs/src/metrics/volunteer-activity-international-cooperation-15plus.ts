import type { MetricConfig } from "../types";

/**
 * 2006年社会生活基本調査の国際協力ボランティア行動者率。
 * 公開ランキングではなく、既存ブログ図表を同じMetricConfig→R2経路から復元するための系列。
 */
export const volunteerActivityInternationalCooperation15plus: MetricConfig = {
  key: "volunteer-activity-international-cooperation-15plus",
  title: "国際協力に関係したボランティア活動行動者率",
  subtitle: "15歳以上",
  description:
    "過去1年間に国際協力に関係したボランティア活動を行った15歳以上人口の割合。2006年社会生活基本調査。",
  note: "都道府県別の観測年は2006年。寄付ではなく、実際に行ったボランティア活動を対象とする。",
  unit: "％",
  category: "educationsports",
  source: {
    kind: "estat",
    statsDataId: "0000010107",
    cdCat01: "G6450",
    displayName: "社会・人口統計体系（社会生活基本調査）",
    url: "https://www.stat.go.jp/data/ssds/index.htm",
  },
  entities: ["prefecture"],
  years: { years: [2006] },
  yearFormat: "fiscal",
  visualization: {
    colorScheme: "interpolateBlues",
    colorSchemeType: "sequential",
    minValueType: "zero",
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  calculation: {
    isCalculated: false,
    normalizationOptions: [],
  },
  isActive: false,
};

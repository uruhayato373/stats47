import type { CategoryTopicCatalog } from "../types";

/**
 * 司法・安全・環境 (106 件) — 交通事故 / 犯罪 / 災害・消防 / 廃棄物 / 公害 / 自殺
 *
 * カテゴリ名に「司法」が入るが、裁判・弁護士等の指標は現時点で 1 件も無いため
 * 司法グループは置いていない。該当 metric が入ったら追加する。
 */
export const SAFETYENVIRONMENT_TOPICS: CategoryTopicCatalog = {
  categoryKey: "safetyenvironment",
  topics: [
    {
      key: "traffic-accident",
      label: "交通事故",
      matchers: [{ kind: "title", pattern: "交通事故|交通安全|自動車保険|運転免許" }],
    },
    {
      key: "crime",
      label: "犯罪",
      matchers: [{ kind: "title", pattern: "刑法犯|認知件数|検挙|凶悪犯|窃盗|犯罪|少年" }],
    },
    {
      key: "disaster-fire",
      label: "災害・消防",
      matchers: [{ kind: "title", pattern: "火災|消防|救急|災害|水害|地震|避難" }],
    },
    {
      key: "waste",
      label: "廃棄物・リサイクル",
      matchers: [{ kind: "title", pattern: "ごみ|廃棄物|リサイクル|し尿|最終処分" }],
    },
    {
      key: "pollution",
      label: "公害・大気水質",
      matchers: [{ kind: "title", pattern: "公害|汚濁|ばい煙|粉じん|騒音|大気|水質|BOD|COD" }],
    },
    {
      key: "suicide",
      label: "自殺",
      matchers: [{ kind: "title", pattern: "自殺" }],
    },
  ],
};

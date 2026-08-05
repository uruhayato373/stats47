import type { CategoryTopicCatalog } from "../types";

/**
 * 人口・世帯 (138 件)
 *
 * 死因別死亡者数 17 件、未婚・配偶関係 13 件、人口移動 (転入・転出)、
 * 年齢構成、世帯、外国人が主な塊。
 */
export const POPULATION_TOPICS: CategoryTopicCatalog = {
  categoryKey: "population",
  topics: [
    {
      key: "cause-of-death",
      label: "死因別の死亡",
      matchers: [{ kind: "title", pattern: "による死亡|死因|死亡率$|死亡者数$" }],
    },
    {
      key: "migration",
      label: "人口移動",
      matchers: [{ kind: "title", pattern: "転入|転出|移動|流入|流出" }],
    },
    {
      key: "marital",
      label: "配偶関係",
      matchers: [{ kind: "title", pattern: "未婚|有配偶|死別|離別|婚姻|離婚" }],
    },
    {
      key: "age-structure",
      label: "年齢構成",
      matchers: [{ kind: "title", pattern: "歳以上|歳未満|年少|生産年齢|老年|高齢化|平均年齢|年齢" }],
    },
    {
      key: "birth",
      label: "出生",
      matchers: [{ kind: "title", pattern: "出生|合計特殊|新生児|周産期" }],
    },
    {
      key: "household",
      label: "世帯",
      matchers: [{ kind: "title", pattern: "世帯" }],
    },
    {
      key: "foreign",
      label: "外国人",
      matchers: [{ kind: "title", pattern: "外国人" }],
    },
    {
      key: "density",
      label: "人口の分布・密度",
      matchers: [{ kind: "title", pattern: "人口密度|昼夜間|可住地|人口性比|人口増減|人口$" }],
    },
  ],
};

// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/single-parent-households.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const SINGLE_PARENT_HOUSEHOLDS_SET: IndicatorSet = {
  "key": "single-parent-households",
  "title": "ひとり親家庭の生活",
  "description": "母子・父子世帯の就業、母子世帯の所得構成、公的支援の利用を別々に比較します。就業は子20歳未満、所得は子18歳未満の世帯が対象です。生活保護は年度平均世帯数、児童扶養手当は年度末受給者数で、同じ母数の率ではありません。",
  "category": "demographics",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "single-mother-employment-rate",
      "shortLabel": "母子世帯の母の就業割合（労働状態不詳を除く）",
      "role": "primary"
    },
    {
      "rankingKey": "single-father-employment-rate",
      "shortLabel": "父子世帯の父の就業割合（労働状態不詳を除く）",
      "role": "secondary"
    },
    {
      "rankingKey": "single-mother-households",
      "shortLabel": "母子世帯数",
      "role": "secondary"
    },
    {
      "rankingKey": "single-father-households",
      "shortLabel": "父子世帯数",
      "role": "secondary"
    },
    {
      "rankingKey": "single-mother-public-assistance-households",
      "shortLabel": "生活保護を受ける母子世帯数（年度平均）",
      "role": "secondary"
    },
    {
      "rankingKey": "child-rearing-allowance-recipients",
      "shortLabel": "児童扶養手当受給者数（年度末）",
      "role": "secondary"
    },
    {
      "rankingKey": "single-mother-households-income-under100",
      "shortLabel": "母子世帯の所得100万円未満",
      "role": "context"
    },
    {
      "rankingKey": "single-mother-households-income-100to199",
      "shortLabel": "母子世帯の所得100〜199万円",
      "role": "context"
    },
    {
      "rankingKey": "single-mother-households-income-200to299",
      "shortLabel": "母子世帯の所得200〜299万円",
      "role": "context"
    },
    {
      "rankingKey": "single-mother-households-income-300to399",
      "shortLabel": "母子世帯の所得300〜399万円",
      "role": "context"
    },
    {
      "rankingKey": "single-mother-households-income-400to499",
      "shortLabel": "母子世帯の所得400〜499万円",
      "role": "context"
    },
    {
      "rankingKey": "single-mother-households-income-500plus",
      "shortLabel": "母子世帯の所得500万円以上",
      "role": "context"
    }
  ],
  "keywords": [
    "ひとり親",
    "母子世帯",
    "父子世帯",
    "所得",
    "就業"
  ]
};

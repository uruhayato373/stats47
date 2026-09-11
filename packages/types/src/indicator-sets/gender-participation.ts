// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/gender-participation.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const GENDER_PARTICIPATION_SET: IndicatorSet = {
  "key": "gender-participation",
  "title": "地域の男女共同参画",
  "description": "男女の賃金・労働力人口比率に加え、15歳以上の男女の家事時間を比較します。家事時間は行わなかった人を含む1日当たりの総平均で、夫婦に限定した値ではありません。管理職は原則2025年4月1日、県議会議員は2024年12月31日現在。管理職は都道府県職員の部局長・次長・課長相当職で、教職員を除きます。議員の分母は定数ではなく現員数です。政令市・市区町村は両系列から除き、各対象の公表割合を比較します。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "gender-wage-gap",
      "shortLabel": "男女間賃金比（女性／男性）",
      "role": "primary"
    },
    {
      "rankingKey": "labor-force-population-ratio-woman",
      "shortLabel": "女性労働力人口比率",
      "role": "secondary"
    },
    {
      "rankingKey": "labor-force-population-ratio-man",
      "shortLabel": "男性労働力人口比率",
      "role": "secondary"
    },
    {
      "rankingKey": "housework-avg-time-female",
      "shortLabel": "女性の家事時間（15歳以上・1日平均）",
      "role": "secondary"
    },
    {
      "rankingKey": "housework-avg-time-male",
      "shortLabel": "男性の家事時間（15歳以上・1日平均）",
      "role": "secondary"
    },
    {
      "rankingKey": "female-part-time-hourly-wage",
      "shortLabel": "女性パートタイム時給",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-manager-female-share",
      "shortLabel": "都道府県の管理職に占める女性の割合",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-assembly-female-share",
      "shortLabel": "都道府県議会議員に占める女性の割合",
      "role": "secondary"
    }
  ],
  "keywords": [
    "男女共同参画",
    "女性就業",
    "賃金格差",
    "家事時間"
  ]
};

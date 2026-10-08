// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: data/themes/catalogs/health-checkups.json
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HEALTH_CHECKUPS_SET: IndicatorSet = {
  "key": "health-checkups",
  "title": "生活習慣と健診",
  "description": "40〜74歳の特定健診受診率、保健指導の実施率、受診者のメタボ該当割合を比較します。受診率の分母は県人口に基づく対象者の推計で、県民全体の健康状態を示す値ではありません。歯科健診は別の対象・分母で表示します。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "specific-health-checkup-participation-rate",
      "shortLabel": "特定健診受診率（県別推計対象者が分母）",
      "role": "primary"
    },
    {
      "rankingKey": "specific-health-guidance-completion-rate",
      "shortLabel": "特定保健指導実施率",
      "role": "secondary"
    },
    {
      "rankingKey": "metabolic-syndrome-prevalence-among-checkup-recipients",
      "shortLabel": "特定健診受診者のメタボ該当割合",
      "role": "secondary"
    },
    {
      "rankingKey": "health-checkup-recipients",
      "shortLabel": "生活習慣病健康診断受診延人員",
      "role": "secondary"
    },
    {
      "rankingKey": "dental-checkup-persons-per-1000",
      "shortLabel": "歯科健診受診延人員（人口千人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "health-checkup-late-dinner-rate",
      "shortLabel": "就寝前2時間以内の夕食が週3回以上",
      "role": "secondary"
    },
    {
      "rankingKey": "health-checkup-breakfast-skipping-rate",
      "shortLabel": "朝食を抜くことが週3回以上",
      "role": "secondary"
    },
    {
      "rankingKey": "vegetable-intake-male-age-adjusted",
      "shortLabel": "男性の野菜摂取量（年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "vegetable-intake-female-age-adjusted",
      "shortLabel": "女性の野菜摂取量（年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "salt-intake-male-age-adjusted",
      "shortLabel": "男性の食塩摂取量（年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "salt-intake-female-age-adjusted",
      "shortLabel": "女性の食塩摂取量（年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "bmi-female-40to69-age-adjusted",
      "shortLabel": "女性のBMI（40〜69歳）",
      "role": "context"
    },
    {
      "rankingKey": "bmi-male-20to69-age-adjusted",
      "shortLabel": "男性のBMI（20〜69歳）",
      "role": "context"
    },
    {
      "rankingKey": "smoking-rate-male-age-adjusted",
      "shortLabel": "男性の習慣的喫煙者割合",
      "role": "context"
    },
    {
      "rankingKey": "alcohol-sales-per-adult-beer",
      "shortLabel": "酒類販売数量（ビール・成人1人）",
      "role": "context"
    },
    {
      "rankingKey": "alcohol-sales-per-adult-sake",
      "shortLabel": "酒類販売数量（清酒・成人1人）",
      "role": "context"
    },
    {
      "rankingKey": "alcohol-sales-per-adult-shochu",
      "shortLabel": "酒類販売数量（焼酎・成人1人）",
      "role": "context"
    },
    {
      "rankingKey": "alcohol-sales-per-adult-total",
      "shortLabel": "酒類販売数量（合計・成人1人）",
      "role": "context"
    },
    {
      "rankingKey": "alcohol-sales-per-adult-whisky",
      "shortLabel": "酒類販売数量（ウイスキー・成人1人）",
      "role": "context"
    },
    {
      "rankingKey": "alcohol-sales-per-adult-wine",
      "shortLabel": "酒類販売数量（ワイン・成人1人）",
      "role": "context"
    }
  ],
  "keywords": [
    "健診",
    "生活習慣病",
    "保健指導",
    "歯科健診"
  ]
};

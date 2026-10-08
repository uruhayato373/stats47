// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: data/themes/catalogs/sports-participation.json
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const SPORTS_PARTICIPATION_SET: IndicatorSet = {
  "key": "sports-participation",
  "title": "スポーツ施設と利用",
  "description": "スポーツの年間行動者率・観覧率と社会体育施設数を参加と供給に分けて比較します。施設数から利用者数は推計しません。",
  "category": "education",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "sports-annual-participation-rate-10plus",
      "shortLabel": "スポーツ年間行動者率（10歳以上）",
      "role": "primary"
    },
    {
      "rankingKey": "hobby-participation-rate-sports-spectating",
      "shortLabel": "スポーツ観覧の行動者率",
      "role": "secondary"
    },
    {
      "rankingKey": "community-sports-facility-count-per-million",
      "shortLabel": "社会体育施設数（人口100万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "sports-park-count",
      "shortLabel": "運動公園数",
      "role": "secondary"
    },
    {
      "rankingKey": "daily-steps-male-20to64-age-adjusted",
      "shortLabel": "男性の歩数（20〜64歳・年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "daily-steps-female-20to64-age-adjusted",
      "shortLabel": "女性の歩数（20〜64歳・年齢調整）",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary-school-gymnasium-count",
      "shortLabel": "小学校体育館設置箇所数",
      "role": "secondary"
    },
    {
      "rankingKey": "junior-high-school-gymnasium-count",
      "shortLabel": "中学校体育館設置箇所数",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-fitness-score-male",
      "shortLabel": "小学5年男子の体力合計点",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-fitness-score-female",
      "shortLabel": "小学5年女子の体力合計点",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-weekly-exercise-420min-rate-male",
      "shortLabel": "小学5年男子の週420分以上運動割合",
      "role": "secondary"
    },
    {
      "rankingKey": "elementary5-weekly-exercise-420min-rate-female",
      "shortLabel": "小学5年女子の週420分以上運動割合",
      "role": "secondary"
    },
    {
      "rankingKey": "swimming-pool-public",
      "shortLabel": "水泳プール数（公共・実数）",
      "role": "context"
    },
    {
      "rankingKey": "public-swimming-pool-count-per-million",
      "shortLabel": "水泳プール数（人口100万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "public-gymnasium-count-per-million",
      "shortLabel": "体育館数",
      "role": "context"
    },
    {
      "rankingKey": "baseball-field-public",
      "shortLabel": "野球場・ソフトボール場数（公共）",
      "role": "context"
    },
    {
      "rankingKey": "athletics-stadium-count-public",
      "shortLabel": "陸上競技場数",
      "role": "context"
    },
    {
      "rankingKey": "sports-participation-rate-golf",
      "shortLabel": "ゴルフの行動者率",
      "role": "context"
    },
    {
      "rankingKey": "sports-participation-rate-cycling",
      "shortLabel": "サイクリングの行動者率",
      "role": "context"
    },
    {
      "rankingKey": "sports-participation-rate-skiing",
      "shortLabel": "スキー・スノーボードの行動者率",
      "role": "context"
    },
    {
      "rankingKey": "sports-participation-rate-fishing",
      "shortLabel": "つりの行動者率",
      "role": "context"
    },
    {
      "rankingKey": "sports-participation-rate-hiking",
      "shortLabel": "登山・ハイキングの行動者率",
      "role": "context"
    },
    {
      "rankingKey": "high-school-club-per100-rugby-male",
      "shortLabel": "高校男子ラグビー部員数（100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-badminton",
      "shortLabel": "中学部活動部員数（バドミントン・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-baseball-soft",
      "shortLabel": "中学部活動部員数（野球・ソフトボール・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-basketball",
      "shortLabel": "中学部活動部員数（バスケットボール・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-kendo",
      "shortLabel": "中学部活動部員数（剣道・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-soccer",
      "shortLabel": "中学部活動部員数（サッカー・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-soft-tennis",
      "shortLabel": "中学部活動部員数（ソフトテニス・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-swimming",
      "shortLabel": "中学部活動部員数（水泳・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-table-tennis",
      "shortLabel": "中学部活動部員数（卓球・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-track-and-field",
      "shortLabel": "中学部活動部員数（陸上競技・100人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "junior-high-club-per100-volleyball",
      "shortLabel": "中学部活動部員数（バレーボール・100人当たり）",
      "role": "context"
    }
  ],
  "keywords": [
    "スポーツ",
    "施設",
    "運動",
    "観覧"
  ]
};

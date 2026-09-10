// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/healthcare.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const HEALTHCARE_SET: IndicatorSet = {
  "key": "healthcare",
  "title": "医療・健康",
  "description": "医療資源の供給、入院利用と費用、健康アウトカムの違いを順に把握する。",
  "category": "welfare",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "physicians-in-medical-facilities-per-100k",
      "shortLabel": "医師数（人口10万人当たり）",
      "role": "primary"
    },
    {
      "rankingKey": "nurses-in-medical-facilities-per-100k",
      "shortLabel": "看護師・准看護師数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-count-per-100k",
      "shortLabel": "一般病院数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-bed-count-per-100k",
      "shortLabel": "一般病院病床数（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "pharmacy-count-per-100k",
      "shortLabel": "薬局数（人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "national-medical-expense-per-person",
      "shortLabel": "1人当たり国民医療費",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-avg-length-of-stay",
      "shortLabel": "一般病院の平均在院日数",
      "role": "secondary"
    },
    {
      "rankingKey": "general-hospital-bed-occupancy-rate",
      "shortLabel": "病床利用率",
      "role": "secondary"
    },
    {
      "rankingKey": "deaths-lifestyle-diseases-per-100k",
      "shortLabel": "生活習慣病死亡（日本人人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "deaths-diabetes-per-100k",
      "shortLabel": "糖尿病死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-malignant-neoplasms-per-100k",
      "shortLabel": "悪性新生物死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-heart-disease-excl-hypertensive-per-100k",
      "shortLabel": "心疾患（高血圧性を除く）死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-cerebrovascular-disease-per-100k",
      "shortLabel": "脳血管疾患死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "deaths-hypertensive-diseases-per-100k",
      "shortLabel": "高血圧性疾患死亡（日本人人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "psychiatric-hospital-count-per-100k",
      "shortLabel": "精神科病院数（人口10万人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "treatment-rate-mood-disorder-outpatient",
      "shortLabel": "気分障害の外来受療率（人口10万人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "healthy-life-expectancy-male",
      "shortLabel": "健康寿命（男性）",
      "role": "secondary"
    },
    {
      "rankingKey": "healthy-life-expectancy-female",
      "shortLabel": "健康寿命（女性）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-hospital-arrival-time",
      "shortLabel": "救急搬送の病院収容所要時間",
      "role": "secondary"
    },
    {
      "rankingKey": "medical-physicians-under-40",
      "shortLabel": "40歳未満の医療施設従事医師数（2024年末）",
      "role": "secondary"
    },
    {
      "rankingKey": "medical-physicians-age-40-59",
      "shortLabel": "40〜59歳の医療施設従事医師数（2024年末）",
      "role": "secondary"
    },
    {
      "rankingKey": "medical-physicians-age-60-plus",
      "shortLabel": "60歳以上の医療施設従事医師数（2024年末）",
      "role": "secondary"
    },
    {
      "rankingKey": "medical-physicians-pediatrics",
      "shortLabel": "小児科の医師数（2024年末）",
      "role": "secondary"
    },
    {
      "rankingKey": "medical-physicians-obstetrics-gynecology",
      "shortLabel": "産婦人科系の医師数（2024年末）",
      "role": "secondary"
    },
    {
      "rankingKey": "medical-physicians-emergency-medicine",
      "shortLabel": "救急科の医師数（2024年末）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-transported-persons",
      "shortLabel": "救急自動車による搬送人員",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-transported-deaths",
      "shortLabel": "救急搬送人員（初診時死亡）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-transported-severe",
      "shortLabel": "救急搬送人員（重症）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-transported-moderate",
      "shortLabel": "救急搬送人員（中等症）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-transported-mild",
      "shortLabel": "救急搬送人員（軽症）",
      "role": "secondary"
    },
    {
      "rankingKey": "ambulance-transported-other",
      "shortLabel": "救急搬送人員（その他）",
      "role": "secondary"
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動件数（人口千人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "delivery-hospital-count",
      "shortLabel": "分娩取扱病院数（2023年）",
      "role": "secondary"
    },
    {
      "rankingKey": "delivery-clinic-count",
      "shortLabel": "分娩取扱診療所数（2023年）",
      "role": "secondary"
    },
    {
      "rankingKey": "general-perinatal-center-count",
      "shortLabel": "総合周産期母子医療センター（2026年）",
      "role": "secondary"
    },
    {
      "rankingKey": "regional-perinatal-center-count",
      "shortLabel": "地域周産期母子医療センター（2026年）",
      "role": "secondary"
    },
    {
      "rankingKey": "home-medical-visit-cases",
      "shortLabel": "訪問診療実施件数（2023年9月）",
      "role": "secondary"
    },
    {
      "rankingKey": "home-nursing-visit-cases",
      "shortLabel": "訪問看護・指導実施件数（2023年9月）",
      "role": "secondary"
    },
    {
      "rankingKey": "home-helper-users-per-office",
      "shortLabel": "訪問介護利用者数（1事業所当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "home-care-worker-annual-income",
      "shortLabel": "訪問介護従事者平均年収",
      "role": "secondary"
    },
    {
      "rankingKey": "life-expectancy-0-male",
      "shortLabel": "男性平均寿命（2020年）",
      "role": "secondary"
    },
    {
      "rankingKey": "life-expectancy-0-female",
      "shortLabel": "女性平均寿命（2020年）",
      "role": "secondary"
    },
    {
      "rankingKey": "new-cancer-incidence-count",
      "shortLabel": "がんの新規罹患数（2023年）",
      "role": "secondary"
    },
    {
      "rankingKey": "k6-score10plus-rate-12plus",
      "shortLabel": "K6が10点以上の割合（12歳以上・不詳除外）",
      "role": "secondary"
    },
    {
      "rankingKey": "municipal-mental-health-consultation-extended-persons",
      "shortLabel": "市区町村の精神保健福祉相談延人員",
      "role": "secondary"
    },
    {
      "rankingKey": "k6-score10plus-estimated-persons-12plus",
      "shortLabel": "K6が10点以上の推計人数（分子）",
      "role": "context"
    },
    {
      "rankingKey": "k6-known-score-estimated-persons-12plus",
      "shortLabel": "K6の点数が判明している推計人数（分母）",
      "role": "context"
    }
  ],
  "keywords": [
    "医師数",
    "病院数",
    "医療費",
    "医療格差",
    "都道府県",
    "ランキング"
  ]
};

// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/real-income.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const REAL_INCOME_SET: IndicatorSet = {
  "key": "real-income",
  "title": "実質収入・購買力",
  "description": "勤労者世帯の実収入から控除後・物価補正後の購買力を、対象世帯を揃えて比較する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "household-survey-food-expenditure",
      "shortLabel": "食料",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-housing-expenditure",
      "shortLabel": "住居",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-utilities-expenditure",
      "shortLabel": "光熱・水道",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-furniture-household-goods-expenditure",
      "shortLabel": "家具・家事用品",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-clothing-footwear-expenditure",
      "shortLabel": "被服及び履物",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-healthcare-expenditure",
      "shortLabel": "保健医療",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-transport-communication-expenditure",
      "shortLabel": "交通・通信",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-education-expenditure",
      "shortLabel": "教育",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-culture-recreation-expenditure",
      "shortLabel": "教養娯楽",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-other-expenditure",
      "shortLabel": "その他の消費支出",
      "role": "context"
    },
    {
      "rankingKey": "disposable-income-worker-households",
      "shortLabel": "可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "actual-income-worker-households-per-month",
      "shortLabel": "実収入（勤労者世帯・1世帯当たり月額）",
      "role": "secondary"
    },
    {
      "rankingKey": "per-capita-prefectural-income-h27",
      "shortLabel": "県民所得/人",
      "role": "context"
    },
    {
      "rankingKey": "annual-income-per-household",
      "shortLabel": "年間収入（1世帯当たり）",
      "role": "context"
    },
    {
      "rankingKey": "real-disposable-income",
      "shortLabel": "実質可処分所得",
      "role": "primary"
    },
    {
      "rankingKey": "disposable-income-after-rent",
      "shortLabel": "家賃差引後の参考月額",
      "role": "secondary"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall",
      "shortLabel": "CPI総合",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-overall-excl-rent",
      "shortLabel": "CPI(家賃除く)",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-housing",
      "shortLabel": "CPI(住居)",
      "role": "context"
    },
    {
      "rankingKey": "private-rental-housing-rent-per-3-3m2",
      "shortLabel": "家賃/3.3m²",
      "role": "context"
    },
    {
      "rankingKey": "private-rent-consumption-expenditure",
      "shortLabel": "家賃支出",
      "role": "context"
    },
    {
      "rankingKey": "consumer-price-difference-index-food",
      "shortLabel": "消費者物価地域差指数",
      "role": "context"
    },
    {
      "rankingKey": "household-survey-consumption-expenditure",
      "shortLabel": "消費支出（全費目）",
      "role": "secondary"
    },
    {
      "rankingKey": "gini-coefficient-disposable-income",
      "shortLabel": "等価可処分所得ジニ係数（総世帯）",
      "role": "secondary"
    },
    {
      "rankingKey": "gini-coefficient-financial-assets",
      "shortLabel": "等価金融資産残高ジニ係数（総世帯）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "実質年収",
    "実質購買力",
    "物価補正",
    "可処分所得",
    "家賃控除",
    "手残り",
    "都道府県",
    "ランキング"
  ]
};

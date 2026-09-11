// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/local-finance.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const LOCAL_FINANCE_SET: IndicatorSet = {
  "key": "local-finance",
  "title": "地方財政",
  "description": "都道府県の歳入歳出、財政の弾力性、現在と将来の負担を決算年度付きで把握する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "shortLabel": "財政力指数",
      "role": "primary"
    },
    {
      "rankingKey": "current-balance-ratio",
      "shortLabel": "経常収支比率",
      "role": "secondary"
    },
    {
      "rankingKey": "real-public-debt-service-ratio",
      "shortLabel": "実質公債費比率",
      "role": "primary"
    },
    {
      "rankingKey": "future-burden-ratio",
      "shortLabel": "将来負担比率",
      "role": "secondary"
    },
    {
      "rankingKey": "real-balance-ratio",
      "shortLabel": "実質収支比率",
      "role": "context"
    },
    {
      "rankingKey": "local-tax-ratio-pref-finance",
      "shortLabel": "地方税割合",
      "role": "context"
    },
    {
      "rankingKey": "local-allocation-tax-ratio-pref-finance",
      "shortLabel": "交付税割合",
      "role": "context"
    },
    {
      "rankingKey": "national-treasury-disbursement-ratio-pref-finance",
      "shortLabel": "国庫支出金割合",
      "role": "context"
    },
    {
      "rankingKey": "self-financing-ratio",
      "shortLabel": "自主財源割合",
      "role": "context"
    },
    {
      "rankingKey": "per-capita-total-expenditure-pref-municipal",
      "shortLabel": "歳出決算総額（人口1人当たり）",
      "role": "secondary"
    },
    {
      "rankingKey": "personnel-expenditure-ratio-pref-finance",
      "shortLabel": "人件費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "assistance-expenditure-ratio-pref-finance",
      "shortLabel": "扶助費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "investment-expenditure-ratio-pref-finance",
      "shortLabel": "投資的経費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "welfare-expenditure-ratio-pref-finance",
      "shortLabel": "民生費割合",
      "role": "context"
    },
    {
      "rankingKey": "education-expenditure-ratio-pref-finance",
      "shortLabel": "教育費割合",
      "role": "context"
    },
    {
      "rankingKey": "public-works-expenditure-ratio-pref-finance",
      "shortLabel": "土木費割合",
      "role": "context"
    },
    {
      "rankingKey": "per-capita-inhabitant-tax-pref-municipal",
      "shortLabel": "住民税（人口1人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "per-taxpayer-taxable-income",
      "shortLabel": "課税対象所得（納税義務者1人当たり）",
      "role": "context"
    },
    {
      "rankingKey": "taxpayer-ratio-per-pref-resident",
      "shortLabel": "納税義務者割合",
      "role": "context"
    },
    {
      "rankingKey": "laspeyres-index-prefecture",
      "shortLabel": "ラスパイレス指数",
      "role": "context"
    },
    {
      "rankingKey": "child-welfare-expenses-prefecture",
      "shortLabel": "児童福祉費（都道府県財政）",
      "role": "secondary"
    },
    {
      "rankingKey": "child-welfare-expenditure-ratio-pref-finance",
      "shortLabel": "児童福祉費割合",
      "role": "secondary"
    },
    {
      "rankingKey": "child-rearing-allowance-recipients",
      "shortLabel": "児童扶養手当受給者数（ひとり親等）",
      "role": "secondary"
    },
    {
      "rankingKey": "maintenance-repair-expenses-prefecture",
      "shortLabel": "維持補修費（都道府県財政）",
      "role": "secondary"
    },
    {
      "rankingKey": "ordinary-construction-expenses-prefecture",
      "shortLabel": "普通建設事業費（都道府県財政）",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-public-building-floor-area",
      "shortLabel": "都道府県有建物の延面積（年度末）",
      "role": "secondary"
    },
    {
      "rankingKey": "prefectural-general-administration-staff",
      "shortLabel": "一般行政部門職員数（都道府県）",
      "role": "secondary"
    },
    {
      "rankingKey": "avg-salary-admin-prefecture",
      "shortLabel": "一般行政職の平均給与月額（都道府県）",
      "role": "secondary"
    },
    {
      "rankingKey": "avg-age-admin-prefecture",
      "shortLabel": "一般行政職の平均年齢（都道府県）",
      "role": "secondary"
    },
    {
      "rankingKey": "avg-salary-education-prefecture",
      "shortLabel": "教育公務員の平均給与月額（都道府県）",
      "role": "secondary"
    },
    {
      "rankingKey": "avg-salary-police-prefecture",
      "shortLabel": "警察職の平均給与月額（都道府県）",
      "role": "secondary"
    },
    {
      "rankingKey": "police-department-staff",
      "shortLabel": "警察部門職員数（都道府県）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-donation-amount-prefecture",
      "shortLabel": "受入額（県自身）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-donation-count-prefecture",
      "shortLabel": "受入件数（県自身）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-fundraising-cost-prefecture",
      "shortLabel": "募集経費（県自身）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-return-gift-procurement-cost-prefecture",
      "shortLabel": "返礼品調達費（募集費の内数）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-return-gift-shipping-cost-prefecture",
      "shortLabel": "返礼品送付費（募集費の内数）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-tax-deduction-municipal-prefecture",
      "shortLabel": "市町村民税控除額（県内課税分・推計値含む）",
      "role": "secondary"
    },
    {
      "rankingKey": "furusato-tax-deduction-prefectural-prefecture",
      "shortLabel": "道府県民税控除額（県内課税分・推計値含む）",
      "role": "secondary"
    }
  ],
  "keywords": [
    "地方財政",
    "財政力指数",
    "経常収支比率",
    "実質公債費比率",
    "将来負担比率",
    "地方税",
    "地方交付税",
    "歳出構造",
    "都道府県",
    "ランキング"
  ]
};

import type { IndicatorSet } from "../indicator-set";

export const LOCAL_FINANCE_SET: IndicatorSet = {
  key: "local-finance",
  title: "地方財政",
  description:
    "都道府県別の財政力指数・経常収支比率・実質公債費比率・歳出構造をランキングとコロプレス地図で比較。地方税割合、交付税依存度、将来負担比率など主要財政指標の推移を47都道府県のデータで確認できます。",
  category: "economy",
  usage: "theme",
  indicators: [
    { rankingKey: "fiscal-strength-index-prefecture", shortLabel: "財政力指数", role: "primary" },
    { rankingKey: "current-balance-ratio", shortLabel: "経常収支比率", role: "secondary" },
    { rankingKey: "real-public-debt-service-ratio", shortLabel: "実質公債費比率", role: "secondary" },
    { rankingKey: "future-burden-ratio", shortLabel: "将来負担比率", role: "secondary" },
    { rankingKey: "real-balance-ratio", shortLabel: "実質収支比率", role: "secondary" },
    { rankingKey: "local-tax-ratio-pref-finance", shortLabel: "地方税割合", role: "secondary" },
    { rankingKey: "local-allocation-tax-ratio-pref-finance", shortLabel: "交付税割合", role: "secondary" },
    { rankingKey: "national-treasury-disbursement-ratio-pref-finance", shortLabel: "国庫支出金割合", role: "secondary" },
    { rankingKey: "self-financing-ratio", shortLabel: "自主財源割合", role: "secondary" },
    { rankingKey: "per-capita-total-expenditure-pref-municipal", shortLabel: "1人当たり歳出", role: "secondary" },
    { rankingKey: "personnel-expenditure-ratio-pref-finance", shortLabel: "人件費割合", role: "secondary" },
    { rankingKey: "welfare-expenditure-ratio-pref-finance", shortLabel: "民生費割合", role: "secondary" },
    { rankingKey: "education-expenditure-ratio-pref-finance", shortLabel: "教育費割合", role: "secondary" },
    { rankingKey: "public-works-expenditure-ratio-pref-finance", shortLabel: "土木費割合", role: "secondary" },
    { rankingKey: "per-capita-inhabitant-tax-pref-municipal", shortLabel: "住民税", role: "secondary" },
    { rankingKey: "per-taxpayer-taxable-income", shortLabel: "課税所得", role: "secondary" },
    { rankingKey: "taxpayer-ratio-per-pref-resident", shortLabel: "納税義務者割合", role: "secondary" },
    { rankingKey: "laspeyres-index-prefecture", shortLabel: "ラスパイレス指数", role: "secondary" },
  ],
  panelTabs: [
    {
      label: "財政健全度",
      rankingKeys: [
        "fiscal-strength-index-prefecture",
        "current-balance-ratio",
        "real-public-debt-service-ratio",
        "future-burden-ratio",
        "real-balance-ratio",
      ],
    },
    {
      label: "歳入構造",
      rankingKeys: [
        "local-tax-ratio-pref-finance",
        "local-allocation-tax-ratio-pref-finance",
        "national-treasury-disbursement-ratio-pref-finance",
        "self-financing-ratio",
      ],
    },
    {
      label: "歳出構造",
      rankingKeys: [
        "per-capita-total-expenditure-pref-municipal",
        "personnel-expenditure-ratio-pref-finance",
        "welfare-expenditure-ratio-pref-finance",
        "education-expenditure-ratio-pref-finance",
        "public-works-expenditure-ratio-pref-finance",
      ],
    },
    {
      label: "税収・所得",
      rankingKeys: [
        "per-capita-inhabitant-tax-pref-municipal",
        "per-taxpayer-taxable-income",
        "taxpayer-ratio-per-pref-resident",
        "laspeyres-index-prefecture",
      ],
    },
  ],
  keywords: [
    "地方財政",
    "財政力指数",
    "経常収支比率",
    "実質公債費比率",
    "将来負担比率",
    "地方税",
    "地方交付税",
    "歳出構造",
    "都道府県",
    "ランキング",
  ],
};

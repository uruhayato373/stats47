import type { IndicatorSet } from "../indicator-set";

export const MANUFACTURING_SET: IndicatorSet = {
  key: "manufacturing",
  title: "製造業",
  description:
    "都道府県別の製造品出荷額・付加価値額・事業所数・従業者数を地図とランキングで比較。製造業の地域差を47都道府県のデータで確認できます。",
  category: "industry",
  usage: "theme",
  indicators: [
    // 生産規模
    { rankingKey: "manufacturing-shipment-amount", shortLabel: "出荷額", role: "primary" },
    { rankingKey: "manufacturing-industry-added-value", shortLabel: "付加価値額", role: "secondary" },
    { rankingKey: "manufacturing-sales-private", shortLabel: "製造品売上高", role: "context" },
    { rankingKey: "manufacturing-net-value-added-private", shortLabel: "純付加価値額", role: "context" },
    // 事業所・雇用
    { rankingKey: "manufacturing-establishments", shortLabel: "事業所数", role: "secondary" },
    { rankingKey: "manufacturing-employees", shortLabel: "従業者数", role: "secondary" },
    { rankingKey: "manufacturing-establishment-site-area", shortLabel: "敷地面積", role: "context" },
    { rankingKey: "factory-establishment-count", shortLabel: "工場立地件数", role: "context" },
    // 生産性
    { rankingKey: "manufacturing-shipment-amount-per-employee", shortLabel: "出荷額/人", role: "secondary" },
    { rankingKey: "manufacturing-shipment-amount-per-establishment", shortLabel: "出荷額/所", role: "secondary" },
    // 土地・インフラ
    { rankingKey: "industrial-land-price", shortLabel: "工業地価格", role: "context" },
    { rankingKey: "industrial-land-price-change-rate", shortLabel: "工業地価変動率", role: "context" },
    { rankingKey: "industrial-water-usage", shortLabel: "工業用水量", role: "context" },
  ],
  panelTabs: [
    {
      label: "生産規模",
      rankingKeys: [
        "manufacturing-shipment-amount",
        "manufacturing-industry-added-value",
        "manufacturing-sales-private",
        "manufacturing-net-value-added-private",
      ],
      charts: [
        {
          type: "donut-action",
          label: "産業別出荷額構成",
          actionId: "manufacturing-composition",
          source: "経済センサス-活動調査（2020年）",
        },
        {
          type: "dual-line",
          label: "製造品出荷額と付加価値額の推移",
          series: [
            { rankingKey: "manufacturing-shipment-amount", name: "出荷額等", color: "#3b82f6" },
            { rankingKey: "manufacturing-industry-added-value", name: "付加価値額", color: "#22c55e" },
          ],
          unit: "百万円",
          source: "工業統計調査 / 経済センサス",
        },
      ],
    },
    {
      label: "事業所・雇用",
      rankingKeys: [
        "manufacturing-establishments",
        "manufacturing-employees",
        "manufacturing-establishment-site-area",
        "factory-establishment-count",
      ],
      charts: [
        {
          type: "dual-line",
          label: "事業所数と従業者数の推移",
          series: [
            { rankingKey: "manufacturing-establishments", name: "事業所数", color: "#f59e0b" },
            { rankingKey: "manufacturing-employees", name: "従業者数", color: "#8b5cf6" },
          ],
          source: "工業統計調査 / 経済センサス",
        },
      ],
    },
    {
      label: "生産性・土地",
      rankingKeys: [
        "manufacturing-shipment-amount-per-employee",
        "manufacturing-shipment-amount-per-establishment",
        "industrial-land-price",
        "industrial-land-price-change-rate",
        "industrial-water-usage",
      ],
    },
  ],
  keywords: [
    "製造業",
    "製造品出荷額",
    "付加価値額",
    "工場",
    "事業所",
    "都道府県",
    "ランキング",
  ],
};

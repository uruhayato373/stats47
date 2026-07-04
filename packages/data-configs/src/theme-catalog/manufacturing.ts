import type { ThemeCatalog } from "./types";

/**
 * 製造業テーマの統合カタログ (SSOT)。
 *
 * 移行元:
 *   - 指標:   packages/types/src/indicator-sets/manufacturing.ts (MANUFACTURING_SET)
 *   - チャート: apps/web/scripts/data/page-components/theme/manufacturing.json
 *
 * 生成物 (このファイルを編集 → `npm run generate:catalog` で再生成):
 *   - packages/types/src/indicator-sets/manufacturing.ts (codegen)
 *   - apps/web/scripts/data/page-components/theme/manufacturing.json (R2 verbatim export 用)
 */
export const MANUFACTURING_CATALOG: ThemeCatalog = {
  key: "manufacturing",
  title: "製造業",
  description:
    "都道府県別の製造品出荷額・付加価値額・事業所数・従業者数をランキングとチャートで比較。製造業の地域差を47都道府県のデータで確認できます。",
  category: "industry",
  usage: "theme",
  metrics: [
    // 生産規模
    { rankingKey: "manufacturing-shipment-amount", shortLabel: "出荷額", role: "primary" },
    { rankingKey: "manufacturing-industry-added-value", shortLabel: "付加価値額", role: "secondary" },
    { rankingKey: "manufacturing-sales-private", shortLabel: "製造品売上高", role: "context" },
    { rankingKey: "manufacturing-net-value-added-private", shortLabel: "純付加価値額", role: "context" },
    // 事業所・雇用
    { rankingKey: "manufacturing-establishments", shortLabel: "事業所数", role: "secondary" },
    { rankingKey: "manufacturing-employees", shortLabel: "従業者数", role: "secondary" },
    { rankingKey: "manufacturing-establishment-site-area", shortLabel: "敷地面積", role: "context" },
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
    },
    {
      label: "事業所・雇用",
      rankingKeys: [
        "manufacturing-establishments",
        "manufacturing-employees",
        "manufacturing-establishment-site-area",
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
  charts: [
    {
      componentKey: "manufacturing-establishments-employees-trend",
      componentType: "line-chart",
      title: "事業所数と従業者数の推移",
      componentProps: {
        estatParams: [
          { statsDataId: "0000010103", cdCat01: "C3403" },
          { statsDataId: "0000010103", cdCat01: "C3404" },
        ],
        labels: ["事業所数", "従業者数"],
        seriesColors: ["#f59e0b", "#8b5cf6"],
      },
      relatedRankingKeys: ["manufacturing-establishments", "manufacturing-employees"],
      sourceName: "工業統計調査 / 経済センサス",
      gridColumnSpan: 12,
      dataSource: "ranking",
      section: "事業所・雇用",
      sortOrder: 0,
    },
    {
      componentKey: "manufacturing-shipment-value-trend",
      componentType: "line-chart",
      title: "製造品出荷額と付加価値額の推移",
      componentProps: {
        estatParams: [
          { statsDataId: "0000010103", cdCat01: "C3401" },
          { statsDataId: "0000010103", cdCat01: "C3402" },
        ],
        labels: ["出荷額等", "付加価値額"],
        seriesColors: ["#3b82f6", "#22c55e"],
      },
      relatedRankingKeys: ["manufacturing-shipment-amount", "manufacturing-industry-added-value"],
      sourceName: "工業統計調査 / 経済センサス",
      gridColumnSpan: 12,
      dataSource: "ranking",
      section: "生産規模",
      sortOrder: 1,
    },
    {
      componentKey: "theme-manufacturing-labor-productivity",
      componentType: "line-chart",
      title: "製造業の労働生産性の推移（従業者1人あたり・事業所1あたり出荷額）",
      componentProps: {
        estatParams: [
          { statsDataId: "0000010203", cdCat01: "#C04401" },
          { statsDataId: "0000010203", cdCat01: "#C04404" },
        ],
        labels: ["従業者1人あたり出荷額", "事業所1あたり出荷額"],
        seriesColors: ["#3b82f6", "#ef4444"],
      },
      relatedRankingKeys: [
        "manufacturing-shipment-amount-per-employee",
        "manufacturing-shipment-amount-per-establishment",
      ],
      sourceName: "総務省 社会・人口統計体系",
      rankingLink: "/ranking/manufacturing-shipment-amount-per-employee",
      gridColumnSpan: 12,
      dataSource: "ranking",
      sortOrder: 100,
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

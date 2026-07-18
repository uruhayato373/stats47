import type { OpenDatasetDefinition } from "../types";

/**
 * 農林水産省「地域の農業を見て・知って・活かすDB」(農業集落単位の農林業センサス DB)。
 * 調査: open-data-curator 2026-07-18。発行主体 = 農林水産省統計部経営・構造統計課センサス統計室。
 * 筆ポリゴンの都道府県別 zip は URL にコードプレースホルダを含むため downloadUrl 未登録
 * (テンプレート URL は到達検証不能)。
 */

const MAFF_TERMS = "https://www.maff.go.jp/j/use/link.html";
const VERIFIED_AT = "2026-07-18";

export const MAFF_REGIONAL_DATASETS: readonly OpenDatasetDefinition[] = [
  {
    id: "maff-shuraku-card",
    sourceId: "maff-regional-db",
    name: "農業集落カード (地域指標データ)",
    description:
      "農林業センサスの農業集落別集計 (地域指標) xlsx。2005/2010/2015/2020/2025 年次。フォーマット定義は format.xlsx (48 シート)。",
    landingPageUrl: "https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/sa/index.html",
    accessMethods: ["file-download"],
    formats: ["xlsx"],
    geographicLevels: ["district"],
    hasGeometry: false,
    coverage: "all-japan",
    timeCoverage: "2005 / 2010 / 2015 / 2020 / 2025",
    updateFrequency: "irregular",
    license: {
      name: "政府標準利用規約 (PDL 1.0)",
      commercialUse: "allowed",
      attributionRequired: true,
      modificationNoticeRequired: true,
      termsUrl: MAFF_TERMS,
    },
    stats47Uses: ["area", "research-only"],
    suggestedCategories: ["agriculture"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: ["農業集落指標の県別集計 (集落数・農家率等)"],
    verification: {
      status: "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [
        "https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/sa/index.html",
        "https://www.maff.go.jp/j/tokei/census/shuraku_data/",
      ],
      notes: "47 県網羅は推定 (ページに明記なし)。個別 xlsx の直 URL は年次別ページ内で列挙されず未登録",
    },
  },
  {
    id: "maff-fude-polygons",
    sourceId: "maff-regional-db",
    name: "筆ポリゴンデータ (農地区画 GIS)",
    description:
      "農地の区画 (筆) ポリゴン。都道府県別分割 zip・FlatGeobuf 形式。2025 年版 (2026 年更新)。",
    landingPageUrl: "https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/mb/index.html",
    accessMethods: ["file-download"],
    formats: ["other"],
    geographicLevels: ["polygon"],
    hasGeometry: true,
    geometryTypes: ["polygon"],
    coverage: "all-japan",
    timeCoverage: "2025 (2026 年更新版)",
    updateFrequency: "annual",
    license: {
      name: "政府標準利用規約 (PDL 1.0・ページ内「利用上の注意」の個別条件は未精読)",
      commercialUse: "unknown",
      attributionRequired: true,
      modificationNoticeRequired: true,
      termsUrl: "https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/mb/index.html",
    },
    stats47Uses: ["research-only"],
    suggestedCategories: ["agriculture"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: [],
    verification: {
      status: "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: ["https://www.maff.go.jp/j/tokei/census/shuraku_data/2025/mb/index.html"],
      notes:
        "zip URL は MB0001_2026_2025_[都道府県コード].zip.[001-] のプレースホルダ付きテンプレートのため未登録。FlatGeobuf は DataFormat 列挙外 = other",
    },
  },
  {
    id: "maff-shuraku-boundaries",
    sourceId: "maff-regional-db",
    name: "農業集落境界データ (WebGIS)",
    description: "農業集落の境界を表示する WebGIS。2015/2020 年次。ダウンロード機能は未確認。",
    landingPageUrl: "https://www.machimura.maff.go.jp/shurakudata/rcom_map/rcom_map.html",
    accessMethods: ["web-only"],
    formats: ["other"],
    geographicLevels: ["district", "municipality"],
    hasGeometry: true,
    geometryTypes: ["polygon"],
    coverage: "all-japan",
    timeCoverage: "2015 / 2020",
    updateFrequency: "irregular",
    license: {
      name: "unknown",
      commercialUse: "unknown",
      attributionRequired: true,
      modificationNoticeRequired: true,
      termsUrl: MAFF_TERMS,
    },
    stats47Uses: ["research-only"],
    suggestedCategories: ["agriculture"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: [],
    verification: {
      status: "unverified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: ["https://www.machimura.maff.go.jp/shurakudata/rcom_map/rcom_map.html"],
      notes:
        "別サブドメイン (machimura.maff.go.jp)。地図閲覧は確認済みだが境界データの DL 提供有無・規約は未確認",
    },
  },
];

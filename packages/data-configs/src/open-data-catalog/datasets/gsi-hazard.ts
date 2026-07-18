import type { OpenDatasetDefinition } from "../types";

/**
 * ハザードマップポータルサイト (国土地理院 disaportal) の公開データ。
 * 調査: open-data-curator 2026-07-18 (opendata ページ実フェッチ)。
 * 配信はラスタータイル (PNG) 中心でベクタ非提供。タイル URL は
 * https://disaportaldata.gsi.go.jp/raster/<layer>/{z}/{x}/{y}.png のテンプレートのため
 * downloadUrl には登録しない (プレースホルダ URL は到達検証不能)。
 * GIS 加工用のベクタデータは KSJ (A31b 洪水 / A33 土砂 / A32 高潮 / A40 津波) が SSOT。
 */

const OPENDATA_PAGE = "https://disaportal.gsi.go.jp/hazardmap/copyright/opendata.html";
const VERIFIED_AT = "2026-07-18";

const DISAPORTAL_LICENSE = {
  name: "ハザードマップポータルサイト利用規約 (出典明記で利用可)",
  commercialUse: "allowed",
  attributionRequired: true,
  modificationNoticeRequired: true,
  termsUrl: OPENDATA_PAGE,
} as const;

function hazardTileDataset(input: {
  id: string;
  name: string;
  description: string;
  coverage: "all-japan" | "partial";
  updateFrequency: "annual" | "unknown";
  existingGisDataIds: readonly string[];
  notes: string;
}): OpenDatasetDefinition {
  return {
    id: input.id,
    sourceId: "gsi-hazard",
    name: input.name,
    description: input.description,
    landingPageUrl: OPENDATA_PAGE,
    accessMethods: ["tile-service"],
    formats: ["other"],
    geographicLevels: ["polygon"],
    hasGeometry: true,
    geometryTypes: ["polygon"],
    coordinateReferenceSystem: "EPSG:3857 (XYZ ラスタータイル)",
    coverage: input.coverage,
    updateFrequency: input.updateFrequency,
    license: DISAPORTAL_LICENSE,
    stats47Uses: ["research-only"],
    suggestedCategories: ["safetyenvironment"],
    existingMetricKeys: [],
    existingGisDataIds: input.existingGisDataIds,
    candidateMetricConcepts: [],
    verification: {
      status: "verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [OPENDATA_PAGE],
      notes: input.notes,
    },
  };
}

export const GSI_HAZARD_DATASETS: readonly OpenDatasetDefinition[] = [
  hazardTileDataset({
    id: "gsi-hazard-flood-tiles",
    name: "洪水浸水想定区域 (想定最大規模) ラスタータイル",
    description: "重ねるハザードマップの洪水浸水想定区域 (想定最大規模) PNG タイル。",
    coverage: "all-japan",
    updateFrequency: "unknown",
    existingGisDataIds: ["A31b"],
    notes:
      "tile: disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png。ベクタは KSJ A31b が SSOT",
  }),
  hazardTileDataset({
    id: "gsi-hazard-landslide-tiles",
    name: "土砂災害警戒区域 (土石流・急傾斜地・地すべり) ラスタータイル",
    description: "重ねるハザードマップの土砂災害警戒区域 3 レイヤー (土石流/急傾斜地崩壊/地すべり) PNG タイル。",
    coverage: "all-japan",
    updateFrequency: "annual",
    existingGisDataIds: ["A33"],
    notes:
      "tile: raster/05_dosekiryukeikaikuiki・05_kyukeishakeikaikuiki・05_jisuberikeikaikuiki。出典=令和6年度 KSJ A33 (原データそのもの)",
  }),
  hazardTileDataset({
    id: "gsi-hazard-tsunami-tiles",
    name: "津波浸水想定 ラスタータイル",
    description: "重ねるハザードマップの津波浸水想定 PNG タイル。出典は都道府県 (指定済みエリアのみ)。",
    coverage: "partial",
    updateFrequency: "unknown",
    existingGisDataIds: ["A40"],
    notes: "tile: raster/04_tsunami_newlegend_data。指定済み沿岸県のみ = 47 県比較不可",
  }),
  hazardTileDataset({
    id: "gsi-hazard-high-tide-tiles",
    name: "高潮浸水想定区域 ラスタータイル",
    description: "重ねるハザードマップの高潮浸水想定区域 PNG タイル。出典は都道府県 (指定済み沿岸県のみ)。",
    coverage: "partial",
    updateFrequency: "unknown",
    existingGisDataIds: ["A32"],
    notes: "tile: raster/03_hightide_l2_shinsuishin_data。指定済み沿岸県のみ = 47 県比較不可",
  }),
  {
    id: "gsi-evacuation-sites",
    sourceId: "gsi-hazard",
    name: "指定緊急避難場所データ",
    description:
      "市区町村が指定し公開に同意した指定緊急避難場所の CSV/GeoJSON。国土地理院が集約公開。",
    landingPageUrl: "https://www.gsi.go.jp/bousaichiri/hinanbasho.html",
    downloadUrl: "https://hinanmap.gsi.go.jp/index.html",
    accessMethods: ["file-download"],
    formats: ["csv", "geojson"],
    geographicLevels: ["point", "municipality"],
    hasGeometry: true,
    geometryTypes: ["point"],
    coverage: "partial",
    updateFrequency: "irregular",
    license: {
      name: "国土地理院コンテンツ利用規約 + 個別確認事項",
      commercialUse: "unknown",
      attributionRequired: true,
      modificationNoticeRequired: true,
      termsUrl: "https://www.gsi.go.jp/bousaichiri/hinanbasho.html",
    },
    stats47Uses: ["research-only"],
    suggestedCategories: ["safetyenvironment"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: [],
    verification: {
      status: "verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: ["https://www.gsi.go.jp/bousaichiri/hinanbasho.html"],
      notes:
        "公開同意した市区町村分のみ (partial) = 47 県比較不可。KSJ P20 (避難施設) は 2012 年度版で更新停止のため実質非重複。個別確認事項があり commercialUse は未確定",
    },
  },
];

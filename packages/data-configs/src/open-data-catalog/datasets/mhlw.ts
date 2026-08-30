import type { OpenDatasetDefinition } from "../types";

/**
 * 厚生労働省「医療情報ネット」オープンデータ (全国の医療機関・薬局 CSV)。
 * 調査: open-data-curator 2026-07-18。定義書 xlsx (13 シート) を直接解析し、
 * 緯度経度カラム (「所在地座標(緯度/経度)」) と都道府県・市区町村コード列を確認済み。
 * 個別 ZIP の直 URL は日付サフィックス付きで変動し、病院分以外はファイル名が類推のため
 * downloadUrl は登録しない (landing ページから辿る)。約 6 ヶ月おきスナップショット
 * (2024-08 → 2024-12 → 2025-06 → 2025-12) で過去分も同ページに残置され時系列比較可。
 */

const LANDING =
  "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/newpage_43373.html";
const SPEC_XLSX = "https://www.mhlw.go.jp/content/11121000/001306376.xlsx";
const PDL_TERMS = "https://www.digital.go.jp/resources/open_data/public_data_license_v1.0";
const VERIFIED_AT = "2026-08-30";

const PDL_LICENSE = {
  name: "公共データ利用規約 (PDL 1.0)",
  commercialUse: "allowed",
  attributionRequired: true,
  modificationNoticeRequired: true,
  termsUrl: PDL_TERMS,
} as const;

function medicalDataset(input: {
  id: string;
  name: string;
  description: string;
  existingMetricKeys: readonly string[];
  candidateMetricConcepts: readonly string[];
  notes: string;
  downloadUrl: string;
}): OpenDatasetDefinition {
  return {
    id: input.id,
    sourceId: "mhlw-medical-info",
    name: input.name,
    description: input.description,
    landingPageUrl: LANDING,
    downloadUrl: input.downloadUrl,
    accessMethods: ["bulk-download"],
    formats: ["csv"],
    geographicLevels: ["point", "municipality", "prefecture"],
    hasGeometry: true,
    geometryTypes: ["point"],
    coverage: "all-japan",
    timeCoverage: "2024-08〜2026-06 (約6ヶ月おきスナップショット)",
    updateFrequency: "irregular",
    latestPublishedAt: "2026-06-01",
    license: PDL_LICENSE,
    stats47Uses: ["map", "area", "research-only"],
    suggestedCategories: ["socialsecurity"],
    existingMetricKeys: input.existingMetricKeys,
    existingGisDataIds: [],
    candidateMetricConcepts: input.candidateMetricConcepts,
    verification: {
      status: "partially-verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [LANDING, SPEC_XLSX],
      notes: input.notes,
    },
  };
}

export const MHLW_MEDICAL_DATASETS: readonly OpenDatasetDefinition[] = [
  medicalDataset({
    id: "mhlw-medical-hospitals",
    name: "医療情報ネット 病院 (施設票・診療科診療時間票)",
    description:
      "全国の病院の施設情報 CSV。所在地座標 (緯度経度)・都道府県/市区町村コード・診療科目コードを含む。",
    existingMetricKeys: [],
    candidateMetricConcepts: ["診療科別の病院数 (県別集計)"],
    notes:
      "2026-08-30に厚生労働省ページの2026年6月1日時点リンクとZIP到達を確認",
    downloadUrl:
      "https://www.mhlw.go.jp/content/11121000/01-1_hospital_facility_info_20260601.csv.zip",
  }),
  medicalDataset({
    id: "mhlw-medical-clinics",
    name: "医療情報ネット 診療所 (施設票・診療科票)",
    description: "全国の一般診療所の施設情報 CSV。座標・行政コード・診療科目を含む。",
    existingMetricKeys: ["general-clinic-count", "general-clinic-count-per-100k"],
    candidateMetricConcepts: ["診療科別の診療所数 (県別集計)"],
    notes: "2026-08-30に厚生労働省ページの2026年6月1日時点リンクとZIP到達を確認",
    downloadUrl:
      "https://www.mhlw.go.jp/content/11121000/02-1_clinic_facility_info_20260601.csv.zip",
  }),
  medicalDataset({
    id: "mhlw-medical-dental-clinics",
    name: "医療情報ネット 歯科診療所 (施設票・診療科票)",
    description: "全国の歯科診療所の施設情報 CSV。座標・行政コードを含む。",
    existingMetricKeys: ["dental-clinic-count", "dental-clinic-count-per-100k"],
    candidateMetricConcepts: [],
    notes: "2026-08-30に厚生労働省ページの2026年6月1日時点リンクとZIP到達を確認",
    downloadUrl:
      "https://www.mhlw.go.jp/content/11121000/03-1_dental_facility_info_20260601.csv.zip",
  }),
  medicalDataset({
    id: "mhlw-medical-maternity-homes",
    name: "医療情報ネット 助産所票",
    description: "全国の助産所の施設情報 CSV。",
    existingMetricKeys: [],
    candidateMetricConcepts: ["助産所数 (県別集計)"],
    notes: "2026-08-30に厚生労働省ページの2026年6月1日時点リンクとZIP到達を確認",
    downloadUrl:
      "https://www.mhlw.go.jp/content/11121000/04_maternity_home_20260601.csv.zip",
  }),
  medicalDataset({
    id: "mhlw-medical-pharmacies",
    name: "医療情報ネット 薬局票",
    description: "全国の薬局の施設情報 CSV。座標・行政コード・ホームページアドレス列を含む。",
    existingMetricKeys: ["pharmacy-count-by-prefecture", "pharmacy-count-per-100k"],
    candidateMetricConcepts: [],
    notes: "2026-08-30に厚生労働省ページの2026年6月1日時点リンクとZIP到達を確認",
    downloadUrl:
      "https://www.mhlw.go.jp/content/11121000/05_pharmacy_20260601.csv.zip",
  }),
];

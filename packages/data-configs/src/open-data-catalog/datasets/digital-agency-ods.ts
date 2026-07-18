import type { OpenDatasetDefinition, GeographicLevel, DataFormat, GeometryType } from "../types";

/**
 * デジタル庁「自治体標準オープンデータセット」の定義済みデータセット種別。
 * 調査: open-data-curator 2026-07-18 (定義書 A/B/C/D xlsx の実 URL とシート構成を確認)。
 *
 * 性質: 各自治体が個別公開する分散データで、全国一括ダウンロード・専用集約カタログは
 * 公式ページに存在しない (e-Gov データポータルも自治体標準 ODS 集約とは明記されず)。
 * → coverage=partial (公開自治体のみ) で 47 都道府県比較には使えない = research-only。
 * ライセンスは自治体ごとに選択 (CC0 / CC BY / CC BY 4.0 等・いずれも商用可)。
 * 定義書 E-H (ボーリング柱状図/都市計画基礎調査/調達情報/バス情報) は外部基準への参照で
 * 個別仕様書 URL 未取得のため未登録。
 */

const LANDING = "https://www.digital.go.jp/resources/open_data/municipal-standard-data-set-test";
const SPEC_A =
  "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/5345f63e-62aa-4ef5-b979-287b6f343e2a/0d6cbe5f/20250501_resources_open_data_municipal-standard-open-dataset_table_a.xlsx";
const SPEC_B =
  "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/5345f63e-62aa-4ef5-b979-287b6f343e2a/c08bd12b/20231206_resources_open_data_municipal-standard-open-dataset_table_b.xlsx";
const SPEC_C =
  "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/5345f63e-62aa-4ef5-b979-287b6f343e2a/37cd38b5/20250501_resources_open_data_municipal-standard-open-dataset_table_c.xlsx";
const SPEC_D =
  "https://www.digital.go.jp/assets/contents/node/basic_page/field_ref_resources/5345f63e-62aa-4ef5-b979-287b6f343e2a/4652c2fc/20250501_resources_open_data_municipal-standard-open-dataset_table_d.xlsx";
const VERIFIED_AT = "2026-07-18";

function odsDataset(input: {
  id: string;
  name: string;
  description: string;
  specUrl: string;
  geographicLevels?: readonly GeographicLevel[];
  formats?: readonly DataFormat[];
  hasPoint?: boolean;
  geometry?: readonly GeometryType[];
  status?: "verified" | "partially-verified";
  suggestedCategories?: readonly string[];
  notes?: string;
}): OpenDatasetDefinition {
  const hasPoint = input.hasPoint ?? true;
  const geometryTypes = input.geometry ?? (hasPoint ? (["point"] as const) : undefined);
  return {
    id: input.id,
    sourceId: "digital-agency-municipal-ods",
    name: input.name,
    description: input.description,
    landingPageUrl: LANDING,
    downloadUrl: input.specUrl,
    accessMethods: ["file-download"],
    formats: input.formats ?? ["csv"],
    geographicLevels: input.geographicLevels ?? (hasPoint ? ["point", "municipality"] : ["municipality"]),
    hasGeometry: geometryTypes !== undefined,
    ...(geometryTypes ? { geometryTypes } : {}),
    coverage: "partial",
    updateFrequency: "irregular",
    license: {
      name: "自治体ごとに選択 (CC0 / CC BY / CC BY 4.0 等・標準仕様の推奨はいずれも商用可)",
      commercialUse: "allowed",
      attributionRequired: true,
      modificationNoticeRequired: false,
      termsUrl: LANDING,
    },
    stats47Uses: ["research-only"],
    suggestedCategories: input.suggestedCategories ?? [],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: [],
    verification: {
      status: input.status ?? "verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [LANDING, input.specUrl],
      notes:
        (input.notes ? `${input.notes}。` : "") +
        "自治体分散公開 (partial) のため 47 県比較不可。downloadUrl は定義書 (仕様) であり実データではない",
    },
  };
}

export const DIGITAL_AGENCY_ODS_DATASETS: readonly OpenDatasetDefinition[] = [
  odsDataset({ id: "ods-public-facilities", name: "自治体標準ODS 公共施設一覧", description: "定義書A-01。自治体の公共施設の位置・属性 CSV。", specUrl: SPEC_A }),
  odsDataset({ id: "ods-cultural-properties", name: "自治体標準ODS 文化財一覧", description: "定義書A-02。ファイル名規約 [団体コード]_cultural_property。", specUrl: SPEC_A, suggestedCategories: ["educationsports"] }),
  odsDataset({ id: "ods-evacuation-spaces", name: "自治体標準ODS 指定緊急避難場所一覧", description: "定義書A-03。ファイル名規約 [団体コード]_evacuation_space。", specUrl: SPEC_A, suggestedCategories: ["safetyenvironment"], notes: "国土地理院の指定緊急避難場所データ (gsi-evacuation-sites) と同種・集約は地理院側" }),
  odsDataset({ id: "ods-population-by-district-age", name: "自治体標準ODS 地域・年齢別人口", description: "定義書A-04。町丁字等の地域別・年齢別人口。", specUrl: SPEC_A, hasPoint: false, geographicLevels: ["municipality", "district"], suggestedCategories: ["population"], notes: "県別集計は国勢調査 (e-Stat) が SSOT のため research-only" }),
  odsDataset({ id: "ods-preschools", name: "自治体標準ODS 子育て施設一覧", description: "定義書A-05。ファイル名規約 [団体コード]_preschool。", specUrl: SPEC_A, suggestedCategories: ["socialsecurity"] }),
  odsDataset({ id: "ods-open-data-list", name: "自治体標準ODS オープンデータ一覧", description: "定義書A-06。自治体の公開データ目録 (メタカタログ)。", specUrl: SPEC_A, hasPoint: false }),
  odsDataset({ id: "ods-public-wireless-lan", name: "自治体標準ODS 公衆無線LANアクセスポイント一覧", description: "定義書A-07。ファイル名規約 [団体コード]_public_wireless_lan。", specUrl: SPEC_A, suggestedCategories: ["ict"] }),
  odsDataset({ id: "ods-aed-locations", name: "自治体標準ODS AED設置箇所一覧", description: "定義書A-08。緯度経度カラム (GIF 地理座標準拠・10 進小数) を実測確認。", specUrl: SPEC_A, suggestedCategories: ["socialsecurity"] }),
  odsDataset({ id: "ods-care-services", name: "自治体標準ODS 介護サービス事業所一覧", description: "定義書A-09。ファイル名規約 [団体コード]_care_service。", specUrl: SPEC_A, suggestedCategories: ["socialsecurity"] }),
  odsDataset({ id: "ods-hospitals", name: "自治体標準ODS 医療機関一覧", description: "定義書A-10。ファイル名規約 [団体コード]_hospital。", specUrl: SPEC_A, suggestedCategories: ["socialsecurity"], notes: "全国網羅の医療機関 CSV は医療情報ネット (mhlw-medical-*) が優位" }),
  odsDataset({ id: "ods-tourism-facilities", name: "自治体標準ODS 観光施設一覧", description: "定義書A-11。ファイル名規約 [団体コード]_tourism。", specUrl: SPEC_A, suggestedCategories: ["tourism"] }),
  odsDataset({ id: "ods-events", name: "自治体標準ODS イベント一覧", description: "定義書A-12。ファイル名規約 [団体コード]_event。", specUrl: SPEC_A, suggestedCategories: ["tourism"] }),
  odsDataset({ id: "ods-public-toilets", name: "自治体標準ODS 公衆トイレ一覧", description: "定義書A-13。ファイル名規約 [団体コード]_public_toilet。", specUrl: SPEC_A }),
  odsDataset({ id: "ods-fire-hydrants", name: "自治体標準ODS 消防水利施設一覧", description: "定義書A-14。ファイル名規約 [団体コード]_fire_hydrant。", specUrl: SPEC_A, suggestedCategories: ["safetyenvironment"] }),
  odsDataset({ id: "ods-food-business-permits", name: "自治体標準ODS 食品等営業許可・届出一覧", description: "定義書A-15。全許可一覧 / 新規許可一覧の 2 ファイル構成。", specUrl: SPEC_A, suggestedCategories: ["commercial"] }),
  odsDataset({ id: "ods-school-lunch-menus", name: "自治体標準ODS 学校給食献立情報", description: "定義書A-16。メタデータ + 本体の 2 ファイル構成。", specUrl: SPEC_A, hasPoint: false, suggestedCategories: ["educationsports"] }),
  odsDataset({ id: "ods-school-districts", name: "自治体標準ODS 小中学校通学区域情報", description: "定義書A-17。通学区域の面データ。メタデータ + 本体の 2 ファイル構成。", specUrl: SPEC_A, hasPoint: false, geometry: ["polygon"], geographicLevels: ["polygon", "municipality"], formats: ["csv", "geojson"], suggestedCategories: ["educationsports"] }),
  odsDataset({ id: "ods-benefit-programs", name: "自治体標準ODS 支援制度(給付金)情報 (定義書B)", description: "定義書B。2023-12-06 版で更新停止 (定義書 A より古い)。", specUrl: SPEC_B, hasPoint: false, suggestedCategories: ["administrativefinancial"] }),
  odsDataset({ id: "ods-table-c-datasets", name: "自治体標準ODS 定義書C 群 (防災行政無線・駐車場・ゴミ分別ほか 8 種)", description: "定義書C。教育機関/駐車場/駐輪場/ゴミ分別/赤ちゃんの駅/ゴミ集積所/観光ポイント等。", specUrl: SPEC_C, status: "partially-verified", notes: "シート内未精読" }),
  odsDataset({ id: "ods-table-d-datasets", name: "自治体標準ODS 定義書D 群 (データモデル型)", description: "定義書D。投票所・ゴミ分別等を含むデータモデル型仕様。", specUrl: SPEC_D, hasPoint: false, formats: ["csv", "json"], status: "partially-verified", notes: "詳細シート未精読" }),
];

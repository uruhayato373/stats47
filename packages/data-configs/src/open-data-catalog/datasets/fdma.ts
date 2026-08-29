import type { OpenDatasetDefinition } from "../types";

/**
 * 消防庁「熱中症による救急搬送人員」確定値。
 * 2026-08-28 に公式の年次一覧、令和7年確定報、配布 xlsx、利用規約を確認した。
 */
const LANDING = "https://www.fdma.go.jp/disaster/heatstroke/post4.html";
const DOWNLOAD_XLSX =
  "https://www.fdma.go.jp/disaster/heatstroke/items/heatstroke003_data_r7.xlsx";
const FINAL_REPORT =
  "https://www.fdma.go.jp/pressrelease/houdou/items/kyuuki_20251027_2.pdf";
const TERMS_URL = "https://www.fdma.go.jp/about/others/post3.html";
const VERIFIED_AT = "2026-08-28";

export const FDMA_HEATSTROKE_DATASETS: readonly OpenDatasetDefinition[] = [
  {
    id: "fdma-heatstroke-emergency-transports",
    sourceId: "fdma-heatstroke",
    name: "熱中症による救急搬送人員（都道府県別）",
    description:
      "消防庁が公表する熱中症による救急搬送人員の都道府県別確定値。2025年は5月1日から9月30日までを集計し、47都道府県の搬送人員を収録する。",
    landingPageUrl: LANDING,
    downloadUrl: DOWNLOAD_XLSX,
    accessMethods: ["file-download"],
    formats: ["xlsx"],
    geographicLevels: ["prefecture"],
    hasGeometry: false,
    coverage: "all-japan",
    timeCoverage: "2008-2025年（2025年は5月1日-9月30日の確定値）",
    updateFrequency: "annual",
    latestPublishedAt: "2025-10-29",
    license: {
      name: "公共データ利用規約（第1.0版）",
      commercialUse: "allowed",
      attributionRequired: true,
      modificationNoticeRequired: true,
      termsUrl: TERMS_URL,
    },
    stats47Uses: ["ranking", "theme"],
    suggestedCategories: ["safetyenvironment"],
    existingMetricKeys: [],
    existingGisDataIds: [],
    candidateMetricConcepts: ["人口10万人当たり熱中症救急搬送人員"],
    verification: {
      status: "verified",
      verifiedAt: VERIFIED_AT,
      verifiedFromUrls: [LANDING, DOWNLOAD_XLSX, FINAL_REPORT, TERMS_URL],
      notes:
        "採用定義は、分子=消防庁2025年確定値（5月1日-9月30日）の都道府県別搬送人員、分母=total-populationの2024年値、倍率=100,000、表示年=2025年。分母は対象期間直前の最新年次であることを注記する。公式集計が都道府県単位のため代表観測地点の選定は不要。maximum-temperatureは日最高気温の月平均という曝露指標、本候補は健康被害の結果指標であり重複しない。",
    },
  },
];

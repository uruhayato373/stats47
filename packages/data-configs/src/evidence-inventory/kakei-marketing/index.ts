import type { KakeiMarketingAnalysis } from "../types";

import analysesJson from "./analyses.json";

export const KAKEI_MARKETING_EDITION = "2015";
export const KAKEI_MARKETING_REVIEWED_AT = "2026-09-05";

/**
 * 『マーケティングに使える「家計調査」』の分析・論点の authored inventory。
 * source-inventory CLI が同じ JSON を読み、ページ単位の解決台帳を決定的に生成する。
 */
export const KAKEI_MARKETING_ANALYSES =
  analysesJson.analyses as unknown as readonly KakeiMarketingAnalysis[];

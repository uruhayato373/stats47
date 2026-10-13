import type { KakeiMarketingAnalysis } from "../types";

import analysesJson from "../../../../../data/source-inventory/kakei-marketing/2015/analyses.json";

export const KAKEI_MARKETING_EDITION = analysesJson.edition;
export const KAKEI_MARKETING_REVIEWED_AT = analysesJson.reviewedAt;

/**
 * 『マーケティングに使える「家計調査」』の分析・論点の authored inventory。正本は data/source-inventory/kakei-marketing/2015/analyses.json。
 * source-inventory CLI が同じ JSON を読み、ページ単位の解決台帳を決定的に生成する。
 */
export const KAKEI_MARKETING_ANALYSES =
  analysesJson.analyses as unknown as readonly KakeiMarketingAnalysis[];

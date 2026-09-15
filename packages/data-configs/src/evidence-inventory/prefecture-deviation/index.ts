import type {
  EvidenceContentRole,
  EvidenceGeoScope,
  EvidenceMapping,
  EvidencePrimarySource,
  EvidenceResolution,
} from "../types";

import analysesJson from "./analyses.json";

export const PREFECTURE_DEVIATION_EDITION = "2018";
export const PREFECTURE_DEVIATION_REVIEWED_AT = "2026-09-15";

/**
 * 久保哲朗『47都道府県の偏差値』(小学館, 2018) の分析・論点単位の authored SSOT。
 * 書籍の文章・図表・偏差値の数値は保持せず、問い・ページ範囲・stats47 側の lineage だけを持つ。
 * kakei-marketing と同じ形 (chapter = 分析トピック単位) で source-inventory CLI が同じ JSON を読み、
 * ページ範囲 → 解決結果を決定的に展開する (範囲の重複・未知resolutionはbuildが拒否)。
 */
export interface PrefectureDeviationAnalysis {
  id: string;
  /** 書籍の章 (1=食, 2=子育てと教育, 3=住まいと生活, 4=働き方, 5=レジャー, 6=社会と健康) */
  chapter: number;
  /** 書籍の主張をそのまま写さず、stats47 として検証する独立した問い */
  question: string;
  /** 論点の要約 (独自表現) */
  thesis: string;
  /** 展開後PDF (6分冊) をまたぐ通し scan ページ範囲 (両端含む、1始まり) */
  pages: [number, number];
  resolution: EvidenceResolution;
  resolutionReason: string;
  metricKeys: string[];
  surveyIds: string[];
  geoScopes: EvidenceGeoScope[];
  contentRoles: EvidenceContentRole[];
  primarySources: EvidencePrimarySource[];
  /** 既に stats47 に同趣旨のコンテンツがある場合の slug / key */
  existing?: { blogSlugs?: string[]; themeSlugs?: string[] };
  /** 次に作る制作単位 */
  nextAction: string;
}

/**
 * source-inventory CLI が読む authored inventory。型は同ディレクトリの
 * `PrefectureDeviationAnalysis` を使う (kakei-marketing の `KakeiMarketingAnalysis` とは
 * 別の型だが同じ形で、両者とも `EvidenceMapping` の構成要素を再利用する)。
 */
export const PREFECTURE_DEVIATION_ANALYSES =
  analysesJson.analyses as unknown as readonly PrefectureDeviationAnalysis[];

// re-export for consumers that only need the mapping shape
export type { EvidenceMapping };

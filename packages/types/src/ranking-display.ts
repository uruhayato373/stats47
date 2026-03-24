/**
 * ランキング表示用の共有型定義
 *
 * Video / Web / Admin で使われるランキング表示コンポーネント向け。
 * @stats47/ranking の RankingValue とは独立した、表示レイヤー専用の型。
 */

/** 1行分のランキング表示データ */
export interface RankingDisplayEntry {
  rank: number;
  areaCode: string;
  areaName: string;
  value: number;
}

/** ランキング項目のメタデータ */
export interface RankingDisplayMeta {
  title: string;
  subtitle?: string;
  unit: string;
  yearName?: string;
  demographicAttr?: string;
  normalizationBasis?: string;
}

/** ランキング表示コンポーネントへの入力データ一式 */
export interface RankingDisplayInput {
  meta: RankingDisplayMeta;
  entries: RankingDisplayEntry[];
}

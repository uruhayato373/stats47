import type { MetricPresentation } from './metric-presentation';
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
  /** 指標snapshotと同じ原単位の表示方針。旧保存入力では省略可。
   * 削除条件: 保存済みSNS入力と全producerを移行した時点で optional を外す。 */
  presentation?: MetricPresentation;
  title: string;
  subtitle?: string;
  unit: string;
  yearName?: string;
  demographicAttr?: string;
  normalizationBasis?: string;
  /** SNS画像内に載せる出典名。URL・詳しい定義は投稿本文と入力manifestに保持する。 */
  sourceLabel?: string;
  /** 出典スライドに載せる、対象・期間・解釈上の注意。 */
  note?: string;
}

/** ランキング表示コンポーネントへの入力データ一式 */
export interface RankingDisplayInput {
  meta: RankingDisplayMeta;
  entries: RankingDisplayEntry[];
}

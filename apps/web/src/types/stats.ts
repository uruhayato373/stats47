/**
 * Statistics Domain - Type Definitions
 *
 * 統計データの型定義を提供。
 * アプリケーション全体で使用する統計データの基本構造を定義する。
 *
 * @module types/stats
 */

import type { AreaType } from "@/features/area";

/**
 * 統計データのスキーマ
 *
 * e-Stat APIやその他の統計データソースから取得した統計データの基本構造を表す。
 * 地域、時間、カテゴリ、値と単位の情報を含む。
 *
 * @example
 * ```typescript
 * const data: StatsSchema = {
 *   areaType: "prefecture",
 *   areaCode: "01000",
 *   areaName: "北海道",
 *   yearCode: "2020",
 *   yearName: "2020年",
 *   categoryCode: "010",
 *   categoryName: "総人口",
 *   value: 5242000,
 *   unit: "人"
 * };
 * ```
 */
export interface StatsSchema {
  /** 地域タイプ（prefecture / city / national） */
  areaType?: AreaType;
  /** 地域コード（都道府県コードまたは市区町村コード） */
  areaCode: string;
  /** 地域名（都道府県名または市区町村名） */
  areaName: string;
  /** 年度コード（4桁、例: "2020"） */
  yearCode: string;
  /** 年度名（例: "2020年"） */
  yearName: string;
  /** カテゴリコード（統計項目を表すコード） */
  categoryCode: string;
  /** カテゴリ名（統計項目名） */
  categoryName: string;
  /** 統計値（数値） */
  value: number;
  /** 単位（例: "人", "千円", "%"） */
  unit: string;
  /** ランキング順位（ランキングデータの場合のみ） */
  rank?: number;
}

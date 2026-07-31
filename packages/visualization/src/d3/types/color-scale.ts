/**
 * カラースケール型定義
 */

import type { CanonicalColorScheme } from "@stats47/types";

import type { D3Module } from "./d3";

/**
 * 可視化用データポイントの最小インターフェース
 */
export interface VisualizationDataPoint {
  value: number;
  // index signature は `any` 必須 (`unknown` にしない)。`unknown` にすると index signature を
  // 持たない既存データ型 (RankingValue / StatsSchema 等) が MapDataPoint へ代入不可になり、
  // map 系コンポーネント全体が型エラーになる (TS2322 "Index signature is missing")。
  // 柔軟なチャートデータ点として任意キーを許容する意図的設計。
  [key: string]: any;
}

/**
 * カラースキームタイプ
 */
export type ColorSchemeType = 'sequential' | 'diverging' | 'categorical';

/**
 * 分岐点設定（発散カラースキーム用）
 */
export type DivergingMidpoint = "zero" | "mean" | "median" | "custom" | number;

/**
 * 最小値タイプ（順序カラースキーム用）
 */
export type MinValueType = 'zero' | 'data-min';

/**
 * D3.jsカラースキーム型
 *
 * ★2026-07-31: 手書き union をやめ、語彙 SSOT (`@stats47/types` の
 * COLOR_SCHEME_CATALOG) から導出する。手書きだとカタログに足しても型が
 * 受け付けない (逆も然り) というドリフトが起きるため。
 * 連続 (sequential) / 発散 (diverging) / カテゴリ (categorical) の全 46 種を含む。
 */
export type D3ColorScheme = CanonicalColorScheme;

/**
 * @deprecated Use D3ColorScheme instead.
 */
export type D3ColorSchemeType = D3ColorScheme;


/**
 * D3.jsカラースキーム定義
 *
 * D3.jsのカラースキームをタイプ別に分類し、
 * UI表示に必要な情報を提供します。
 */
export interface ColorScheme {
  /** D3.jsの補間関数名 */
  value: string;
  /** 表示用ラベル */
  label: string;
  /** カラースキームのタイプ */
  type: ColorSchemeType;
  /** 説明（オプション） */
  description?: string;
}

/**
 * カラースケール生成オプション（共通）
 */
interface BaseColorScaleOptions {
  /** データ配列 */
  data: VisualizationDataPoint[];
  /** カラースケール名（デフォルト: "interpolateBlues"） */
  colorScheme?: D3ColorSchemeType | string;
  /** カラースキームを反転するか */
  isReversed?: boolean;
  /** データがない場合の色 */
  noDataColor?: string;
  /** D3 モジュール（動的インポート用、省略時は自動インポート） */
  d3?: D3Module;
}

/**
 * 順序カラースケールオプション
 */
export interface SequentialColorScaleOptions extends BaseColorScaleOptions {
  type: 'sequential';
  /** 最小値タイプ（'zero' | 'data-min'） */
  minValueType?: MinValueType;
}

/**
 * 発散カラースケールオプション
 */
export interface DivergingColorScaleOptions extends BaseColorScaleOptions {
  type: 'diverging';
  /** 分岐点設定 */
  divergingMidpoint: DivergingMidpoint;
  /** カスタム分岐点値 */
  divergingMidpointValue?: number;
  /** カラースキームのドメインを絶対値で対称にするか */
  isSymmetrized?: boolean;
}

/**
 * カテゴリカラースケールオプション
 */
export interface CategoricalColorScaleOptions extends BaseColorScaleOptions {
  type: 'categorical';
  /** カテゴリ数 */
  categories?: number;
}

/**
 * カラースケール生成オプション（統合型）
 */
export type ColorScaleOptions =
  | SequentialColorScaleOptions
  | DivergingColorScaleOptions
  | CategoricalColorScaleOptions;

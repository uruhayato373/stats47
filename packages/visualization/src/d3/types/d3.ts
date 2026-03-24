/**
 * D3.js 固有型定義
 *
 * D3.js 専用の型
 */

import type { BaseD3ChartProps, MarginProps } from "./base";

/**
 * D3.js モジュールの型定義
 *
 * 動的インポート（import("d3")）で使用するD3モジュールの型
 */
export type D3Module = typeof import("d3");

/**
 * TopoJSON モジュールの型定義
 *
 * 動的インポート（import("topojson-client")）で使用するTopoJSONモジュールの型
 */
export type TopojsonModule = typeof import("topojson-client");

/**
 * ピラミッドチャートのデータ型
 */
export interface PyramidChartData {
  /** 年齢階級 */
  ageGroup: string;
  /** 男性の値（負の値として表示） */
  male: number;
  /** 女性の値（正の値として表示） */
  female: number;
}

/** @deprecated Use PyramidChartData */
export type D3PyramidChartData = PyramidChartData;

/**
 * ピラミッドチャートのProps
 */
export interface PyramidChartProps extends BaseD3ChartProps, MarginProps {
  /** チャート用データ */
  chartData: Array<PyramidChartData>;
  /** 数値フォーマッター */
  valueFormatter?: (value: number) => string;
}

/** @deprecated Use PyramidChartProps */
export type D3PyramidChartProps = PyramidChartProps;

/**
 * カラースケール型定義
 */

import type { D3Module } from "./d3";

/**
 * 可視化用データポイントの最小インターフェース
 */
export interface VisualizationDataPoint {
  value: number;
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
 * 連続スケール(Sequential)、発散スケール(Diverging)をサポートします。
 * カテゴリカルスケールは別途定義が必要です。
 */
export type D3ColorScheme =
  // === Sequential - 単色系 ===
  | "interpolateBlues"    // 青系 (薄い青 → 濃い青) - 一般的なランキング、水関連
  | "interpolateGreens"   // 緑系 (薄い緑 → 濃い緑) - 環境、森林、農業関連
  | "interpolateGreys"    // グレー系 (薄いグレー → 濃いグレー) - モノクロ表示
  | "interpolateOranges"  // オレンジ系 (薄いオレンジ → 濃いオレンジ) - 暑さ、人口密度
  | "interpolatePurples"  // 紫系 (薄い紫 → 濃い紫) - 芸術、文化関連
  | "interpolateReds"     // 赤系 (薄い赤 → 濃い赤) - 危険度、警告

  // === Sequential - マルチカラー系 ===
  | "interpolateBuGn"     // 青 → 緑 - 水から陸へのグラデーション
  | "interpolateBuPu"     // 青 → 紫 - 寒色系のグラデーション
  | "interpolateGnBu"     // 緑 → 青 - 植生から水へ
  | "interpolateOrRd"     // オレンジ → 赤 - 温度、熱量
  | "interpolatePuBuGn"   // 紫 → 青 → 緑 - 3色グラデーション
  | "interpolatePuBu"     // 紫 → 青 - 寒色系
  | "interpolatePuRd"     // 紫 → 赤 - 紫から赤へ
  | "interpolateRdPu"     // 赤 → 紫 - 赤から紫へ
  | "interpolateYlGnBu"   // 黄色 → 緑 → 青 - 暖色から寒色へ
  | "interpolateYlGn"     // 黄色 → 緑 - 明るい色のグラデーション
  | "interpolateYlOrBr"   // 黄色 → オレンジ → 茶色 - 土壌、乾燥度
  | "interpolateYlOrRd"   // 黄色 → オレンジ → 赤 - 日照時間、気温、熱量

  // === Sequential - 知覚的に均一 (色覚異常対応) ===
  | "interpolateViridis"  // 緑 → 青 → 紫 - 科学的可視化、色覚異常対応
  | "interpolatePlasma"   // 青 → 紫 → オレンジ - 明瞭なコントラスト
  | "interpolateInferno"  // 黒 → 紫 → 黄色 - 高コントラスト
  | "interpolateMagma"    // 黒 → 紫 → 赤 → 白 - 火山、熱量
  | "interpolateCividis"  // 青 → 黄色 - 色覚異常に最適化
  | "interpolateWarm"     // 暖色系グラデーション
  | "interpolateCool"     // 寒色系グラデーション
  | "interpolateTurbo"    // レインボー風 - 広範囲のデータ
  | "interpolateCubehelix" // 螺旋状の色変化 - 印刷にも適する

  // === Diverging - 中央値を基準にする ===
  | "interpolateBrBG"     // 茶色 ← 白 → 青緑 - 乾燥 vs 湿潤
  | "interpolatePRGn"     // 紫 ← 白 → 緑 - 対照的な2つの値
  | "interpolatePiYG"     // ピンク ← 白 → 黄緑 - 正負の値
  | "interpolatePuOr"     // 紫 ← 白 → オレンジ - 寒暖差
  | "interpolateRdBu"     // 赤 ← 白 → 青 - 温度、政治的傾向
  | "interpolateRdGy"     // 赤 ← 白 → グレー - 警告から中立
  | "interpolateRdYlBu"   // 赤 ← 黄 → 青 - 温度差、偏差
  | "interpolateRdYlGn"   // 赤 ← 黄 → 緑 - 信号色（悪い→普通→良い）
  | "interpolateSpectral" // スペクトラル - 広範囲の発散データ

  // === Categorical - カテゴリデータ用 ===
  | "schemeCategory10"
  | "schemeAccent"
  | "schemeDark2"
  | "schemePaired"
  | "schemePastel1"
  | "schemePastel2"
  | "schemeSet1"
  | "schemeSet2"
  | "schemeSet3"
  | "schemeTableau10";

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

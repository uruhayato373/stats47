/**
 * ランキング項目の型定義
 * 2026-01 設計見直しにより構造を階層化
 */
import type { AreaType } from "@stats47/types";
import type {
    ColorSchemeType,
    D3ColorScheme,
    DivergingMidpoint,
    MinValueType
} from "@stats47/visualization/d3";

/**
 * ランキング項目のタグ情報
 */
export interface RankingTag {
  tagKey: string;
}

// ============================================================================
// 設定オブジェクト型
// ============================================================================

/**
 * 数値表示設定
 * DBカラム: value_display_config (JSON)
 */
export interface ValueDisplayConfig {
  /**
   * 変換係数
   * 生データを表示用に変換するための乗数（例: 0.001 なら 1000 -> 1 に変換）
   */
  conversionFactor?: number;
  /**
   * 小数点以下桁数
   * 表示時の小数点以下の桁数指定
   */
  decimalPlaces?: number;
  /**
   * 表示用単位
   * 変換係数を適用した後に表示する単位（例: "千人"）
   */
  displayUnit?: string;
}

/**
 * 可視化設定
 * DBカラム: visualization_config (JSON)
 */
export interface VisualizationConfig {
  /**
   * 地図の色スキーム
   * D3.jsで使用するカラースケール名（例: "interpolateBlues"）
   */
  colorScheme: D3ColorScheme;
  /**
   * スキームタイプ
   * - sequential: 順序（単色グラデーション）
   * - diverging: 発散（二色グラデーション、正負など）
   * - categorical: カテゴリ（離散値）
   */
  colorSchemeType: ColorSchemeType;
  /**
   * 最小値の扱い (Sequential用)
   * - zero: 0を最小値（薄い色）とする
   * - data-min: データの最小値を最小値とする
   */
  minValueType?: MinValueType;
  /**
   * 分岐点設定 (Diverging用)
   * 中央値（白くなる部分）の基準
   */
  divergingMidpoint?: DivergingMidpoint;
  /**
   * カスタム分岐点値
   * divergingMidpointが'custom'の場合の値
   */
  divergingMidpointValue?: number;
  /**
   * 対称化フラグ
   * 発散スケールで正負の最大絶対値に合わせて対称にするか
   */
  isSymmetrized?: boolean;
  /**
   * 反転フラグ
   * カラースケールの色順を反転するか
   */
  isReversed?: boolean;
}

/**
 * 正規化表示オプション
 */
export interface NormalizationOption {
  /**
   * 正規化の種類
   * - per_population: 総人口あたり
   * - per_area:       総面積あたり
   */
  type: "per_population" | "per_area";

  /**
   * UI上の表示ラベル
   * 例: "人口10万人あたり", "面積1km²あたり"
   */
  label: string;

  /**
   * 変換後の単位
   * 例: "件/10万人", "件/km²"
   */
  unit: string;

  /**
   * スケール係数
   * 計算式: (元の値 / 分母の値) * scaleFactor
   * 例: 10万人あたりにしたい場合は 100000
   */
  scaleFactor?: number;

  /**
   * 表示時の小数点以下桁数
   */
  decimalPlaces?: number;

  /**
   * 分母となるランキングキーを明示的に指定する場合
   * 省略時は type に応じて Well-Known Key を自動選択する
   */
  denominatorKey?: string;
}

/**
 * 計算設定
 * DBカラム: calculation_config (JSON)
 */
export interface CalculationConfig {
  /**
   * 計算項目フラグ
   * trueの場合、DB上の値ではなく計算によって値を導出する
   */
  isCalculated: boolean;
  /**
   * 計算タイプ
   * - ratio: 比率（分子÷分母）。パーセンテージ計算など。
   * - per_capita: 人口あたり（分子÷人口）。
   */
  type?: "ratio" | "per_capita" | "subtraction";
  /** 分子となるランキングキー（ratio計算用） */
  numeratorKey?: string;
  /** 分母となるランキングキー（ratio計算用） */
  denominatorKey?: string;
  /** 計算式（custom計算用） */
  formula?: string;
  /** 表示時に選択可能な正規化オプション (オンデマンド計算用) */
  normalizationOptions?: NormalizationOption[];
}

/**
 * データソース設定
 * DBカラム: source_config (JSON)
 */
export interface SourceConfig {
  /** e-Stat 固有: データベース・系列名 (例: "社会・人口統計体系") */
  collection?: {
    name: string;
    url?: string;
  };

  /** データの元となった統計調査 */
  survey?: {
    name: string;
    url?: string;
  };

  /** e-Stat 統計表ID (互換性・API用) */
  statsDataId?: string;
  /** e-Stat 項目コード (互換性・API用) */
  itemCode?: string;
  /** e-Stat カテゴリコード (cat01) (互換性・API用) */
  cdCat01?: string;
  /** e-Stat カテゴリコード (cat02) (互換性・API用) */
  cdCat02?: string;
  /** e-Stat カテゴリコード (cat03) (互換性・API用) */
  cdCat03?: string;
  /** e-Stat 表章項目コード (tab) (互換性・API用) */
  cdTab?: string;
  
  /** その他のパラメータ (任意) */
  [key: string]: unknown;
}

// ============================================================================
// メイン型定義
// ============================================================================

/**
 * ランキング項目
 * DBテーブル: ranking_items
 */
export interface RankingItem {
  /** ランキングキー（一意の識別子） */
  rankingKey: string;
  /** 地域タイプ（都道府県、市区町村など） */
  areaType: AreaType;

  // === 主要フィールド ===
  /** 正式名称（詳細ページ等で使用） */
  rankingName: string;
  /** 表示タイトル（リストや見出しで使用） */
  title: string;
  /** サブタイトル（補足的なタイトル） */
  subtitle?: string;
  /** 対象属性（例: "15歳以上"） */
  demographicAttr?: string;
  /** 正規化の基準（例: "人口10万人あたり"） */
  normalizationBasis?: string;
  /** 基本単位（DBに保存されている値の単位） */
  unit: string;

  /** カテゴリキー */
  categoryKey?: string;
  /** 追加カテゴリキー（複数カテゴリ所属時に使用） */
  additionalCategories?: string[] | null;
  /** グループキー（同じ指標の別の見方をまとめるキー） */
  groupKey?: string;

  /** 注釈・説明文 */
  annotation?: string;
  /** 定義の詳細説明 (旧 definition) */
  description?: string;
  /** 最新年度情報 */
  latestYear?: { yearCode: string; yearName: string } | null;
  /** 利用可能年度リスト */
  availableYears?: { yearCode: string; yearName: string }[] | null;
  /** 有効フラグ */
  isActive: boolean;

  // === 設定オブジェクト ===
  /** 数値表示設定 */
  valueDisplay?: ValueDisplayConfig | null;
  /** 地図・グラフの可視化設定 */
  visualization?: VisualizationConfig | null;
  /** 動的計算ロジック設定 */
  calculation?: CalculationConfig | null;

  // === 外部参照 ===
  /** 調査ID（surveys テーブルへの参照） */
  surveyId?: string | null;
  /** データソースID */
  dataSourceId: string;
  /** データ取得設定 (e-Statパラメータ等) */
  sourceConfig?: SourceConfig | null;
  /** 出典情報（名前とURL） */
  source?: { name: string; url: string };

  // === SEO ===
  /** SEO 用タイトル（meta title のオーバーライド、未設定時は title を使用） */
  seoTitle?: string | null;
  /** SEO 用説明文（meta description のオーバーライド、未設定時は自動生成） */
  seoDescription?: string | null;

  // === おすすめ情報 ===
  /** おすすめフラグ（Topページ等で表示） */
  isFeatured: boolean;
  /** おすすめ表示順序 */
  featuredOrder: number;

  /**
   * 関連タグ（オプショナル）
   * このランキング項目に関連付けられたタグ（カテゴリ、トピックなど）
   */
  tags?: RankingTag[] | null;

  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * 地域タイプ別のランキング項目カウント
 * @see getRankingItemStatsForAllAreaTypes
 */
export interface RankingItemCounts {
  /** 地域タイプ */
  areaType: string;
  /** 全件数 */
  total: number;
  /** 有効な項目数 */
  active: number;
  /** 無効な項目数 */
  inactive: number;
}


/**
 * 表示用ランキング項目（画像生成等で使用）
 */
export type RankingItemForDisplay = Pick<
  RankingItem,
  "title" | "subtitle" | "unit" | "visualization" | "demographicAttr" | "normalizationBasis"
>;



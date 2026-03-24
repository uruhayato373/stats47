/**
 * 地図コンポーネントの型定義
 *
 * PrefectureMapChart用の型定義とカラースキーム設定
 */

import type {
    DivergingMidpoint,
    MinValueType,
    VisualizationDataPoint,
} from "./color-scale";

// ============================================================
// カラースキーム設定
// ============================================================

/**
 * 地図可視化設定（ベース）
 */
interface BaseMapVisualizationConfig {
  /** カラースキーム名 */
  colorScheme?: string;
  /** カラースキームを反転 */
  isReversed?: boolean;
  /** データがない場合の色 */
  noDataColor?: string;
}

/**
 * 順序スケール設定
 */
export interface SequentialMapVisualizationConfig
  extends BaseMapVisualizationConfig {
  colorSchemeType: 'sequential';
  /** 最小値タイプ */
  minValueType?: MinValueType;
}

/**
 * 分岐スケール設定
 */
export interface DivergingMapVisualizationConfig
  extends BaseMapVisualizationConfig {
  colorSchemeType: 'diverging';
  /** 分岐点 */
  divergingMidpoint?: DivergingMidpoint;
  /** カスタム分岐点値 */
  divergingMidpointValue?: number;
  /** ドメインを絶対値で対称にする */
  isSymmetrized?: boolean;
}

/**
 * カテゴリスケール設定
 */
export interface CategoricalMapVisualizationConfig
  extends BaseMapVisualizationConfig {
  colorSchemeType: 'categorical';
}

/**
 * 地図可視化設定
 *
 * colorSchemeTypeに応じて利用可能なプロパティが変化する。
 * 不正な組み合わせを型レベルで防止する。
 */
export type MapVisualizationConfig =
  | SequentialMapVisualizationConfig
  | DivergingMapVisualizationConfig
  | CategoricalMapVisualizationConfig;

// ============================================================
// 地図コンポーネント
// ============================================================

/**
 * 都道府県GeoJSON Feature
 */
export interface PrefectureFeature {
  type: "Feature";
  properties: {
    prefCode: string;
    prefName: string;
    value?: number | null;
    [key: string]: unknown;
  };
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][];
  };
}


/**
 * 地図描画用データポイント
 */
export interface MapDataPoint extends VisualizationDataPoint {
  areaCode: string;
}

/**
 * 都道府県地図コンポーネントのProps
 */
export interface PrefectureMapProps {
  /** SVG の幅 (px) */
  width?: number;
  /** SVG の高さ (px) */
  height?: number;
  /** ローディングオーバーレイの表示 */
  isLoading?: boolean;
  /** ルート要素の追加クラス */
  className?: string;
  /** 値の単位（ツールチップで表示） */
  unit?: string;

  /** 統計データ */
  data: MapDataPoint[];
  /** カラー設定 */
  colorConfig: MapVisualizationConfig;
  /** TopoJSONデータ */
  topology?: import("@stats47/types").TopoJSONTopology;
  /** 都道府県クリック時のコールバック */
  onPrefectureClick?: (areaCode: string) => void;
  /** 選択中の都道府県コード */
  selectedPrefectureCode?: string;
}

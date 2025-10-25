/**
 * 地図描画ドメイン - 型定義
 * ライブラリ非依存の共通型定義
 */

import type { PrefectureFeature } from "@/features/gis/geoshape/types/index";

// 地図プロパティ
export interface MapProps {
  /** 地図の幅 */
  width?: number;
  /** 地図の高さ */
  height?: number;
  /** CSSクラス名 */
  className?: string;
  /** 地図の中心座標 [経度, 緯度] */
  center?: [number, number];
  /** ズームレベル */
  zoom?: number;
  /** 地図の境界ボックス */
  bounds?: [[number, number], [number, number]];
}

// 地図イベント
export interface MapEvents {
  /** 都道府県クリック時のコールバック */
  onPrefectureClick?: (feature: PrefectureFeature) => void;
  /** 都道府県ホバー時のコールバック */
  onPrefectureHover?: (feature: PrefectureFeature | null) => void;
  /** 地図クリック時のコールバック */
  onMapClick?: (event: MouseEvent) => void;
  /** 地図ズーム時のコールバック */
  onZoom?: (zoom: number) => void;
  /** 地図パン時のコールバック */
  onPan?: (center: [number, number]) => void;
}

// 地図スタイル
export interface MapStyle {
  /** 都道府県の塗りつぶし色 */
  fillColor?: string;
  /** 都道府県の境界線色 */
  strokeColor?: string;
  /** 境界線の太さ */
  strokeWidth?: number;
  /** ホバー時の色 */
  hoverColor?: string;
  /** 選択時の色 */
  selectedColor?: string;
  /** ラベルのフォントサイズ */
  labelFontSize?: number;
  /** ラベルの色 */
  labelColor?: string;
}

// 地図コントロール
export interface MapControls {
  /** ズームコントロールを表示するか */
  showZoom?: boolean;
  /** パンコントロールを表示するか */
  showPan?: boolean;
  /** リセットボタンを表示するか */
  showReset?: boolean;
  /** 凡例を表示するか */
  showLegend?: boolean;
}

// 地図状態
export interface MapState {
  /** 現在のズームレベル */
  zoom: number;
  /** 現在の中心座標 */
  center: [number, number];
  /** 選択された都道府県 */
  selectedPrefecture: PrefectureFeature | null;
  /** ホバー中の都道府県 */
  hoveredPrefecture: PrefectureFeature | null;
  /** 地図が読み込み中か */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
}

// 地図設定
export interface MapConfig extends MapProps, MapEvents, MapStyle, MapControls {
  /** 地図の投影法 */
  projection?: "mercator" | "albers" | "equalEarth";
  /** アニメーションを有効にするか */
  enableAnimation?: boolean;
  /** アニメーション時間（ミリ秒） */
  animationDuration?: number;
}

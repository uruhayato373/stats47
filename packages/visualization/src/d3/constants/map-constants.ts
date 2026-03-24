/**
 * ランキング地図表示用の設定定数
 *
 * RankingMapCardコンポーネントで使用する地図のデフォルト設定値を定義します。
 */

/**
 * 地図のデフォルトスタイル設定
 */
export const DEFAULT_MAP_STYLE = {
  /** 都道府県の境界線色 */
  strokeColor: "#94a3b8",
  /** 境界線の太さ */
  strokeWidth: 0.2,
  /** ホバー時の色 */
  hoverColor: "#3b82f6",
  /** 選択時の色 */
  selectedColor: "#1d4ed8",
  /** ラベルのフォントサイズ（0で非表示） */
  labelFontSize: 0,
  /** ラベルの色 */
  labelColor: "#374151",
  /** アニメーションを有効にするか */
  enableAnimation: true,
  /** アニメーション時間（ミリ秒） */
  animationDuration: 300,
} as const;

/**
 * 地図のデフォルト投影法
 */
export const DEFAULT_MAP_PROJECTION = "mercator" as const;

/**
 * 地図コンポーネントの設定定数
 */

/** モバイル判定のブレークポイント（px） */
export const MOBILE_BREAKPOINT = 768;

/** モバイル表示時のスケール倍率 */
export const MOBILE_SCALE_FACTOR = 2.5;

/** 地図のパディング（px） */
export const MAP_PADDING = 20;

/** ズームの最小スケール */
export const ZOOM_MIN_SCALE = 0.5;

/** ズームの最大スケール */
export const ZOOM_MAX_SCALE = 8;

/** ズームアニメーションのデフォルト時間（ms） */
export const ZOOM_ANIMATION_DURATION = 300;

/** ズームイン/アウトの倍率 */
export const ZOOM_SCALE_FACTOR = 1.5;

/** ツールチップのz-index */
export const TOOLTIP_Z_INDEX = 9999;

/** ツールチップのオフセット（px） */
export const TOOLTIP_OFFSET_X = 10;
export const TOOLTIP_OFFSET_Y = -10;

/**
 * PrefectureMapコンポーネントのデフォルトプロパティ値
 */
export const DEFAULT_PREFECTURE_MAP_PROPS = {
  /** 地図の高さ（px） */
  height: 600,
  /** 地図の中心座標 [経度, 緯度] */
  center: [137, 38] as [number, number],
  /** 初期ズームレベル */
  zoom: 1,
  /** 自動的に領域を合わせるか */
  autoFit: true,
  /** ズーム有効化 */
  enableZoom: true,
  /** 枠線表示 */
  withBorder: true,
  /** モバイルでのズーム無効化 */
  disableZoomOnMobile: true,
  /** 回転角度（度数法） */
  rotate: 0,
  /** データなし時のデフォルト塗りつぶし色 */
  noDataFillColor: "#e0e0e0",
} as const;


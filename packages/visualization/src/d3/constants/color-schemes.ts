import type { ColorScheme, ColorSchemeType, D3ColorScheme } from "../types";

/**
 * Sequential（順序）カラースキーム
 * 値の大小を連続的に表現するためのスキーム
 */
export const SEQUENTIAL_COLOR_SCHEMES: ColorScheme[] = [
  // 単色グラデーション
  { value: 'interpolateBlues', label: '青', type: 'sequential' },
  { value: 'interpolateGreens', label: '緑', type: 'sequential' },
  { value: 'interpolateGreys', label: 'グレー', type: 'sequential' },
  { value: 'interpolateOranges', label: 'オレンジ', type: 'sequential' },
  { value: 'interpolatePurples', label: '紫', type: 'sequential' },
  { value: 'interpolateReds', label: '赤', type: 'sequential' },
  
  // マルチカラー系
  { value: 'interpolateBuGn', label: '青→緑', type: 'sequential' },
  { value: 'interpolateBuPu', label: '青→紫', type: 'sequential' },
  { value: 'interpolateGnBu', label: '緑→青', type: 'sequential' },
  { value: 'interpolateOrRd', label: 'オレンジ→赤', type: 'sequential' },
  { value: 'interpolatePuBuGn', label: '紫→青→緑', type: 'sequential' },
  { value: 'interpolatePuBu', label: '紫→青', type: 'sequential' },
  { value: 'interpolatePuRd', label: '紫→赤', type: 'sequential' },
  { value: 'interpolateRdPu', label: '赤→紫', type: 'sequential' },
  { value: 'interpolateYlGnBu', label: '黄→緑→青', type: 'sequential' },
  { value: 'interpolateYlGn', label: '黄→緑', type: 'sequential' },
  { value: 'interpolateYlOrBr', label: '黄→橙→茶', type: 'sequential' },
  { value: 'interpolateYlOrRd', label: '黄→橙→赤', type: 'sequential' },

  // 知覚的に均一（色覚異常対応）
  { value: 'interpolateViridis', label: 'Viridis', type: 'sequential' },
  { value: 'interpolatePlasma', label: 'Plasma', type: 'sequential' },
  { value: 'interpolateInferno', label: 'Inferno', type: 'sequential' },
  { value: 'interpolateMagma', label: 'Magma', type: 'sequential' },
  { value: 'interpolateTurbo', label: 'Turbo', type: 'sequential' },
  { value: 'interpolateCool', label: 'Cool', type: 'sequential' },
  { value: 'interpolateWarm', label: 'Warm', type: 'sequential' },
  { value: 'interpolateCividis', label: 'Cividis', type: 'sequential' },
  { value: 'interpolateCubehelix', label: 'Cubehelix', type: 'sequential' },
];

/**
 * Diverging（発散）カラースキーム
 * 中央値を基準に両方向に変化するスキーム（例：負←0→正）
 */
export const DIVERGING_COLOR_SCHEMES: ColorScheme[] = [
  { value: 'interpolateBrBG', label: '茶→青緑', type: 'diverging' },
  { value: 'interpolatePRGn', label: '紫→緑', type: 'diverging' },
  { value: 'interpolatePiYG', label: 'ピンク→黄緑', type: 'diverging' },
  { value: 'interpolatePuOr', label: '紫→オレンジ', type: 'diverging' },
  { value: 'interpolateRdBu', label: '赤→青', type: 'diverging' },
  { value: 'interpolateRdGy', label: '赤→グレー', type: 'diverging' },
  { value: 'interpolateRdYlBu', label: '赤→黄→青', type: 'diverging' },
  { value: 'interpolateRdYlGn', label: '赤→黄→緑', type: 'diverging' },
  { value: 'interpolateSpectral', label: 'スペクトラル', type: 'diverging' },
];

/**
 * Categorical（カテゴリ）カラースキーム
 * カテゴリデータ用の離散的な色セット
 * 
 * 注意: 現時点ではランキング可視化では使用しませんが、
 * 将来的な拡張のために定義しています。
 */
export const CATEGORICAL_COLOR_SCHEMES: ColorScheme[] = [
  { value: 'schemeCategory10', label: 'Category 10色', type: 'categorical' },
  { value: 'schemeAccent', label: 'Accent', type: 'categorical' },
  { value: 'schemeDark2', label: 'Dark2', type: 'categorical' },
  { value: 'schemePaired', label: 'Paired', type: 'categorical' },
  { value: 'schemePastel1', label: 'Pastel1', type: 'categorical' },
  { value: 'schemePastel2', label: 'Pastel2', type: 'categorical' },
  { value: 'schemeSet1', label: 'Set1', type: 'categorical' },
  { value: 'schemeSet2', label: 'Set2', type: 'categorical' },
  { value: 'schemeSet3', label: 'Set3', type: 'categorical' },
  { value: 'schemeTableau10', label: 'Tableau 10色', type: 'categorical' },
];

/**
 * カラースキーム名の略称から正式名へのマッピング
 * d3jsの正式名は "interpolate" プレフィックスが必要
 */
export const COLOR_SCHEME_ALIASES: Record<string, D3ColorScheme> = {
  // Sequential - 単色系
  Blues: "interpolateBlues",
  Greens: "interpolateGreens",
  Greys: "interpolateGreys",
  Oranges: "interpolateOranges",
  Purples: "interpolatePurples",
  Reds: "interpolateReds",

  // Sequential - マルチカラー系
  BuGn: "interpolateBuGn",
  BuPu: "interpolateBuPu",
  GnBu: "interpolateGnBu",
  OrRd: "interpolateOrRd",
  PuBuGn: "interpolatePuBuGn",
  PuBu: "interpolatePuBu",
  PuRd: "interpolatePuRd",
  RdPu: "interpolateRdPu",
  YlGnBu: "interpolateYlGnBu",
  YlGn: "interpolateYlGn",
  YlOrBr: "interpolateYlOrBr",
  YlOrRd: "interpolateYlOrRd",

  // Sequential - 知覚的に均一
  Viridis: "interpolateViridis",
  Plasma: "interpolatePlasma",
  Inferno: "interpolateInferno",
  Magma: "interpolateMagma",
  Cividis: "interpolateCividis",
  Warm: "interpolateWarm",
  Cool: "interpolateCool",
  Turbo: "interpolateTurbo",
  Cubehelix: "interpolateCubehelix",

  // Diverging
  BrBG: "interpolateBrBG",
  PRGn: "interpolatePRGn",
  PiYG: "interpolatePiYG",
  PuOr: "interpolatePuOr",
  RdBu: "interpolateRdBu",
  RdGy: "interpolateRdGy",
  RdYlBu: "interpolateRdYlBu",
  RdYlGn: "interpolateRdYlGn",
  Spectral: "interpolateSpectral",
};

/**
 * 用途別おすすめカラースキーム
 */
export const RECOMMENDED_COLOR_SCHEMES = {
  // 気象・環境
  temperature: "interpolateYlOrRd",      // 気温
  sunshine: "interpolateYlOrRd",         // 日照時間
  rainfall: "interpolateBlues",          // 降水量
  snow: "interpolatePuBu",              // 降雪量
  humidity: "interpolateBuGn",          // 湿度

  // 人口・社会
  population: "interpolateOranges",      // 人口密度
  aging: "interpolatePurples",          // 高齢化率

  // 経済
  income: "interpolateGreens",          // 所得

  // 一般
  general: "interpolateBlues",          // 汎用ランキング
  diverging: "interpolateRdBu",         // 正負の値、偏差

  // 科学的可視化（色覚異常対応）
  scientific: "interpolateViridis",     // 科学的データ
} as const;

/**
 * カラースキーム値からタイプを取得
 */
export function getColorSchemeType(schemeValue: string): ColorSchemeType {
  const scheme = ALL_COLOR_SCHEMES.find(s => s.value === schemeValue);
  return scheme?.type ?? 'sequential';
}

export const ALL_COLOR_SCHEMES: ColorScheme[] = [
  ...SEQUENTIAL_COLOR_SCHEMES,
  ...DIVERGING_COLOR_SCHEMES,
  ...CATEGORICAL_COLOR_SCHEMES,
];
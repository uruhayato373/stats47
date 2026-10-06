/**
 * 動画の基本設定
 */
export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
} as const;

/**
 * シーンの継続時間（フレーム数）
 */
export const SCENE_DURATION = {
  intro: 120,   // 4秒
  title: 75,    // 2.5秒
  rank5: 90,    // 3秒
  rank4: 90,    // 3秒
  rank3: 90,    // 3秒
  rank2: 90,    // 3秒
  rank1: 90,    // 3秒
  table: 150,   // 5秒
  last: 150,    // 5秒
  mapStatic: 90, // 3秒（YouTube/Instagram の静的タイルマップ）
} as const;

/**
 * トランジション時間（フレーム数）
 */
export const TRANSITION_DURATION = {
  fadeIn: 20,
  fadeOut: 20,
  slideIn: 30,
} as const;

/**
 * NextTopLoader設定
 *
 * ページ遷移時のローディングバーの設定を提供します。
 */

import type { NextTopLoaderProps } from "nextjs-toploader";

/**
 * NextTopLoaderの設定オブジェクト
 */
export const nextTopLoaderConfig: NextTopLoaderProps = {
  color: "#2299DD",
  initialPosition: 0.08,
  crawlSpeed: 200,
  height: 3,
  crawl: true,
  showSpinner: false,
  easing: "ease",
  speed: 200,
  shadow: "0 0 10px #2299DD,0 0 5px #2299DD",
};

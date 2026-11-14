/**
 * @stats47/visualization
 *
 * 可視化関連の共有型定義・ユーティリティを提供します。
 */

// D3 チャートコンポーネントの barrel export を廃止（バンドルサイズ削減）
// コンポーネントは "@stats47/visualization/d3" から直接 import すること
// 型・定数・ユーティリティのみルートから re-export（コンポーネント本体は除外）
export * from "./d3/types";
export * from "./d3/constants";
export * from "./d3/hooks";
export * from "./d3/utils";

// 縮小表示でも読める文字サイズの計算 (apps/web の React 描画の SVG が D3 の図と同じ下限を使う)
export { estimateTextWidth, MIN_READABLE_TEXT_PX, readableFontSize } from "./shared/layout";

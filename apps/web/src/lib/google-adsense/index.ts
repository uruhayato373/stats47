/**
 * Google AdSense統合ライブラリ
 *
 * Google AdSense広告を表示するための技術ユーティリティ。
 * プロジェクト固有のビジネスロジックは含まない。
 *
 * @example
 * ```tsx
 * import { AdSenseScript, AdSenseAd } from "@/lib/google-adsense";
 *
 * // layout.tsxでスクリプトを読み込み
 * <AdSenseScript />
 *
 * // 広告を表示
 * <AdSenseAd format="rectangle" slotId="1234567890" />
 * ```
 */

export * from "./constants";
export type * from "./types";
export * from "./components";

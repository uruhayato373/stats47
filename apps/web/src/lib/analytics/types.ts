/**
 * Google Analytics 4 型定義
 *
 * GA4のイベントトラッキング用の型定義を提供します。
 */

/**
 * gtag関数の型定義
 */
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "set" | "get" | "consent",
      targetId: string | object,
      config?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/**
 * ページビューのパラメータ
 */
export interface PageViewParams {
  /**
   * ページのURL
   */
  url: string;

  /**
   * ページタイトル（オプション）
   */
  title?: string;

  /**
   * 追加のパラメータ（オプション）
   */
  params?: Record<string, unknown>;
}

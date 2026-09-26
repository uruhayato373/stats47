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
 * page_view の送信理由。landing = 着地、navigation = サイト内のページ移動、
 * query_change = 同じページでクエリだけ変わった (年度・県・基準の切替など)。
 */
export type PageViewTrigger = "landing" | "navigation" | "query_change";

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

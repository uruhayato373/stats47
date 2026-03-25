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
 * カスタムイベントの基本パラメータ
 */
export interface BaseEventParams {
  /**
   * イベントアクション（例: "click", "submit", "download"）
   */
  action: string;

  /**
   * イベントカテゴリ（例: "button", "form", "link"）
   */
  category: string;

  /**
   * イベントラベル（オプション）
   */
  label?: string;

  /**
   * イベント値（オプション）
   */
  value?: number;
}

/**
 * コンバージョンイベントのパラメータ
 */
export interface ConversionEventParams {
  /**
   * コンバージョンイベント名（例: "purchase", "signup", "download"）
   */
  eventName: string;

  /**
   * コンバージョン値（オプション）
   */
  value?: number;

  /**
   * 通貨コード（例: "JPY", "USD"）
   */
  currency?: string;

  /**
   * 追加のパラメータ（オプション）
   */
  params?: Record<string, unknown>;
}

/**
 * エンゲージメント指標のパラメータ
 */
export interface EngagementEventParams {
  /**
   * エンゲージメントイベント名（例: "scroll", "video_play", "file_download"）
   */
  eventName: string;

  /**
   * エンゲージメント値（オプション）
   */
  value?: number;

  /**
   * 追加のパラメータ（オプション）
   */
  params?: Record<string, unknown>;
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


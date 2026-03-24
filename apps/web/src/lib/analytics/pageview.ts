/**
 * ページビュートラッキング
 *
 * Google Analytics 4にページビューを送信する関数を提供します。
 */

import type { PageViewParams } from "./types";

/**
 * GA4測定ID
 * 環境変数から取得、設定されていない場合はundefined
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * ページビューを送信
 *
 * @param params - ページビューのパラメータ
 */
export function pageview(params: PageViewParams): void {
  // 測定IDが設定されていない、またはgtagが利用できない場合は何もしない
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) {
    return;
  }

  // ページビューを送信
  window.gtag("event", "page_view", {
    page_path: params.url,
    page_location: window.location.origin + params.url,
    page_title: params.title,
    page_referrer: document.referrer,
    ...params.params,
  });
}

/**
 * 現在のページのページビューを送信
 *
 * 現在のURLとタイトルを使用してページビューを送信します。
 */
export function trackPageView(): void {
  if (typeof window === "undefined") {
    return;
  }

  pageview({
    url: window.location.pathname + window.location.search,
    title: document.title,
  });
}


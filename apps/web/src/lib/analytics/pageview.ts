/**
 * ページビュートラッキング
 *
 * Google Analytics 4にページビューを送信する関数を提供します。
 */

import { resolvePageContext } from "./page-context";

import type { PageViewParams, PageViewTrigger } from "./types";

/**
 * GA4測定ID
 * 環境変数から取得、設定されていない場合はundefined
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/** gtag.js は afterInteractive で読み込まれるため、着地直後は未定義のことがある。短く再試行する。 */
const GTAG_RETRY_INTERVAL_MS = 500;
const GTAG_MAX_RETRIES = 10;

/** 直前に page_view を送ったサイト内 URL (path + query)。サイト内遷移の参照元に使う。 */
let previousUrl: string | null = null;

/** サイト内遷移の参照元を決める。初回は document.referrer (外部の参照元)、以後は直前のサイト内 URL。 */
export function resolvePageReferrer(prevUrl: string | null, origin: string, documentReferrer: string): string {
  return prevUrl ? origin + prevUrl : documentReferrer;
}

/** 遷移の種類を決める。path が同じでクエリだけ変わった場合は query_change (年度・県の切替など)。 */
export function resolvePageViewTrigger(prevUrl: string | null, url: string): PageViewTrigger {
  if (!prevUrl) return "landing";
  const pathOf = (u: string) => u.split("?")[0];
  return pathOf(prevUrl) === pathOf(url) ? "query_change" : "navigation";
}

/**
 * ページビューを送信
 *
 * @param params - ページビューのパラメータ
 */
export function pageview(params: PageViewParams, attempt = 0): void {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  if (!window.gtag) {
    if (attempt < GTAG_MAX_RETRIES) {
      window.setTimeout(() => pageview(params, attempt + 1), GTAG_RETRY_INTERVAL_MS);
    }
    return;
  }

  const prevUrl = previousUrl;
  previousUrl = params.url;
  window.gtag("event", "page_view", {
    page_location: window.location.origin + params.url,
    page_title: params.title,
    page_referrer: resolvePageReferrer(prevUrl, window.location.origin, document.referrer),
    pv_trigger: resolvePageViewTrigger(prevUrl, params.url),
    ...resolvePageContext(params.url),
    ...params.params,
  });
}

/**
 * Google Analytics 4 スクリプト読み込みコンポーネント
 *
 * Next.js 15 App RouterでGA4スクリプトを最適化された方法で読み込みます。
 * 環境変数 `NEXT_PUBLIC_GA_MEASUREMENT_ID` が設定されている場合のみ有効化されます。
 *
 * 使用方法:
 *   <GoogleAnalytics />
 *
 * 環境変数:
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID - GA4測定ID（G-XXXXXXXXXX形式）
 */

"use client";

import Script from "next/script";

/**
 * GA4測定ID
 * 環境変数から取得、設定されていない場合はundefined
 */
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics 4 コンポーネント
 *
 * GA4スクリプトを読み込み、初期化します。
 * 環境変数が設定されていない場合は何も表示しません。
 *
 * @returns GA4スクリプトタグまたはnull
 */
export function GoogleAnalytics(): React.ReactElement | null {
  // 測定IDが設定されていない場合は何も表示しない
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google Analytics 4 スクリプト */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          // 国内向けサイトとして analytics_storage は granted デフォルト
          // ad_storage のみ denied で広告領域は同意 opt-in。Issue #37
          gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
          });
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false,
          });
          // localStorage の同意状態が denied なら analytics も off に降格
          try {
            var consent = localStorage.getItem('stats47_cookie_consent');
            if (consent === 'denied') {
              gtag('consent', 'update', {
                analytics_storage: 'denied',
              });
            } else if (consent === 'granted') {
              gtag('consent', 'update', {
                ad_storage: 'granted',
              });
            }
          } catch(e) {}
        `}
      </Script>
    </>
  );
}

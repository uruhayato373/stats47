"use client";

/**
 * Google AdSenseスクリプトコンポーネント
 *
 * AdSense広告を表示するために必要なスクリプトを読み込みます。
 * 本番環境でのみスクリプトを読み込み、開発環境では何も表示しません。
 *
 * Note: next/scriptの<Script>コンポーネントはdata-nscript属性を追加するため、
 * AdSenseと互換性がありません。代わりにuseEffectで動的にスクリプトを読み込みます。
 */

import { useEffect } from "react";

/**
 * AdSenseスクリプトコンポーネント
 */
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const isEnabled =
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ENABLED === "true";

  useEffect(() => {
    if (!isEnabled || !clientId) return;

    const load = () => {
      const existingScript = document.querySelector(
        `script[src*="adsbygoogle.js?client=${clientId}"]`
      );
      if (existingScript) return;

      const script = document.createElement("script");
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    };

    // メインコンテンツの描画を優先し、アイドル時にスクリプトを読み込む
    const timer = setTimeout(() => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(load);
      } else {
        load();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [clientId, isEnabled]);

  // このコンポーネントはUIをレンダリングしない
  return null;
}

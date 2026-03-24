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
    // 開発環境またはAdSenseが無効な場合は何もしない
    if (!isEnabled || !clientId) {
      console.log("[AdSenseScript] Skipped:", { isEnabled, clientId: clientId ? "Set" : "Not Set" });
      return;
    }

    // 既にスクリプトが読み込まれている場合は何もしない
    const existingScript = document.querySelector(
      `script[src*="adsbygoogle.js?client=${clientId}"]`
    );
    if (existingScript) {
      console.log("[AdSenseScript] Script already loaded");
      return;
    }

    // AdSenseスクリプトを動的に追加
    const script = document.createElement("script");
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      console.log("[AdSenseScript] Script loaded successfully");
    };
    
    script.onerror = (error) => {
      console.error("[AdSenseScript] Failed to load script:", error);
    };
    
    document.head.appendChild(script);
    console.log("[AdSenseScript] Script added to head");

    return () => {
      // クリーンアップ時にスクリプトを削除（オプション）
      // 通常、AdSenseスクリプトは一度読み込まれたら削除しない
    };
  }, [clientId, isEnabled]);

  // このコンポーネントはUIをレンダリングしない
  return null;
}

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

    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
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

    const loadOnIdle = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(load);
      } else {
        load();
      }
    };

    // メインコンテンツの描画を優先し、5s 経過 or 初回ユーザー操作のいずれか先で読み込む。
    // LCP 計測ウィンドウ (主要 URL で ~3-5s) より後にずらして hydration コストを LCP から外す。
    const timer = setTimeout(loadOnIdle, 5000);
    const onInteract = () => {
      clearTimeout(timer);
      loadOnIdle();
    };
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener("scroll", onInteract, opts);
    window.addEventListener("touchstart", onInteract, opts);
    window.addEventListener("click", onInteract, opts);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onInteract);
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("click", onInteract);
    };
  }, [clientId, isEnabled]);

  // このコンポーネントはUIをレンダリングしない
  return null;
}

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

import { ADSENSE_DISPLAY_ENABLED } from "../constants";

/**
 * AdSenseスクリプトコンポーネント
 */
export function AdSenseScript() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID;
  const isEnabled =
    ADSENSE_DISPLAY_ENABLED &&
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

    // メインコンテンツの描画を優先し、アイドル時にスクリプトを読み込む。
    // 3000ms 遅延は広告の遅延展開 → CLS を引き起こしていたため requestIdleCallback のみに変更。
    // ブラウザがアイドルになったタイミングで読み込み、強制遅延は排除する。
    let rafId: number;
    const schedule = () => {
      if ("requestIdleCallback" in window) {
        (window as Window & typeof globalThis).requestIdleCallback(load, { timeout: 4000 });
      } else {
        load();
      }
    };
    // rAF で 1 フレーム待ち、初期レイアウト確定後にアイドルキューに積む
    rafId = requestAnimationFrame(schedule);

    return () => cancelAnimationFrame(rafId);
  }, [clientId, isEnabled]);

  // このコンポーネントはUIをレンダリングしない
  return null;
}

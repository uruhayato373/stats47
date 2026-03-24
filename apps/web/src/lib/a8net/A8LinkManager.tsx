"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    a8linkmgr?: (config: { config_id: string }) => void;
  }
}

const CONFIG_ID = "7aRTfRVSjj8e68htW4xW";

/**
 * A8.net リンクマネージャー
 *
 * ページ内の通常リンクを自動的にアフィリエイトリンクに変換する。
 * スクリプトの読み込み完了後に初期化を実行する。
 */
export function A8LinkManager() {
  useEffect(() => {
    const existingScript = document.querySelector(
      'script[src*="a8linkmgr.js"]'
    );
    if (existingScript) return;

    const script = document.createElement("script");
    script.src = "//statics.a8.net/a8link/a8linkmgr.js";
    script.async = true;
    script.onload = () => {
      window.a8linkmgr?.({ config_id: CONFIG_ID });
    };
    document.head.appendChild(script);
  }, []);

  return null;
}

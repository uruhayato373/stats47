"use client";

import { useState } from "react";

/**
 * クリップボード操作を管理するカスタムフック
 *
 * @param text - コピーするテキスト
 * @returns コピー関数とコピー状態
 */
export function useClipboard(text: string) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in some browsers
    }
  };

  return { copied, copy };
}

"use client";

import { useEffect, useState } from "react";

/**
 * シェア用URLを管理するカスタムフック
 *
 * @param url - 指定されたURL（オプション）
 * @returns シェア用URL
 */
export function useShareUrl(url?: string): string {
  const [shareUrl, setShareUrl] = useState<string>(url ?? "");

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync browser URL on mount
      setShareUrl(window.location.href);
    }
  }, [url]);

  return shareUrl;
}

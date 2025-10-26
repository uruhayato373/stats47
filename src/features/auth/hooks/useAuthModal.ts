"use client";

import { useEffect, useState } from "react";

/**
 * 認証モーダルの状態とURLパラメータ処理を管理するカスタムフック
 */
export function useAuthModal() {
  const [isOpen, setIsOpen] = useState(false);

  // URLパラメータでモーダルを自動表示
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "true") {
      setIsOpen(true);
      // URLからパラメータを削除（ブラウザ履歴を汚さないため）
      const url = new URL(window.location.href);
      url.searchParams.delete("auth");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

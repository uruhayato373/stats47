"use client";

import { useEffect, useState } from "react";

/**
 * 簡易トースト通知。旧 UI (sns.html toast()) の
 * `position:fixed;bottom:20px;right:20px` + 2.5s 自動消滅を React 化したもの。
 * このページ専用の最小実装 (共有 lib 化は複数ページで要る時に検討)。
 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [message]);

  return { message, showToast: setMessage };
}

export function ToastPortal({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[99] rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-console-bg shadow-lg">
      {message}
    </div>
  );
}

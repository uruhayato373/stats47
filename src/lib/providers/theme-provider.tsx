"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { initThemeAtom, mountedAtom } from "@/atoms/theme";

/**
 * テーマ初期化プロバイダー
 *
 * アプリケーション起動時にテーマの初期化を行います。
 * - システム設定の検出
 * - localStorageからの復元
 * - マウント状態の管理
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useSetAtom(initThemeAtom);
  const [mounted] = useAtom(mountedAtom);

  useEffect(() => {
    if (!mounted) {
      initTheme();
    }
  }, [initTheme, mounted]);

  return <>{children}</>;
}

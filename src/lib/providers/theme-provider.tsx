"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { initThemeAtom, mountedAtom } from "@/store/theme";

/**
 * テーマ初期化プロバイダー
 *
 * アプリケーション起動時にテーマの初期化を行います。
 * - システム設定の検出
 * - localStorageからの復元
 * - マウント状態の管理
 * - ブロッキングスクリプトとの連携
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const initTheme = useSetAtom(initThemeAtom);
  const [mounted, setMounted] = useAtom(mountedAtom);

  useEffect(() => {
    if (!mounted) {
      // ブロッキングスクリプトで既にテーマクラスが適用されているか確認
      const hasThemeClass =
        document.documentElement.classList.contains("light") ||
        document.documentElement.classList.contains("dark");

      if (hasThemeClass) {
        // すでにテーマが適用されている場合は、Jotai の状態を同期するだけ
        // 二重適用を防ぐため、initTheme は呼ばずに mounted だけ true にする
        setMounted(true);
      } else {
        // ブロッキングスクリプトが実行されていない場合（フォールバック）
        initTheme();
      }
    }
  }, [initTheme, mounted, setMounted]);

  return <>{children}</>;
}

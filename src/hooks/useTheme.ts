"use client";

import { useTheme as useNextTheme } from "next-themes";

/**
 * next-themes をラップしたカスタムフック
 *
 * プロジェクト固有の拡張が必要な場合は、このフックで行います。
 * 現時点では next-themes をそのまま再エクスポート。
 */
export function useTheme() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();
  const currentTheme = resolvedTheme || theme;

  return {
    theme: currentTheme, // 実際に適用されているテーマ
    setTheme,
    systemTheme,
    toggleTheme: () => {
      setTheme(currentTheme === "light" ? "dark" : "light");
    },
  };
}

/**
 * Hydrationエラーを防ぐために、マウント状態を確認するフック
 *
 * @returns mounted - クライアント側でマウントされたかどうか
 */
export function useThemeMounted() {
  const { theme, setTheme, systemTheme, resolvedTheme } = useNextTheme();

  // next-themesはマウント状態をtrue/falseで返すのではなく、
  // マウント前はthemeがundefinedになる
  const mounted = theme !== undefined;
  const currentTheme = resolvedTheme || theme;

  return {
    mounted,
    theme: currentTheme,
    setTheme,
    systemTheme,
    toggleTheme: () => {
      setTheme(currentTheme === "light" ? "dark" : "light");
    },
  };
}

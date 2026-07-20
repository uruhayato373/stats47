"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * next-themes を使用したテーマプロバイダー
 * 
 * shadcn/ui の標準アプローチに従い、next-themes を使用します。
 * - FOUC（Flash of Unstyled Content）を自動で防止
 * - localStorage（キー `theme`）への自動保存
 * - dark は opt-in（既定 light・`enableSystem={false}` で OS の prefers-color-scheme に追従しない）。
 *   仕様の正典: docs/01_技術設計/15_デザインシステムSSOT.md §「カラーモード（light / dark）」
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}


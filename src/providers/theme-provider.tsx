"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/**
 * next-themes を使用したテーマプロバイダー
 * 
 * shadcn/ui の標準アプローチに従い、next-themes を使用します。
 * - FOUC（Flash of Unstyled Content）を自動で防止
 * - localStorage への自動保存
 * - システムテーマの自動検出
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


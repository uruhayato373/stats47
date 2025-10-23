# next-themes 実装ガイド

## 概要

このドキュメントでは、stats47 プロジェクトにおける next-themes の実装と使用方法について説明します。

## next-themes とは

next-themes は、Next.js アプリケーションのためのテーマ管理ライブラリです。

### 主な機能

- ✅ FOUC（Flash of Unstyled Content）の自動防止
- ✅ localStorage への自動保存
- ✅ システムテーマの検出
- ✅ SSR/SSG 完全対応
- ✅ TypeScript 完全サポート
- ✅ 軽量（2.5KB gzip）

## 実装

### 1. インストール

```bash
npm install next-themes
```

### 2. ThemeProvider の設定

```typescript
// src/lib/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### 3. Layout での使用

```typescript
// src/app/layout.tsx
import { ThemeProvider } from "@/lib/providers/theme-provider";

export default function RootLayout({ children }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4. コンポーネントでの使用

```typescript
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      Toggle Theme
    </button>
  );
}
```

## ベストプラクティス

### 1. suppressHydrationWarning の使用

```typescript
<html lang="ja" suppressHydrationWarning>
```

これにより、サーバーとクライアントでのハイドレーション不一致警告を抑制します。

### 2. カスタムフックでのラップ

```typescript
// src/hooks/useTheme.ts
export function useTheme() {
  const { theme, setTheme } = useNextTheme();
  
  return {
    theme,
    setTheme,
    toggleTheme: () => setTheme(theme === "light" ? "dark" : "light"),
  };
}
```

## トラブルシューティング

### FOUC が発生する

**原因**: `suppressHydrationWarning` が設定されていない

**解決**: html タグに追加
```typescript
<html suppressHydrationWarning>
```

### テーマが切り替わらない

**原因**: CSS変数が正しく設定されていない

**解決**: `globals.css` を確認
```css
.dark {
  --background: 222 47% 11%;
  /* ... */
}
```

## 参考リンク

- [next-themes GitHub](https://github.com/pacocoursey/next-themes)
- [shadcn/ui テーマドキュメント](https://ui.shadcn.com/docs/dark-mode)

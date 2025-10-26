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

### 2. カスタムフックでのラップ（推奨）

next-themesを直接使用せず、カスタムフックでラップすることで、プロジェクト固有のロジックを追加できます。

```typescript
// src/hooks/useTheme.ts
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
```

**利点**:
- `toggleTheme()`の便利な関数を提供
- `resolvedTheme`で実際のテーマを取得
- next-themesのAPIが変わっても影響を最小化
- 将来的な拡張が容易

## shadcn/uiとの連携

### 役割分担

**next-themes**:
- テーマ状態の管理（light/dark/system）
- `<html>`タグへのクラス追加/削除
- localStorageへの自動保存
- SSRでのハイドレーション処理

**shadcn/ui**:
- CSS変数によるスタイリング定義
- `:root`と`.dark`でのテーマカラー定義
- Tailwindクラスへのマッピング

### 動作フロー

1. **ユーザーがボタンをクリック**
```tsx
<button onClick={toggleTheme}>
```

2. **next-themesが`<html>`のクラスを変更**
```html
<!-- 変更前 -->
<html class="light">

<!-- 変更後 -->
<html class="dark">
```

3. **shadcn/uiのCSS変数が自動適用**
```css
/* .darkクラスがあるので、このルールが適用される */
.dark {
  --primary: 217 91% 60%;
}
```

4. **すべての`bg-primary`が新しい色に**
```tsx
<div className="bg-primary">
  {/* 自動的に新しい--primaryの色になる */}
</div>
```

### ベストプラクティス

**✅ 推奨**: shadcn/uiのテーマトークンを使用

```tsx
"use client";

import { useTheme } from "@/hooks/useTheme";

export function ThemeButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="bg-background text-foreground border-border hover:bg-accent"
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
```

**❌ 非推奨**: 条件分岐でスタイルを切り替え

```tsx
// これは冗長で保守性が低い
const { theme } = useTheme();
const bgClass = theme === "dark" ? "bg-gray-800" : "bg-white";
const textClass = theme === "dark" ? "text-white" : "text-gray-900";

return <div className={`${bgClass} ${textClass}`}>...</div>;
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

# shadcn/ui テーマシステム

## 概要

stats47プロジェクトでは、shadcn/uiのBlueテーマを使用して統計サイトに適したプロフェッショナルなデザインを実現しています。このドキュメントでは、テーマ変数、カラーパレット、ダークモード対応について詳しく説明します。

## next-themes 統合

### 概要

stats47プロジェクトでは、テーマ管理に **next-themes** を採用しています。
これは shadcn/ui の公式推奨アプローチであり、以下の利点があります：

- FOUC（Flash of Unstyled Content）の自動防止
- localStorage への自動保存
- システムテーマの自動検出
- SSR/SSG 完全対応

### アーキテクチャ

**役割分担**:
- **next-themes**: テーマ状態の管理、`<html>`クラスの追加/削除、localStorage保存
- **shadcn/ui**: CSS変数によるスタイリング定義
- **useTheme hook**: next-themesのラッパー、便利な`toggleTheme()`を提供

### 使用方法

#### コンポーネントでの使用

```typescript
import { useTheme } from "@/hooks/useTheme";

export function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

**重要**: スタイリングにはshadcn/uiのテーマトークンを使用してください：

```tsx
// ✅ 推奨: shadcn/uiのテーマトークンを使用
<div className="bg-background text-foreground border-border">
  {/* テーマに応じて自動的に色が変わる */}
</div>

// ❌ 非推奨: 条件分岐でスタイルを切り替え
const bgClass = theme === "dark" ? "bg-gray-800" : "bg-white";
<div className={bgClass}>
```

### 設定

`src/lib/providers/theme-provider.tsx` で設定を変更できます：

```typescript
<ThemeProvider
  attribute="class"           // HTML classでテーマを管理
  defaultTheme="light"        // デフォルトテーマ
  enableSystem={false}        // システムテーマ検出を無効化
  disableTransitionOnChange={false}  // テーマ切り替え時のトランジション
>
```

## Blueテーマ変数

### ライトモード（:root）

```css
:root {
  --background: 0 0% 100%;           /* 白 */
  --foreground: 222 47% 11%;         /* ダークグレー */
  --card: 0 0% 100%;                 /* 白 */
  --card-foreground: 222 47% 11%;    /* ダークグレー */
  --popover: 0 0% 100%;              /* 白 */
  --popover-foreground: 222 47% 11%; /* ダークグレー */
  --primary: 221 83% 53%;            /* Blue */
  --primary-foreground: 210 40% 98%; /* 白 */
  --secondary: 210 40% 96%;          /* ライトグレー */
  --secondary-foreground: 222 47% 11%; /* ダークグレー */
  --muted: 210 40% 96%;              /* ライトグレー */
  --muted-foreground: 215 16% 47%;   /* ミディアムグレー */
  --accent: 210 40% 96%;             /* ライトグレー */
  --accent-foreground: 222 47% 11%;  /* ダークグレー */
  --destructive: 0 84% 60%;          /* レッド */
  --destructive-foreground: 210 40% 98%; /* 白 */
  --border: 214 32% 91%;              /* ライトグレー */
  --input: 214 32% 91%;              /* ライトグレー */
  --ring: 221 83% 53%;               /* Blue */
  --radius: 0.5rem;                  /* 角丸 */
}
```

### ダークモード（.dark）

```css
.dark {
  --background: 222 47% 11%;         /* ダークグレー */
  --foreground: 210 40% 98%;         /* ライトグレー */
  --card: 222 47% 11%;               /* ダークグレー */
  --card-foreground: 210 40% 98%;    /* ライトグレー */
  --popover: 222 47% 11%;            /* ダークグレー */
  --popover-foreground: 210 40% 98%; /* ライトグレー */
  --primary: 217 91% 60%;            /* ライトBlue */
  --primary-foreground: 222 47% 11%; /* ダークグレー */
  --secondary: 217 33% 17%;          /* ダークグレー */
  --secondary-foreground: 210 40% 98%; /* ライトグレー */
  --muted: 217 33% 17%;              /* ダークグレー */
  --muted-foreground: 215 20% 65%;   /* ミディアムグレー */
  --accent: 217 33% 17%;             /* ダークグレー */
  --accent-foreground: 210 40% 98%;  /* ライトグレー */
  --destructive: 0 63% 31%;           /* ダークレッド */
  --destructive-foreground: 210 40% 98%; /* ライトグレー */
  --border: 217 33% 17%;              /* ダークグレー */
  --input: 217 33% 17%;              /* ダークグレー */
  --ring: 224 76% 48%;               /* ミディアムBlue */
}
```

## カラーパレット

### プライマリカラー（Blue）

| 用途 | HSL値 | 説明 |
|------|-------|------|
| Primary | `221 83% 53%` | メインのBlue色 |
| Primary Dark | `217 91% 60%` | ダークモード用のBlue色 |
| Ring | `221 83% 53%` | フォーカス時のリング色 |
| Ring Dark | `224 76% 48%` | ダークモード用のリング色 |

### セマンティックカラー

| カラー | ライトモード | ダークモード | 用途 |
|--------|-------------|-------------|------|
| Background | `0 0% 100%` | `222 47% 11%` | 背景色 |
| Foreground | `222 47% 11%` | `210 40% 98%` | テキスト色 |
| Card | `0 0% 100%` | `222 47% 11%` | カード背景 |
| Muted | `210 40% 96%` | `217 33% 17%` | 控えめな背景 |
| Border | `214 32% 91%` | `217 33% 17%` | ボーダー色 |
| Destructive | `0 84% 60%` | `0 63% 31%` | エラー・削除色 |

## HSL形式の説明

shadcn/uiでは、HSL（Hue, Saturation, Lightness）形式でカラーを定義しています：

- **Hue（色相）**: 0-360度の色相環上の位置
- **Saturation（彩度）**: 0-100%の色の鮮やかさ
- **Lightness（明度）**: 0-100%の明るさ

### HSLからRGBへの変換例

```css
/* Blue (221 83% 53%) */
--primary: 221 83% 53%;
/* これは hsl(221, 83%, 53%) と同等 */
/* RGB値: rgb(59, 130, 246) */
```

## Tailwind CSSでの使用

### 基本クラス

```html
<!-- 背景色 -->
<div class="bg-background">背景</div>
<div class="bg-card">カード背景</div>
<div class="bg-primary">プライマリ背景</div>

<!-- テキスト色 -->
<p class="text-foreground">メインテキスト</p>
<p class="text-muted-foreground">控えめなテキスト</p>
<p class="text-primary">プライマリテキスト</p>

<!-- ボーダー -->
<div class="border border-border">ボーダー</div>
<div class="border border-primary">プライマリボーダー</div>
```

### ホバー・フォーカス状態

```html
<!-- ホバー効果 -->
<button class="bg-primary hover:bg-primary/90">ボタン</button>

<!-- フォーカス効果 -->
<input class="focus:ring-ring focus:border-primary" />

<!-- アクティブ状態 -->
<button class="bg-primary active:bg-primary/80">ボタン</button>
```

## 実装例

### テーマ切り替えボタン

```tsx
// src/components/atoms/ThemeToggleButton/ThemeToggleButton.tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="size-8 flex items-center justify-center rounded-lg border border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
};
```

### ヘッダーロゴ

```tsx
// src/components/organisms/layout/Header/HeaderLogo.tsx
"use client";

export function HeaderLogo() {
  return (
    <a
      href="#"
      className="flex items-center gap-x-1.5 text-muted-foreground hover:text-foreground transition-colors"
    >
      <div className="size-8 rounded-md flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors">
        {/* アイコン */}
      </div>
      <span className="text-foreground font-medium">
        統計で見る都道府県
      </span>
    </a>
  );
}
```

**ポイント**:
- `useTheme`は状態管理とアイコン表示のみに使用
- スタイリングは全てshadcn/uiのテーマトークンを使用
- テーマ切り替え時に自動的にスタイルが更新される

## カスタムコンポーネントでの活用

### CSS変数の直接使用

```css
.custom-component {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border));
}

.custom-component:hover {
  background-color: hsl(var(--accent));
}
```

### Tailwindの任意値

```html
<div class="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
  カスタムスタイル
</div>
```

## ダークモード切り替え

### 実装方法

```typescript
// テーマ切り替え関数
const toggleTheme = () => {
  const root = document.documentElement;
  const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  root.classList.remove('light', 'dark');
  root.classList.add(newTheme);
  
  // localStorageに保存
  localStorage.setItem('theme', newTheme);
};
```

### システム設定の検出

```typescript
// システム設定に基づく初期テーマ設定
const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
```

## アクセシビリティ

### コントラスト比

BlueテーマはWCAG AA準拠のコントラスト比を確保：

- **Primary/Background**: 4.5:1以上
- **Text/Background**: 4.5:1以上
- **Large Text**: 3:1以上

### カラーブラインド対応

- 色だけでなく、アイコンやテキストでも情報を伝達
- 十分なコントラスト比の確保
- フォーカス状態の明確な表示

## カスタマイズ

### 新しいカラーバリエーション

```css
:root {
  --success: 142 76% 36%;           /* グリーン */
  --success-foreground: 355 7% 97%; /* 白 */
  --warning: 38 92% 50%;           /* オレンジ */
  --warning-foreground: 48 96% 89%; /* 白 */
  --info: 199 89% 48%;             /* シアン */
  --info-foreground: 210 40% 98%;  /* 白 */
}
```

### カスタムコンポーネントでの使用

```typescript
// カスタムバッジコンポーネント
const StatusBadge = ({ status }: { status: 'success' | 'warning' | 'error' }) => {
  const variants = {
    success: 'bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]',
    warning: 'bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]',
    error: 'bg-destructive text-destructive-foreground',
  };
  
  return (
    <span className={`px-2 py-1 rounded-md text-sm ${variants[status]}`}>
      {status}
    </span>
  );
};
```

## パフォーマンス最適化

### CSS変数の最適化

```css
/* 使用頻度の高い変数を優先的に定義 */
:root {
  --primary: 221 83% 53%;
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  /* その他の変数... */
}
```

### 不要なスタイルの削除

```typescript
// 使用されていないカラーバリエーションを削除
// 例: 使用されていないpurple, pinkなどの変数を削除
```

## トラブルシューティング

### よくある問題

1. **カラーが適用されない**
   - CSS変数が正しく定義されているか確認
   - HSL形式の値が正しいか確認

2. **ダークモードで色が変わらない**
   - `.dark`クラスが正しく適用されているか確認
   - CSS変数のスコープを確認

3. **コントラスト比が不足**
   - WCAG AA準拠の値を確認
   - カラーピッカーでコントラスト比を測定

### デバッグ方法

```typescript
// 現在のテーマ変数を確認
const debugTheme = () => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  console.log('Current theme:', root.classList.contains('dark') ? 'dark' : 'light');
  console.log('Primary color:', computedStyle.getPropertyValue('--primary'));
  console.log('Background color:', computedStyle.getPropertyValue('--background'));
};
```

## 参考資料

- [shadcn/ui Themes](https://ui.shadcn.com/themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG Color Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [HSL Color Picker](https://hslpicker.com/)

---

**更新日**: 2025-01-20  
**バージョン**: 1.0.0  
**作成者**: stats47開発チーム

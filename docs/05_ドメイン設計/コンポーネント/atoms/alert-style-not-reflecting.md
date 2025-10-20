---
title: Alert.tsxのスタイルが反映されない問題の原因と解決策
created: 2025-01-19
updated: 2025-01-19
tags:
  - components
  - atoms
  - storybook
  - tailwind-css
  - styling
  - bug-fix
status: 解決済み
severity: 高
---

# Alert.tsxのスタイルが反映されない問題の原因と解決策

## 問題の概要

`src/components/atoms/Alert/Alert.tsx`でスタイルを調整しても、Storybookで表示する際に変更が反映されない問題が発生しています。

### 症状

1. **ライトモードで背景色が濃い**: 本来`bg-green-50`（非常に淡い緑）のはずが、濃く表示される
2. **スタイル変更が反映されない**: Alert.tsxのTailwindクラスを変更しても、Storybookでの表示が変わらない
3. **ダークモードは正常**: ダークモードでは正しく表示される

## 根本原因

**StorybookとNext.jsアプリケーションで異なるCSSファイルを使用している**ことが原因です。

### 詳細な原因分析

#### 1. CSSファイルの分離

**Storybook側**:
```typescript
// .storybook/preview.tsx (Line 4)
import "./storybook.css";
```

**Next.jsアプリケーション側**:
```typescript
// src/app/layout.tsx
import "./globals.css";
```

→ **Storybookはglobals.cssをインポートしていない**

#### 2. 両方のCSSファイルでTailwind CSSをインポート

**storybook.css**:
```css
@import "tailwindcss";

/* Storybook用の基本スタイル */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', ...;
}

.dark {
  background-color: #0a0a0a;
  color: #ededed;
}

.light {
  background-color: #ffffff;
  color: #171717;
}
```

**globals.css**:
```css
@import "tailwindcss";

/* CSS変数の定義 */
:root {
  --background: #ffffff;
  --foreground: #171717;
}

/* 多数のカスタムスタイル */
html.light header {
  background-color: #f4f4f5;
}
/* ... 100行以上のカスタムスタイル */
```

#### 3. Tailwind CSS v4のビルド動作

Tailwind CSS v4では、`@import "tailwindcss";`が**ソースファイルから直接スタイルを生成**します。

つまり：
- `storybook.css`をインポートすると、Storybook用のTailwindスタイルが生成される
- `globals.css`をインポートすると、アプリケーション用のTailwindスタイルが生成される
- **両者は独立してビルドされ、異なるスタイルセットになる**

#### 4. スタイルの詳細度（Specificity）の問題

`globals.css`には、特定の要素に対する詳細なカスタムスタイルが定義されています：

```css
/* globals.css (Line 58-64) */
html.light header .bg-white {
  background-color: #ffffff !important;
}

html.dark header .bg-white {
  background-color: #262626 !important;
}
```

これらのスタイルは、Tailwindの標準クラスよりも**詳細度が高い**ため、`bg-green-50`などのTailwindクラスを上書きします。

### なぜダークモードは正常に動作するのか？

ダークモード用のカスタムスタイルが`globals.css`に少なく、Tailwindの標準クラス（`dark:bg-green-900/20`など）が正常に適用されるためです。

## 解決策

### 推奨される解決策: Storybook用CSSをglobals.cssに統合

#### Step 1: storybook.cssを修正

`.storybook/storybook.css`を以下のように修正します：

```css
/* グローバルCSSをインポート */
@import "../src/app/globals.css";

/* Storybook固有のスタイルのみを追加 */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

**変更点**:
- `@import "tailwindcss";`を削除（globals.cssから継承）
- `.dark`と`.light`の定義を削除（globals.cssから継承）
- `@layer base`を削除（globals.cssから継承）
- Storybook固有のbodyスタイルのみを残す

#### Step 2: キャッシュをクリア

```bash
# Next.jsのキャッシュをクリア
rm -rf .next

# Storybookのキャッシュをクリア
rm -rf node_modules/.cache/storybook

# (オプション) node_modulesを再インストール
npm install
```

#### Step 3: Storybookを再起動

```bash
npm run storybook
```

### 代替案1: preview.tsxで直接globals.cssをインポート

`.storybook/preview.tsx`を修正：

```typescript
import type { Preview } from "@storybook/nextjs-vite";
import React, { useEffect, useState } from "react";
import { Provider } from "jotai";
import "../src/app/globals.css"; // ← 追加
// import "./storybook.css"; // ← コメントアウトまたは削除

const preview: Preview = {
  // ... 残りは同じ
};

export default preview;
```

**メリット**:
- シンプルで直接的
- globals.cssの変更が即座にStorybookに反映される

**デメリット**:
- Storybook固有のスタイルが適用されなくなる可能性

### 代替案2: Tailwind CSS設定の統一

`tailwind.config.ts`で、contentパスに`.storybook`ディレクトリが含まれていることを確認：

```typescript
// tailwind.config.ts
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./.storybook/**/*.{js,ts,jsx,tsx,mdx}", // ← 確認
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // ...
};
```

→ **既に設定済み**なので、この案は不要です。

## 予防策

### 1. CSS統合の原則

プロジェクトでは、**1つのメインCSSファイル（globals.css）のみを使用**し、Storybook側ではそれをインポートする方針にすべきです。

```
globals.css (メイン)
  ↑
  インポート
  ↑
storybook.css (Storybook固有のスタイルのみ追加)
```

### 2. Tailwind CSSのインポートは1箇所のみ

`@import "tailwindcss";`は**globals.cssのみ**に記述し、他のCSSファイルではインポートしないようにします。

### 3. スタイルの詳細度に注意

カスタムCSSでTailwindクラスを上書きする場合は、`!important`を避け、必要最小限の詳細度にします。

```css
/* ❌ 悪い例: 詳細度が高すぎる */
html.light header .bg-white {
  background-color: #ffffff !important;
}

/* ✅ 良い例: Tailwindクラスを使用 */
.custom-header {
  @apply bg-white dark:bg-gray-800;
}
```

### 4. 開発時のチェックリスト

コンポーネントのスタイルを変更する際：

- [ ] Next.jsアプリケーションで表示を確認
- [ ] Storybookで表示を確認
- [ ] ライトモードとダークモードの両方を確認
- [ ] ブラウザのキャッシュをクリアして再確認

## トラブルシューティング

### キャッシュクリアコマンド

```bash
# すべてのキャッシュをクリア
rm -rf .next node_modules/.cache .turbo

# Storybookを再ビルド
npm run build-storybook

# Next.jsを再ビルド
npm run build
```

### 開発サーバーの再起動

```bash
# すべての開発サーバーを停止
pkill -f "next dev"
pkill -f "storybook"

# 再起動
npm run dev          # Next.js
npm run storybook    # Storybook
```

### ブラウザのハードリロード

- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`

### スタイルが反映されない場合のデバッグ

1. **ブラウザの開発者ツールを開く**
2. **Elementsタブで該当要素を選択**
3. **Computedタブでスタイルを確認**
   - どのCSSファイルからスタイルが適用されているか確認
   - 上書きされているスタイルがないか確認
4. **Sourcesタブで生成されたCSSを確認**
   - Tailwindクラスが正しく生成されているか確認

## 実装チェックリスト

- [ ] `.storybook/storybook.css`を修正（globals.cssをインポート）
- [ ] `@import "tailwindcss";`をstorybook.cssから削除
- [ ] `.dark`と`.light`の定義をstorybook.cssから削除
- [ ] キャッシュをクリア（`.next`、`node_modules/.cache`）
- [ ] Storybookを再起動
- [ ] Alertコンポーネントの表示を確認（ライトモード、ダークモード）
- [ ] 他のコンポーネントも同様に確認

## 関連ファイル

- `.storybook/preview.tsx` - Storybookのプレビュー設定
- `.storybook/storybook.css` - Storybook用CSS（要修正）
- `src/app/globals.css` - アプリケーション全体のグローバルCSS
- `src/components/atoms/Alert/Alert.tsx` - Alertコンポーネント
- `src/components/atoms/Alert/Alert.stories.tsx` - Storybookストーリー
- `tailwind.config.ts` - Tailwind CSS設定

## 参考資料

- [Tailwind CSS v4 ドキュメント](https://tailwindcss.com/docs/v4-beta)
- [Storybook CSS設定](https://storybook.js.org/docs/configure/styling-and-css)
- [CSS詳細度について](https://developer.mozilla.org/ja/docs/Web/CSS/Specificity)

## まとめ

この問題は、**StorybookとNext.jsアプリケーションで異なるCSSファイルを使用していること**が原因でした。

解決策は、`.storybook/storybook.css`で`globals.css`をインポートすることで、両環境で同じスタイルセットを使用するようにすることです。

これにより：
- ✅ スタイル変更が即座に両環境に反映される
- ✅ ライトモードとダークモードの一貫性が保たれる
- ✅ 保守性が向上する

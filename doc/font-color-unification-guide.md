# フォント色統一設定ガイド

## 概要

このプロジェクトでは、ライトモード・ダークモード両対応の統一されたフォント色システムを構築しています。

## 基本的な使用方法

### 新規コンポーネント作成時

```tsx
"use client";

import { useStyles } from "@/hooks/useStyles";

export default function YourComponent() {
  const styles = useStyles();
  
  return (
    <div>
      <h1 className={styles.text.primary}>見出し・重要なテキスト</h1>
      <p className={styles.text.secondary}>本文テキスト</p>
      <span className={styles.text.tertiary}>補助テキスト・説明文</span>
      <small className={styles.text.muted}>非活性・ヒント文字</small>
      
      {/* 特殊用途 */}
      <p className={styles.text.brand}>ブランドカラー</p>
      <p className={styles.text.success}>成功状態</p>
      <p className={styles.text.warning}>警告状態</p>
      <p className={styles.text.error}>エラー状態</p>
    </div>
  );
}
```

## フォント色階層

### 基本階層

| 階層 | クラス | 用途 | ライトモード | ダークモード |
|------|-------|------|--------------|--------------|
| Primary | `styles.text.primary` | 見出し、重要なテキスト | `#1f2937` | `#f9fafb` |
| Secondary | `styles.text.secondary` | 本文テキスト | `#374151` | `#e5e7eb` |
| Tertiary | `styles.text.tertiary` | 補助テキスト、説明文 | `#6b7280` | `#d1d5db` |
| Muted | `styles.text.muted` | 非活性、ヒント文字 | `#9ca3af` | `#9ca3af` |

### 特殊用途

| 用途 | クラス | ライトモード | ダークモード |
|------|-------|--------------|--------------|
| Brand | `styles.text.brand` | `#4f46e5` | `#8b5cf6` |
| Success | `styles.text.success` | `#059669` | `#34d399` |
| Warning | `styles.text.warning` | `#d97706` | `#fbbf24` |
| Error | `styles.text.error` | `#dc2626` | `#f87171` |

## アクセシビリティ

全ての色はWCAG 2.1 AA基準のコントラスト比(4.5:1以上)を満たしています。

## 移行ガイド

### 既存コンポーネントの移行

#### Before (移行前)
```tsx
<h1 className="text-gray-800 dark:text-neutral-200">タイトル</h1>
<p className="text-gray-500 dark:text-neutral-400">説明文</p>
```

#### After (移行後)  
```tsx
const styles = useStyles();
<h1 className={styles.text.primary}>タイトル</h1>
<p className={styles.text.tertiary}>説明文</p>
```

## 禁止事項

❌ **避けるべき実装**

```tsx
// ハードコーディングされた色の直接指定
<p className="text-gray-800 dark:text-neutral-200">

// 条件分岐によるテーマ判定
<p className={theme === "dark" ? "text-white" : "text-black"}>
```

✅ **推奨実装**

```tsx
const styles = useStyles();
<p className={styles.text.primary}>
```

## テーマ切り替えテスト

### Storybookでの確認
1. `npm run storybook`
2. ツールバーのテーマ切り替えボタンでLight ↔ Dark確認

### 開発サーバーでの確認  
1. `npm run dev`
2. ヘッダーのテーマ切り替えボタンで確認
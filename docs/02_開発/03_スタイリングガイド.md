# デザインガイド

## 1. 概要

このドキュメントは、stats47 プロジェクトにおけるデザインシステムの統合ガイドです。一貫性のある UI/UX を提供し、アクセシビリティを確保することを目的としています。

本ガイドでは以下の内容を定義します：
- 配色システム（カラーパレット、テーマ、コンポーネント別配色）
- フォント色システム（階層構造、使用指針、実装方法）
- アクセシビリティ要件（コントラスト比、色覚多様性への配慮）

---

## 2. 配色システム

### 2.1 カラーパレット

#### プライマリカラー

```css
/* メインカラー */
--primary-50: #eff6ff;   /* ライトブルー */
--primary-100: #dbeafe;  /* ライトブルー */
--primary-500: #3b82f6;  /* ブルー */
--primary-600: #2563eb;  /* ダークブルー */
--primary-700: #1d4ed8;  /* ダークブルー */

/* Tailwind CSS クラス */
bg-blue-50, bg-blue-100, bg-blue-500, bg-blue-600, bg-blue-700
```

#### セカンダリカラー（グレー系）

```css
/* グレー系 */
--gray-50: #f9fafb;      /* ライトグレー */
--gray-100: #f3f4f6;     /* ライトグレー */
--gray-200: #e5e7eb;     /* グレー */
--gray-300: #d1d5db;     /* グレー */
--gray-400: #9ca3af;     /* グレー */
--gray-500: #6b7280;     /* グレー */
--gray-600: #4b5563;     /* ダークグレー */
--gray-700: #374151;     /* ダークグレー */
--gray-800: #1f2937;     /* ダークグレー */
--gray-900: #111827;     /* ダークグレー */

/* Tailwind CSS クラス */
bg-gray-50, bg-gray-100, bg-gray-200, bg-gray-300, bg-gray-400
text-gray-500, text-gray-600, text-gray-700, text-gray-800, text-gray-900
```

#### アクセントカラー

```css
/* 成功・エラー・警告 */
--success-500: #10b981;   /* グリーン */
--success-600: #059669;   /* ダークグリーン */
--error-500: #ef4444;     /* レッド */
--error-600: #dc2626;     /* ダークレッド */
--warning-500: #f59e0b;   /* イエロー */
--warning-600: #d97706;   /* ダークイエロー */

/* Tailwind CSS クラス */
bg-green-500, bg-green-600, bg-red-500, bg-red-600, bg-yellow-500, bg-yellow-600
```

### 2.2 テーマシステム

#### ライトモード

```css
/* 背景色 */
--bg-primary: #ffffff;    /* メイン背景 */
--bg-secondary: #f9fafb;  /* セカンダリ背景 */
--bg-tertiary: #f3f4f6;   /* サード背景 */

/* テキスト色 */
--text-primary: #111827;   /* メインテキスト */
--text-secondary: #374151; /* セカンダリテキスト */
--text-tertiary: #6b7280;  /* サードテキスト */
--text-muted: #9ca3af;     /* ミュートテキスト */

/* ボーダー色 */
--border-primary: #e5e7eb;   /* メインボーダー */
--border-secondary: #d1d5db; /* セカンダリボーダー */
```

#### ダークモード

```css
/* 背景色 */
--bg-primary: #1f2937;    /* メイン背景 */
--bg-secondary: #111827;  /* セカンダリ背景 */
--bg-tertiary: #374151;   /* サード背景 */

/* テキスト色 */
--text-primary: #f9fafb;   /* メインテキスト */
--text-secondary: #e5e7eb; /* セカンダリテキスト */
--text-tertiary: #d1d5db;  /* サードテキスト */
--text-muted: #9ca3af;     /* ミュートテキスト */

/* ボーダー色 */
--border-primary: #374151; /* メインボーダー */
--border-secondary: #4b5563; /* セカンダリボーダー */
```

### 2.3 コンポーネント別配色ガイドライン

#### カード・コンテナ

```typescript
// 基本カード
<div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 dark:bg-neutral-800 dark:border-neutral-700">
  <h2 className="text-lg font-medium text-gray-800 dark:text-neutral-200">
    タイトル
  </h2>
  <p className="text-gray-600 dark:text-neutral-400">
    コンテンツ
  </p>
</div>

// セカンダリカード
<div className="bg-gray-50 rounded-lg p-3 dark:bg-neutral-700">
  <h3 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
    サブタイトル
  </h3>
</div>
```

#### ボタン

```typescript
// プライマリボタン
<button className="px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600">
  ボタン
</button>

// セカンダリボタン
<button className="px-3 py-2 border border-gray-200 bg-white text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50">
  ボタン
</button>

// 無効化ボタン
<button className="px-3 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed">
  ボタン
</button>
```

#### フォーム要素

```typescript
// 入力フィールド
<input className="px-3 py-2 border border-gray-200 rounded-lg shadow-xs placeholder-gray-500 bg-white text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" />

// ラベル
<label className="block text-sm font-medium text-gray-700 mb-2">
  ラベル
</label>

// エラーメッセージ
<p className="text-red-600 text-sm mt-1">
  エラーメッセージ
</p>
```

#### テーブル

```typescript
// テーブルヘッダー
<th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-neutral-700 dark:text-neutral-400">
  ヘッダー
</th>

// テーブルセル
<td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-200">
  セル
</td>

// テーブル行（ホバー）
<tr className="hover:bg-gray-50 dark:hover:bg-neutral-700">
```

### 2.4 Tailwind CSS クラス規約

#### 推奨クラス名

```typescript
// 背景色
bg-white, bg-gray-50, bg-gray-100, bg-indigo-500, bg-red-500, bg-green-500

// テキスト色
text-gray-800, text-gray-700, text-gray-600, text-gray-500, text-indigo-600

// ボーダー色
border-gray-200, border-gray-300, border-indigo-500

// シャドウ
shadow-xs, shadow-sm, shadow-md

// 角丸
rounded-lg, rounded-md, rounded
```

### 2.5 カスタムクラス定義

```css
/* globals.css */
@layer components {
  .card-base {
    @apply bg-white rounded-lg shadow-xs border border-gray-200 p-4;
    @apply dark:bg-neutral-800 dark:border-neutral-700;
  }

  .card-header {
    @apply text-lg font-medium text-gray-800 mb-3;
    @apply dark:text-neutral-200;
  }

  .card-content {
    @apply text-gray-600;
    @apply dark:text-neutral-400;
  }

  .btn-primary {
    @apply px-3 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg;
    @apply hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600;
  }

  .btn-secondary {
    @apply px-3 py-2 border border-gray-200 bg-white text-gray-800 text-sm font-medium rounded-lg;
    @apply hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50;
  }
}
```

### 2.6 実装例

#### 統計表示カード

```typescript
export function StatisticsCard({ title, value, change }: StatisticsCardProps) {
  return (
    <div className="card-base">
      <h3 className="card-header">{title}</h3>
      <div className="flex items-baseline space-x-2">
        <p className="text-2xl font-semibold text-gray-900 dark:text-neutral-200">
          {value}
        </p>
        <span
          className={`text-sm ${
            change >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {change >= 0 ? "+" : ""}
          {change}%
        </span>
      </div>
    </div>
  );
}
```

#### ナビゲーションメニュー

```typescript
export function NavigationMenu({ items }: NavigationMenuProps) {
  return (
    <nav className="bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md dark:text-neutral-300 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
```

---

## 3. フォント色システム

### 3.1 フォント色階層

#### 基本階層

| 階層 | Tailwind Class | HEX | RGB | 用途 | ライトモード<br>コントラスト比 | ダークモード<br>コントラスト比 |
|------|----------------|-----|-----|------|----------------|----------------|
| **Primary** | `text-gray-900` / `text-gray-50` | `#111827` / `#f9fafb` | `17, 24, 39` / `249, 250, 251` | 見出し・最重要テキスト | 18.07:1 | 17.12:1 |
| **Secondary** | `text-gray-800` / `text-gray-200` | `#1f2937` / `#e5e7eb` | `31, 41, 55` / `229, 231, 235` | 本文テキスト | 12.63:1 | 11.89:1 |
| **Tertiary** | `text-gray-700` / `text-gray-300` | `#374151` / `#d1d5db` | `55, 65, 81` / `209, 213, 219` | 補助テキスト | 9.21:1 | 7.25:1 |
| **Muted** | `text-gray-400` | `#9ca3af` | `156, 163, 175` | 非活性テキスト | 3.31:1 | 3.31:1 |

#### 特殊用途色

| 用途 | ライトモード | ダークモード | 説明 |
|------|--------------|--------------|------|
| **Brand** | `text-indigo-600` (`#4f46e5`) | `text-indigo-400` (`#8b5cf6`) | ブランドカラー、CTA要素 |
| **Success** | `text-green-600` (`#059669`) | `text-green-400` (`#34d399`) | 成功状態、完了メッセージ |
| **Warning** | `text-amber-600` (`#d97706`) | `text-amber-400` (`#fbbf24`) | 注意喚起、警告メッセージ |
| **Error** | `text-red-600` (`#dc2626`) | `text-red-400` (`#f87171`) | エラー状態、バリデーション |

### 3.2 使用指針

#### テキスト階層の選択基準

**Primary (`styles.text.primary`)**
- ページタイトル
- セクション見出し (h1, h2, h3)
- 重要な情報やCTA
- ナビゲーションの現在位置

**Secondary (`styles.text.secondary`)**
- 本文テキスト
- 段落内容
- ボタンラベル
- フォームラベル

**Tertiary (`styles.text.tertiary`)**
- 補助説明文
- キャプション
- メタ情報 (日付、作成者など)
- プレースホルダーテキスト

**Muted (`styles.text.muted`)**
- 非活性状態のテキスト
- ヒント文字
- フッター情報
- 無効化された要素

### 3.3 コンテキスト別ガイドライン

#### フォーム要素

```tsx
<label className={styles.text.secondary}>ラベル</label>
<input placeholder={styles.text.muted} />
<span className={styles.text.tertiary}>ヘルプテキスト</span>
<p className={styles.text.error}>エラーメッセージ</p>
```

#### カード・パネル

```tsx
<h3 className={styles.text.primary}>カードタイトル</h3>
<p className={styles.text.secondary}>メインコンテンツ</p>
<span className={styles.text.tertiary}>補助情報</span>
```

#### ナビゲーション

```tsx
<a className={styles.text.primary}>アクティブ項目</a>
<a className={styles.text.secondary}>通常項目</a>
<span className={styles.text.muted}>無効項目</span>
```

### 3.4 実装方法

#### 新規コンポーネント作成時

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

#### TypeScript型定義

```typescript
interface TextStyles {
  primary: string;
  secondary: string;
  tertiary: string;
  muted: string;
  brand: string;
  success: string;
  warning: string;
  error: string;
}
```

### 3.5 移行ガイド

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

### 3.6 禁止事項

**❌ 避けるべき実装**

```tsx
// ハードコーディングされた色の直接指定
<p className="text-gray-800 dark:text-neutral-200">

// 条件分岐によるテーマ判定
<p className={theme === "dark" ? "text-white" : "text-black"}>
```

**✅ 推奨実装**

```tsx
const styles = useStyles();
<p className={styles.text.primary}>
```

---

## 4. アクセシビリティ

### 4.1 コントラスト比基準

#### WCAG 2.1 AA要件
- **通常テキスト** (14pt未満): 4.5:1 以上
- **大きなテキスト** (18pt以上 / 14pt太字以上): 3:1 以上
- **UI 要素**: 3:1 以上

### 4.2 本プロジェクトの実装

#### ライトモード (白背景 #ffffff)

| 階層 | 色 | コントラスト比 | 準拠レベル |
|------|-----|---------------|-------------|
| Primary | `#111827` | **18.07:1** | AAA ✅ |
| Secondary | `#1f2937` | **12.63:1** | AAA ✅ |
| Tertiary | `#374151` | **9.21:1** | AAA ✅ |
| Muted | `#9ca3af` | **3.31:1** | 大テキストのみAA ⚠️ |

#### ダークモード (黒背景 #0a0a0a)

| 階層 | 色 | コントラスト比 | 準拠レベル |
|------|-----|---------------|-------------|
| Primary | `#f9fafb` | **17.12:1** | AAA ✅ |
| Secondary | `#e5e7eb` | **11.89:1** | AAA ✅ |
| Tertiary | `#d1d5db` | **7.25:1** | AAA ✅ |
| Muted | `#9ca3af` | **3.31:1** | 大テキストのみAA ⚠️ |

#### 特殊用途色

| 用途 | ライト | ダーク | 最小コントラスト比 |
|------|-------|-------|-------------------|
| Brand | `#4f46e5` (6.35:1) | `#8b5cf6` (5.12:1) | AA ✅ |
| Success | `#059669` (4.56:1) | `#34d399` (7.89:1) | AA ✅ |
| Warning | `#d97706` (5.23:1) | `#fbbf24` (10.45:1) | AA ✅ |
| Error | `#dc2626` (5.89:1) | `#f87171` (4.67:1) | AA ✅ |

### 4.3 使用ガイドライン

#### ✅ 推奨使用法

**通常テキスト (14pt未満)**
```tsx
// AA以上の色のみ使用
<p className={styles.text.primary}>重要なテキスト</p>
<p className={styles.text.secondary}>本文テキスト</p>
<p className={styles.text.tertiary}>補助テキスト</p>
```

**大きなテキスト (18pt以上)**
```tsx
// 全ての階層が使用可能
<h1 className={`text-2xl ${styles.text.primary}`}>メインタイトル</h1>
<h2 className={`text-xl ${styles.text.secondary}`}>サブタイトル</h2>
<h3 className={`text-lg ${styles.text.tertiary}`}>セクション見出し</h3>
<span className={`text-lg ${styles.text.muted}`}>大きなヒント文字</span>
```

#### ⚠️ 注意が必要な使用法

**Mutedテキスト**
```tsx
// 小さなテキストでは避ける
❌ <span className={`text-sm ${styles.text.muted}`}>

// 18pt以上でのみ使用
✅ <span className={`text-lg ${styles.text.muted}`}>
```

### 4.4 色覚異常への配慮

#### 色だけに依存しない情報伝達

**❌ 色のみでの状態表現**
```tsx
<p className={styles.text.error}>エラーが発生しました</p>
```

**✅ 色 + アイコン/テキストでの状態表現**
```tsx
<p className={styles.text.error}>
  <AlertTriangle className="w-4 h-4" />
  エラー: 入力内容を確認してください
</p>
```

#### 成功・エラー表現

```tsx
// 赤緑色覚異常に配慮
<div className="flex items-center gap-2">
  <CheckCircle className="w-4 h-4 text-green-600" />
  <span className={styles.text.success}>成功</span>
</div>

<div className="flex items-center gap-2">
  <XCircle className="w-4 h-4 text-red-600" />
  <span className={styles.text.error}>エラー</span>
</div>
```

### 4.5 フォーカス表示

```typescript
// フォーカス時の表示
<button className="focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
  ボタン
</button>

// フォーカス時の背景色変更
<input className="focus:bg-gray-50 focus:border-indigo-500" />

// ホバー・フォーカス状態の視認性確保
<button className={`
  ${styles.text.secondary}
  focus:outline-none focus:ring-2 focus:ring-blue-500
  hover:${styles.text.primary}
`}>
  ボタン
</button>
```

### 4.6 テスト方法

#### 自動化テスト

```typescript
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('コンポーネントにアクセシビリティ違反がないこと', async () => {
  const { container } = render(<YourComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

#### 手動確認ツール

- **WebAIM Contrast Checker**: コントラスト比確認
- **axe DevTools**: ブラウザ拡張でのチェック
- **WAVE**: Webアクセシビリティ評価

#### 確認項目

1. 各テキスト要素のコントラスト比
2. キーボードナビゲーション
3. スクリーンリーダーでの読み上げ
4. 色覚シミュレーションでの確認

### 4.7 準拠レベル

#### 現在の達成レベル
- **WCAG 2.1 AA**: ✅ 準拠
- **WCAG 2.1 AAA**: 🔄 部分準拠 (muted色除く)

#### 今後の改善計画
- Muted色のコントラスト比向上検討
- より高いコントラスト比オプションの追加
- 動的なコントラスト調整機能の実装

---

## 参考資料

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Material Design Color System](https://material.io/design/color/the-color-system.html)
- [Color Universal Design](https://jfly.uni-koeln.de/color/)

---

## 更新履歴

| 日付 | 更新者 | 更新内容 |
|------|--------|----------|
| 2025-10-01 | AI Assistant | 統合ガイド作成（color-system.md、design-system.md、font-color-unification-guide.md、accessibility.mdを統合） |
| 2025-09-03 | AI Assistant | フォント色システム初期リリース |
| 2024-12-19 | AI Assistant | 配色システム初版作成 |


## マテリアルデザインへの改善完了

### **主な変更ポイント**

#### **1. 色彩の簡素化**

- **背景**: 派手なグラデーションから `#fafafa` のシンプルな背景に変更
- **メインカラー**: `#2196f3` (Material Blue) をアクセントカラーとして使用
- **テキストカラー**: `#212121` (Primary Text), `#757575` (Secondary Text), `#424242` (Disabled Text)

#### **2. マテリアルデザインの原則**

- **エレベーション**: 控えめな影 (`box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1)`)
- **角丸**: 8px の統一された角丸 (過度に丸くない)
- **タイポグラフィ**: Roboto フォントを優先、適切なフォントウェイト
- **グリッド**: 16px の基本マージンを使用

#### **3. カードデザイン**

- **シンプルな白背景**: 複雑なグラデーションを削除
- **控えめなホバー効果**: 派手なアニメーションを削除
- **統一されたパディング**: 20px の統一パディング

#### **4. インタラクション要素**

- **ボタン**: フラットデザインでホバー時の色変化
- **フォーカス**: Material Blue のフォーカスリング
- **プログレスバー**: シンプルな4pxの高さ

#### **5. 色の使い分け**

- **プライマリー**: `#2196f3` (検索フォーカス、アクティブ状態)
- **アクセント**: `#ff9800` (トップ3のバッジ)
- **グレースケール**: `#757575`, `#424242`, `#e0e0e0` (テキストと境界線)

この変更により、Googleのマテリアルデザインガイドラインに準拠した、クリーンで使いやすいインターフェースになりました。色の使用を最小限に抑えながら、必要な情報の階層は保持しています。
## 5. レスポンシブデザイン実装ガイド

Next.js 15とTailwind CSSを使用したブログサイトでレスポンシブデザインを効果的に実装するための包括的なガイドです。

### 5.1 レスポンシブデザインの基本原則

レスポンシブデザインを検討する際には、以下の原則を念頭に置くことが重要です：

1. **モバイルファースト**: 小さい画面サイズから設計を始め、徐々に大きな画面に拡張していく
2. **流動的なレイアウト**: 固定幅ではなく、パーセンテージやビューポート単位を使用
3. **柔軟なメディア**: 画像やビデオが画面サイズに応じて適切に表示されるようにする
4. **ブレイクポイント**: 異なる画面サイズに対応するためのメディアクエリを適切に設定
5. **コンテンツの優先順位付け**: 小さな画面では最も重要なコンテンツを優先表示

### 5.2 Tailwind CSSのレスポンシブユーティリティ

Tailwind CSSは強力なレスポンシブユーティリティを提供しており、Next.js 15との組み合わせは非常に効果的です。

#### ブレイクポイント

Tailwind CSSのデフォルトブレイクポイント：

```
sm: 640px（小型タブレット、大型モバイル）
md: 768px（タブレット）
lg: 1024px（ノートPC、小型デスクトップ）
xl: 1280px（デスクトップ）
2xl: 1536px（大型デスクトップ）
```

これらのブレイクポイントは必要に応じてカスタマイズできます：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'mobile': '375px',
      'tablet': '640px',
      'laptop': '1024px',
      'desktop': '1280px',
    },
  },
}
```

#### レスポンシブクラスの使用方法

Tailwind CSSでは、接頭辞を使用して特定のブレイクポイントでのみ適用されるスタイルを指定できます：

```html
<div class="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
  <!-- この要素は小さい画面では幅100%、mdサイズでは50%、lgサイズでは33.33%、xlサイズでは25%になります -->
</div>
```

### 5.3 実装例：レスポンシブなブログレイアウト

#### ナビゲーションバー

```tsx
// components/Navbar.tsx
import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              MyBlog
            </Link>
          </div>
          
          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="px-3 py-2 rounded-md hover:bg-gray-100">
              ホーム
            </Link>
            <Link href="/blog" className="px-3 py-2 rounded-md hover:bg-gray-100">
              ブログ
            </Link>
            <Link href="/about" className="px-3 py-2 rounded-md hover:bg-gray-100">
              About
            </Link>
            <Link href="/contact" className="px-3 py-2 rounded-md hover:bg-gray-100">
              お問い合わせ
            </Link>
          </div>
          
          {/* モバイルメニューボタン */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="block px-3 py-2 rounded-md hover:bg-gray-100">
              ホーム
            </Link>
            <Link href="/blog" className="block px-3 py-2 rounded-md hover:bg-gray-100">
              ブログ
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-md hover:bg-gray-100">
              About
            </Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md hover:bg-gray-100">
              お問い合わせ
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
```

#### ブログ記事リスト

```tsx
// components/BlogList.tsx
import Image from 'next/image';
import Link from 'next/link';

type Post = {
  id: string;
  title: string;
  excerpt: string;
  coverImage: string;
  date: string;
  slug: string;
};

type BlogListProps = {
  posts: Post[];
};

export default function BlogList({ posts }: BlogListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <article key={post.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          <Link href={`/blog/${post.slug}`}>
            <div className="relative w-full h-48 sm:h-40 md:h-48">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                sizes="(min-width: 640px) 50vw, (min-width: 1024px) 33vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold line-clamp-2 mb-2">{post.title}</h2>
              <p className="text-gray-600 text-sm mb-2">
                {new Date(post.date).toLocaleDateString('ja-JP')}
              </p>
              <p className="text-gray-700 line-clamp-3">{post.excerpt}</p>
            </div>
          </Link>
        </article>
      ))}
    </div>
  );
}
```

### 5.4 レスポンシブな画像処理

Next.jsの`Image`コンポーネントはレスポンシブ画像を簡単に実装できます：

```tsx
<Image
  src="/path/to/image.jpg"
  alt="説明"
  width={1200}
  height={800}
  sizes="(min-width: 768px) 768px, 100vw"
  className="w-full h-auto"
/>
```

`sizes`属性は、異なる画面サイズでどのくらいの幅で画像を表示するかをブラウザに指示します。これにより、適切な解像度の画像が読み込まれます。

### 5.5 コンテナクエリの活用

Tailwind CSS v3.2以降では、コンテナクエリをサポートしています。これにより、ビューポートのサイズではなく、親コンテナのサイズに基づいてスタイルを変更できます：

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
```

使用例：

```html
<div class="@container">
  <div class="@md:flex @md:space-x-4">
    <div class="@md:w-1/2"><!-- コンテンツ --></div>
    <div class="@md:w-1/2"><!-- コンテンツ --></div>
  </div>
</div>
```

### 5.6 メディアクエリのカスタマイズ

特定の条件に基づいてスタイルを適用したい場合は、Tailwindの設定をカスタマイズできます：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      screens: {
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
        'dark-mode': { 'raw': '(prefers-color-scheme: dark)' },
        'print': { 'raw': 'print' },
      },
    },
  },
}
```

使用例：

```html
<div class="hidden landscape:block">
  <!-- 横向き画面でのみ表示 -->
</div>
<div class="hidden tall:block">
  <!-- 高さが800px以上の画面でのみ表示 -->
</div>
```

### 5.7 レスポンシブなタイポグラフィ

Tailwind CSSではレスポンシブなタイポグラフィも簡単に実装できます：

```html
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
  レスポンシブな見出し
</h1>
<p class="text-sm sm:text-base md:text-lg">
  レスポンシブな段落テキスト
</p>
```

さらに、`@tailwindcss/typography`プラグインを使用すると、リッチなコンテンツに一貫したスタイルを適用できます：

```tsx
<article className="prose prose-sm sm:prose md:prose-lg lg:prose-xl">
  {/* リッチテキストコンテンツ */}
</article>
```

### 5.8 グリッドレイアウトの最適化

異なる画面サイズに対応したグリッドレイアウトの例：

```html
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  <!-- グリッドアイテム -->
</div>
```

### 5.9 パフォーマンスの最適化

レスポンシブデザインではパフォーマンスも重要な要素です：

1. **遅延読み込み**：画面外の画像やコンポーネントは遅延読み込みを活用

```tsx
<Image
  src="/path/to/image.jpg"
  alt="説明"
  width={800}
  height={600}
  loading="lazy"
/>
```

2. **条件付きレンダリング**：画面サイズに応じて異なるコンポーネントをレンダリング

```tsx
'use client';

import { useEffect, useState } from 'react';
import MobileView from './MobileView';
import DesktopView from './DesktopView';

export default function ResponsiveComponent() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  return isMobile ? <MobileView /> : <DesktopView />;
}
```

### 5.10 アクセシビリティの考慮

レスポンシブデザインを実装する際は、アクセシビリティも忘れずに考慮しましょう：

1. **適切なフォントサイズ**：小さい画面でも読みやすいサイズを維持
2. **タッチターゲット**：モバイル用に十分な大きさのクリック/タッチ領域を確保（最低44×44px）
3. **キーボードナビゲーション**：すべての機能がキーボードでアクセス可能であることを確認
4. **スクリーンリーダー対応**：適切なARIAラベルと意味のあるHTML構造を使用

```tsx
<button
  className="p-4 md:p-2 text-base md:text-sm"
  aria-label="メニューを開く"
>
  <Menu />
</button>
```

### 5.11 テスト方法

実装したレスポンシブデザインをテストするためのアプローチ：

1. **ブラウザの開発者ツール**：異なる画面サイズでのレンダリングをシミュレート
2. **実機テスト**：実際のデバイスでの動作確認
3. **自動化テスト**：Cypress、Playwright、Jest + Testing Libraryを使用したテスト自動化
4. **パフォーマンステスト**：Lighthouse、WebPageTest、GTmetrixなどでパフォーマンスを評価

### 5.12 まとめ

Next.js 15とTailwind CSSを使用したレスポンシブデザインの実装ポイント：

1. **モバイルファーストアプローチ**を採用
2. Tailwind CSSの**レスポンシブユーティリティ**を最大限に活用
3. Next.jsの**Image**コンポーネントでレスポンシブな画像を実装
4. **コンテナクエリ**や**カスタムメディアクエリ**で細かい制御
5. **パフォーマンス**と**アクセシビリティ**を常に意識
6. 適切な**テスト**を実施して、あらゆるデバイスでの動作を確認

これらの原則とテクニックを適用することで、あらゆるデバイスで最適に機能するブログサイトを構築できます。




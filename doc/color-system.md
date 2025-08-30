# 配色システム設計書

## 概要

このドキュメントでは、stats47 プロジェクトで使用する配色システムについて定義します。一貫性のある UI/UX を提供し、アクセシビリティを確保することを目的としています。

## カラーパレット

### プライマリカラー

```css
/* メインカラー */
--primary-50: #eff6ff;   /* ライトブルー */
--primary-100: #dbeafe;   /* ライトブルー */
--primary-500: #3b82f6;   /* ブルー */
--primary-600: #2563eb;   /* ダークブルー */
--primary-700: #1d4ed8;   /* ダークブルー */

/* Tailwind CSS クラス */
bg-blue-50, bg-blue-100, bg-blue-500, bg-blue-600, bg-blue-700
```

### セカンダリカラー

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

### アクセントカラー

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

## テーマシステム

### ライトモード

```css
/* 背景色 */
--bg-primary: #ffffff; /* メイン背景 */
--bg-secondary: #f9fafb; /* セカンダリ背景 */
--bg-tertiary: #f3f4f6; /* サード背景 */

/* テキスト色 */
--text-primary: #111827; /* メインテキスト */
--text-secondary: #374151; /* セカンダリテキスト */
--text-tertiary: #6b7280; /* サードテキスト */
--text-muted: #9ca3af; /* ミュートテキスト */

/* ボーダー色 */
--border-primary: #e5e7eb; /* メインボーダー */
--border-secondary: #d1d5db; /* セカンダリボーダー */
```

### ダークモード

```css
/* 背景色 */
--bg-primary: #1f2937; /* メイン背景 */
--bg-secondary: #111827; /* セカンダリ背景 */
--bg-tertiary: #374151; /* サード背景 */

/* テキスト色 */
--text-primary: #f9fafb; /* メインテキスト */
--text-secondary: #e5e7eb; /* セカンダリテキスト */
--text-tertiary: #d1d5db; /* サードテキスト */
--text-muted: #9ca3af; /* ミュートテキスト */

/* ボーダー色 */
--border-primary: #374151; /* メインボーダー */
--border-secondary: #4b5563; /* セカンダリボーダー */
```

## コンポーネント別配色ガイドライン

### カード・コンテナ

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

### ボタン

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

### フォーム要素

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

### テーブル

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

## Tailwind CSS クラス規約

### 推奨クラス名

```typescript
// 背景色
bg - white,
  bg - gray - 50,
  bg - gray - 100,
  bg - indigo - 500,
  bg - red - 500,
  bg - green - 500;

// テキスト色
text - gray - 800,
  text - gray - 700,
  text - gray - 600,
  text - gray - 500,
  text - indigo - 600;

// ボーダー色
border - gray - 200, border - gray - 300, border - indigo - 500;

// シャドウ
shadow - xs, shadow - sm, shadow - md;

// 角丸
rounded - lg, rounded - md, rounded;
```

### 禁止クラス名

```typescript
// 非推奨（色の指定が曖昧）
bg - black, bg - white, text - black, text - white;

// 非推奨（サイズの指定が曖昧）
w - full, h - full, p - 4, m - 4;

// 推奨（明示的な指定）
bg - gray - 900, bg - white, text - gray - 900, text - white;
w - full, h - full, p - 4, m - 4;
```

### カスタムクラス定義

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

## アクセシビリティ

### コントラスト比

- **通常テキスト**: 4.5:1 以上
- **大きなテキスト**: 3:1 以上
- **UI 要素**: 3:1 以上

### 色覚異常への配慮

- 色だけでなく、アイコンやテキストでも情報を表現
- 十分なコントラスト比を確保
- ダークモードでの視認性を考慮

### フォーカス表示

```typescript
// フォーカス時の表示
<button className="focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
  ボタン
</button>

// フォーカス時の背景色変更
<input className="focus:bg-gray-50 focus:border-indigo-500" />
```

## 実装例

### 統計表示カード

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

### ナビゲーションメニュー

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

## 更新履歴

| 日付       | 更新者       | 更新内容 |
| ---------- | ------------ | -------- |
| 2024-12-19 | AI Assistant | 初版作成 |

## 参考資料

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Color System](https://material.io/design/color/the-color-system.html)

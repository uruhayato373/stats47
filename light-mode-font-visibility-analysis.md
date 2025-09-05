# ライトモードフォント視認性問題の全体分析

## 問題の概要
プロジェクト全体において、ライトモードでのフォント色が薄すぎて視認性に問題がある。特に`text-gray-500`や`text-gray-400`を使用している箇所で顕著に現れている。

## 根本原因の分析

### 1. useStylesフックの色定義問題
**ファイル**: `src/hooks/useStyles.ts:74-75`

```typescript
// 問題のある色定義
tertiary: "text-gray-500 dark:text-gray-300", // 補助テキスト、説明文
muted: "text-gray-400 dark:text-gray-400", // 非活性、ヒント文字
```

**問題点**:
- `text-gray-500` (RGB: #6b7280) - ライトモード背景(#ffffff)に対してコントラスト比不足
- `text-gray-400` (RGB: #9ca3af) - さらにコントラスト比が低い

### 2. 直接的なTailwindクラス使用
以下のファイルで`text-gray-500`や`text-gray-400`を直接使用:
- `src/components/dashboard/MetricsCard.tsx:40`
- `src/components/dashboard/TopAuthors.tsx:36,53,58`
- `src/components/layout/Header.tsx:27,60,135`
- `src/app/choropleth/page.tsx` (複数箇所)
- `src/components/estat/EstatMetadataDisplay.tsx` (複数箇所)

### 3. グローバルCSS設定の複雑化
**ファイル**: `src/app/globals.css`

**問題点**:
- 過度に詳細なCSS上書き(line 107-138)
- `!important`の濫用により予期しない副作用
- useStylesシステムとの不整合

## WCAG 2.1 コントラスト比分析

### 現在の色とコントラスト比
| 色 | Hex | 白背景でのコントラスト比 | WCAG AA準拠 |
|---|---|---|---|
| `text-gray-500` | #6b7280 | 4.54:1 | ✅ (最低限) |
| `text-gray-400` | #9ca3af | 2.83:1 | ❌ |
| `text-gray-700` | #374151 | 8.87:1 | ✅ (推奨) |
| `text-gray-800` | #1f2937 | 12.59:1 | ✅ (優秀) |

## 改善戦略

### 🎯 短期的解決策 (即座に実装可能)

#### 1. useStylesフックの色定義修正
```typescript
// 修正版
text: {
  primary: "text-gray-800 dark:text-gray-50",
  secondary: "text-gray-700 dark:text-gray-200", 
  tertiary: "text-gray-600 dark:text-gray-300", // gray-500 → gray-600
  muted: "text-gray-500 dark:text-gray-400",     // gray-400 → gray-500
  // ...
}
```

#### 2. 直接的なTailwindクラスの置換
```typescript
// Before
<span className="text-gray-500 dark:text-neutral-400">

// After  
<span className={styles.text.tertiary}>
```

### 🚀 中期的解決策 (リファクタリング)

#### 1. グローバルCSS簡素化
- `globals.css`の`!important`ルールを最小限に削減
- useStylesシステムとの一貫性確保
- 不要な色上書きルールの削除

#### 2. コンポーネント統一パターン
```typescript
// 統一されたスタイルパターン
const ComponentStyles = {
  title: styles.text.primary,
  content: styles.text.secondary, 
  caption: styles.text.tertiary,
  disabled: styles.text.muted,
}
```

### 🎨 長期的解決策 (設計改善)

#### 1. デザイントークン導入
```typescript
// デザイントークンシステム
const designTokens = {
  colors: {
    text: {
      primary: { light: '#1f2937', dark: '#f9fafb' },
      secondary: { light: '#374151', dark: '#e5e7eb' },
      tertiary: { light: '#4b5563', dark: '#d1d5db' }, // 改善された値
      disabled: { light: '#6b7280', dark: '#9ca3af' },
    }
  }
}
```

#### 2. アクセシビリティ検証システム
- ESLintプラグインでコントラスト比チェック
- Storybookでのアクセシビリティテスト
- CI/CDパイプラインでの自動検証

## 影響範囲と優先度

### 🔴 高優先度 (視認性に深刻な影響)
1. **useStyles.ts** - `tertiary`と`muted`の色定義修正
2. **Dashboard関連コンポーネント** - MetricsCard, TopAuthors, TopPosts
3. **Header** - ナビゲーション要素

### 🟡 中優先度 (部分的な影響)
1. **Choroplethページ** - 説明テキスト
2. **ESTATコンポーネント** - メタデータ表示
3. **DataTable** - ヘッダーテキスト

### 🟢 低優先度 (軽微な影響)
1. **グローバルCSS** - 冗長なルール整理
2. **Tailwind設定** - カスタムカラー定義

## 実装ロードマップ

### Phase 1: 緊急修正 (1日)
- [ ] useStyles.tsの色定義修正
- [ ] Dashboard系コンポーネントの修正
- [ ] Header.tsxの修正

### Phase 2: 系統的修正 (3日)  
- [ ] 残りの直接Tailwindクラス使用箇所の修正
- [ ] DataTableとInputFieldの修正
- [ ] ESTATコンポーネント群の修正

### Phase 3: 構造改善 (1週間)
- [ ] グローバルCSS簡素化
- [ ] デザイントークンシステム検討
- [ ] アクセシビリティ検証環境構築

## 検証方法

### 自動検証
```bash
# コントラスト比チェック用ツール
npm install @axe-core/cli -D
npx axe http://localhost:3000 --tags wcag21aa
```

### 手動検証
1. Chrome DevToolsのLighthouseでアクセシビリティスコア確認
2. macOS VoiceOverでの読み上げテスト  
3. 異なる解像度・デバイスでの視認性確認

## 結論
現在のライトモード視認性問題は、主に`text-gray-500`と`text-gray-400`の過用が原因。useStylesシステムの色定義を修正し、直接的なTailwindクラス使用を段階的にリファクタリングすることで、WCAG AA基準に準拠したアクセシブルなUIを実現可能。
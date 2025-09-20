# useStylesシステム根本原因調査レポート

## 問題概要

プロジェクト全体でライトモードにおいてフォント色が薄いグレーで表示され、可読性が著しく低下している問題が発生している。`useStyles`システムで統一管理しているにも関わらず、複数のコンポーネントで独立した修正が必要になっている状況。

## 調査結果

### 1. useStylesシステムの現状

#### 現在の色階層定義 (`src/hooks/useStyles.ts:72-85`)

```typescript
text: {
  // 基本テキスト階層（可読性改善版）
  primary: "text-gray-900 dark:text-gray-50", // 見出し、最重要テキスト
  secondary: "text-gray-800 dark:text-gray-200", // 本文テキスト（可読性向上）
  tertiary: "text-gray-700 dark:text-gray-300", // 補助テキスト、説明文
  muted: "text-gray-500 dark:text-gray-400", // 非活性、ヒント文字

  // 特殊用途
  brand: "text-indigo-600 dark:text-indigo-400", // ブランドカラー
  success: "text-green-600 dark:text-green-400", // 成功状態
  warning: "text-amber-600 dark:text-amber-400", // 警告状態
  error: "text-red-600 dark:text-red-400", // エラー状態

  // 後方互換性（段階的に廃止予定）
  body: "text-gray-700 dark:text-gray-200", // → secondary に移行
}
```

### 2. 根本原因の特定

#### 原因1: システム全体での混在した色管理手法

**A. useStyles使用コンポーネント (15箇所)**
- `src/components/common/DataTable/DataTable.tsx`
- `src/components/estat/metadata/SavedMetadataDisplay.tsx`
- `src/components/estat/metadata/EstatMetadataTabNavigation.tsx`
- `src/components/estat/data/EstatDataFetcher/EstatDataFetcher.tsx`
- `src/components/layout/Header.tsx`
- `src/app/page.tsx`
- その他9箇所

**B. 直接Tailwind色指定コンポーネント (50箇所以上)**
- `src/components/estat/data/EstatDataTable.tsx` - 20箇所
- `src/components/estat/metadata/MetaInfoCard.tsx` - 15箇所  
- `src/components/estat/visualization/ChoroplethMap.tsx` - 5箇所
- `src/components/estat/visualization/YearSelector.tsx` - 3箇所
- その他多数

#### 原因2: useStylesシステムの不完全な浸透

**統計**:
- useStyles使用: 約25%
- 直接Tailwind指定: 約75%

**問題となるパターン**:
```tsx
// ❌ 問題: 混在パターン
<h1 className={`text-lg ${styles.text.primary}`}>
<p className="text-gray-600">  // 直接指定で薄い色

// ❌ 問題: 古い色階層の残存
<span className={styles.text.secondary}> // まだ薄い可能性
```

#### 原因3: 色階層定義の歴史的変遷

**過去の変更履歴**:
1. 初期: `text-gray-800` → `text-gray-700` (薄くなった)
2. 第1次修正: `text-gray-700` → `text-gray-800` 
3. 第2次修正: `text-gray-800` → `text-gray-900` (現在)

多くのコンポーネントが古い定義に基づいて実装されており、システム全体の更新が追いついていない。

#### 原因4: CSS-in-JS vs Tailwind CSS の競合

**問題の具体例**:
```tsx
// useStyles内でTailwind利用
primary: "text-gray-900 dark:text-gray-50"

// しかし実際のクラス適用で問題が発生
className={`${styles.text.primary}`} // 正常
className={styles.text.primary}      // 正常
className="text-gray-600"            // 直接指定が優先される場合あり
```

### 3. 影響範囲マッピング

#### 高影響コンポーネント
1. **EstatMetadataPageHeader.tsx** - メインタイトル
2. **MetaInfoFetcher.tsx** - フォームラベル
3. **EstatDataTable.tsx** - テーブル全体
4. **MetaInfoCard.tsx** - カード内テキスト

#### 中影響コンポーネント
1. **DataTable.tsx** - テーブルヘッダー
2. **Header.tsx** - ナビゲーション
3. **EstatDataFetcher.tsx** - フォーム要素

### 4. システム設計上の問題

#### A. 一貫性の欠如
- 同じ「本文テキスト」でも`styles.text.secondary`と`text-gray-600`が混在
- コンポーネント間でのスタイル統一性なし

#### B. 保守性の低下
- 色変更時に複数箇所の手動修正が必要
- useStylesの修正効果が限定的

#### C. 開発効率の低下
- 新規開発時にどちらの手法を使うか迷う
- 既存コンポーネントのスタイル把握が困難

## 解決戦略

### 短期対応 (即座に実施)

#### 1. useStylesシステムの完全浸透
```typescript
// すべての直接Tailwind色指定を段階的にuseStylesに移行
text-gray-600  → styles.text.tertiary
text-gray-700  → styles.text.secondary  
text-gray-800  → styles.text.secondary
text-gray-900  → styles.text.primary
```

#### 2. 緊急修正対象コンポーネント
- ✅ EstatMetadataPageHeader.tsx (既に修正済み)
- ✅ MetaInfoFetcher.tsx (label修正済み)
- ✅ EstatMetadataTabNavigation.tsx (修正済み)
- 🔄 EstatDataTable.tsx (要修正)
- 🔄 MetaInfoCard.tsx (要修正)

### 中期対応 (1-2週間以内)

#### 1. 完全統一のための一括リファクタリング
```bash
# 対象ファイル
src/components/estat/data/EstatDataTable.tsx
src/components/estat/metadata/MetaInfoCard.tsx
src/components/estat/visualization/
```

#### 2. ESLintルール追加
```javascript
// 直接Tailwind色指定を禁止
"no-direct-tailwind-colors": {
  "patterns": ["text-gray-*", "text-neutral-*"],
  "message": "Use styles.text.* instead of direct Tailwind colors"
}
```

### 長期対応 (継続的改善)

#### 1. デザインシステムの強化
- useStylesの型安全性向上
- 使用可能な色の明確な定義
- コンポーネント別スタイルガイド作成

#### 2. 自動テスト導入
- Visual Regression Testing
- アクセシビリティコントラスト比の自動チェック

## 推奨実装ガイド

### ✅ 推奨パターン
```tsx
const styles = useStyles();

// 見出し・重要なテキスト
<h1 className={styles.text.primary}>

// 本文テキスト  
<p className={styles.text.secondary}>

// 補助テキスト・説明文
<span className={styles.text.tertiary}>

// 非活性・ヒント文字
<small className={styles.text.muted}>
```

### ❌ 避けるべきパターン
```tsx
// 直接Tailwind色指定
<p className="text-gray-600">

// 混在パターン
<h1 className={`text-lg ${styles.text.primary}`}>
<p className="text-gray-500">

// 古い色階層の使用
<span className={styles.text.body}> // 廃止予定
```

## まとめ

useStylesシステム自体は適切に設計されているが、プロジェクト全体への浸透が不完全なことが根本原因。特にTailwindの直接指定が75%を占めており、統一されたスタイル管理の恩恵を受けていない。

**優先順位**:
1. 🔴 **高優先**: 残りの高影響コンポーネントの修正
2. 🟡 **中優先**: 一括リファクタリングの実施  
3. 🟢 **低優先**: ESLintルール・自動テスト導入

この調査結果に基づき、系統的なリファクタリングを実施することで、可読性問題を根本的に解決できる。
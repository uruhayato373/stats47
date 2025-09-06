# ライトモードにおけるフォント色の可読性問題 - 原因調査と解決手順

## 問題概要

このプロジェクトにおいて、ライトモードでフォントが薄いグレーで表示され、可読性が著しく低下している問題が発生しています。

## 原因分析

### 1. 問題の根本原因

**`useStyles.ts`の`styles.text.secondary`定義に問題があります：**

```typescript
// 現在の定義（useStyles.ts:73行目）
secondary: "text-gray-700 dark:text-gray-200", // 本文テキスト
```

この定義では、ライトモードで`text-gray-700`（#374151）が適用されており、これが視認性の問題を引き起こしています。

### 2. 影響範囲の特定

`styles.text.secondary`が使用されている主要箇所：

1. **ナビゲーション・UI要素**
   - `src/app/page.tsx:47,68` - ボタン内のテキスト
   - `src/components/layout/Sidebar.tsx:156` - サイドバーの"Quick actions"ラベル

2. **データ表示コンポーネント**
   - `src/components/common/DataTable/DataTable.tsx:38,82` - テーブルのテキスト
   - `src/components/estat/data/EstatDataFetcher/EstatDataFetcher.tsx:122,132` - データ取得UI

3. **メタデータコンポーネント**
   - `src/components/estat/data/EstatDataDisplay/components/EstatValuesTable/EstatValuesTable.tsx:49`

## 色彩設計の問題点

### 現在の色階層（問題のある設定）

| レベル | クラス | ライトモード色 | 問題点 |
|--------|--------|----------------|---------|
| Primary | `styles.text.primary` | `text-gray-800` (#1f2937) | 適切 |
| **Secondary** | `styles.text.secondary` | **`text-gray-700` (#374151)** | **薄すぎて読みにくい** |
| Tertiary | `styles.text.tertiary` | `text-gray-600` (#4b5563) | やや薄い |
| Muted | `styles.text.muted` | `text-gray-500` (#6b7280) | 非活性用としては適切 |

## 解決手順

### 手順 1: useStyles.tsの修正

`src/hooks/useStyles.ts`の73行目を以下のように修正：

```typescript
// 修正前
secondary: "text-gray-700 dark:text-gray-200", // 本文テキスト

// 修正後
secondary: "text-gray-800 dark:text-gray-200", // 本文テキスト
```

### 手順 2: 色階層の適切な再定義

推奨する色階層設定：

```typescript
text: {
  // 基本テキスト階層（修正版）
  primary: "text-gray-900 dark:text-gray-50",   // 見出し、最重要テキスト
  secondary: "text-gray-800 dark:text-gray-200", // 本文テキスト（修正）
  tertiary: "text-gray-700 dark:text-gray-300",  // 補助テキスト
  muted: "text-gray-500 dark:text-gray-400",     // 非活性、ヒント文字
}
```

### 手順 3: 個別修正が必要な箇所

以下のファイルで、状況に応じて直接的な色指定への変更を検討：

1. **EstatMetadataTabNavigation.tsx** - 既に修正済み
   ```typescript
   // 修正例
   : `border-transparent text-gray-700 dark:text-gray-300 hover:${styles.text.primary} hover:border-gray-300`
   ```

2. **DataTable.tsx** - テーブルヘッダーの可読性向上
3. **EstatDataFetcher.tsx** - ボタンテキストの明確化

### 手順 4: 検証とテスト

修正後の検証項目：

1. **視覚的検証**
   - ライトモードでの各テキスト階層の可読性
   - ダークモードでの表示に問題がないか確認

2. **アクセシビリティ検証**
   - WCAG 2.1 AA準拠のコントラスト比確認
   - 最低4.5:1のコントラスト比を満たしているか

3. **コンポーネント別検証**
   - データテーブル
   - ナビゲーション要素  
   - フォーム要素
   - メタデータ表示

## 予防策

### 1. デザインシステムの厳格化

```typescript
// 推奨：明確な用途別定義
text: {
  heading: "text-gray-900 dark:text-gray-50",      // h1, h2等の見出し専用
  body: "text-gray-800 dark:text-gray-200",        // 本文テキスト専用
  caption: "text-gray-700 dark:text-gray-300",     // キャプション、説明文専用
  disabled: "text-gray-500 dark:text-gray-400",    // 非活性要素専用
}
```

### 2. カラーコントラスト基準の文書化

- ライトモード: 背景色#ffffff に対して最低4.5:1のコントラスト比
- ダークモード: 背景色に応じた適切なコントラスト比の維持

### 3. 定期的な視覚的レビュー

- デザインシステム変更時の全画面確認
- 異なるデバイス・ブラウザでの表示確認
- アクセシビリティツールを用いたコントラスト比測定

## まとめ

この問題は`styles.text.secondary`の色定義が薄すぎることが原因です。`text-gray-700`から`text-gray-800`への変更により、可読性が大幅に改善されます。修正実装後は、全コンポーネントでの視覚的確認とアクセシビリティ検証を必ず実施してください。
# Sidebarライトモード文字色修正レポート

## 問題の概要
ライトモードにおいて、Sidebarコンポーネントのナビゲーションリンクの文字色が薄いグレー（`text-gray-500`）になっており、視認性が悪い状態になっている。

## 問題の発生箇所
**ファイル**: `src/components/layout/Sidebar.tsx:125`

```jsx
inactive: "w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800",
```

## 原因分析
1. **基本色設定**: `text-gray-500`が薄いグレーでライトモード背景に対してコントラストが不十分
2. **useStyles統合不足**: `useStyles`フックで定義された色階層（`styles.text.tertiary`など）を活用していない
3. **一貫性の欠如**: 他の部分では`styles.text.secondary`を使用しているが、リンクスタイルでは直接Tailwindクラスを指定

## 解決方法

### 推奨解決案1: useStylesの色階層を使用
```jsx
inactive: `w-full flex items-center gap-x-2 py-2 px-2.5 text-sm ${styles.text.secondary} rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300`,
```

**メリット**:
- `styles.text.secondary`は`text-gray-700 dark:text-gray-200`でより視認性が良い
- 既存のスタイルシステムと一貫性がある

### 推奨解決案2: より濃いグレーに変更
```jsx
inactive: "w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-700 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800",
```

**変更点**: `text-gray-500` → `text-gray-700`, `light:text-gray-500` → `light:text-gray-700`

## 影響範囲
- ホームセクション（Dashboard, コロプレス地図）
- e-STAT APIセクション（メタ情報, レスポンス情報）
- その他の非アクティブナビゲーションリンク

## テスト確認項目
1. ライトモードでの視認性改善
2. ダークモードでの表示に影響がないこと
3. ホバー状態とフォーカス状態が正常に動作すること
4. アクティブ状態のスタイルに影響がないこと

## 推奨実装
**解決案1**を推奨する理由：
- 既存の`useStyles`システムとの統合
- 将来的なテーマ変更への対応力
- コードの保守性向上
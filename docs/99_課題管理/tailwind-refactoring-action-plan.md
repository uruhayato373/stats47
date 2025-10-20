---
title: Tailwind CSS globals.css リファクタリング実行計画
created: 2025-01-19
updated: 2025-01-19
tags:
  - action-plan
  - refactoring
  - tailwind-css
  - globals-css
  - チェックリスト
status: 実行可能
priority: 最高
---

# Tailwind CSS globals.css リファクタリング実行計画

## プロジェクト概要

**目的**: ライトモードでTailwindスタイルが正しく表示されるよう、globals.cssをリファクタリングする

**背景**: globals.cssに67個の`html.light`/`html.dark`セレクタが存在し、Tailwindの標準クラスを上書きしている

**目標**:
- globals.cssを332行から60行に削減（82%削減）
- すべてのコンポーネントでTailwindスタイルが正しく表示される
- 保守性とメンテナンス性の向上

**期間**: 2週間

**担当**: 開発チーム

---

## 📋 全体のチェックリスト

### Phase 0: 準備（1日）

- [ ] チーム内で問題と解決策を共有
- [ ] 関連ドキュメントをレビュー
  - [ ] `tailwind-light-mode-issues-root-cause.md`
  - [ ] `alert-style-not-reflecting.md`
  - [ ] `alert-savebutton-style-mismatch.md`
- [ ] Gitで新しいブランチを作成
  ```bash
  git checkout -b refactor/globals-css-tailwind-cleanup
  ```
- [ ] 影響範囲の調査スクリプトを実行
- [ ] バックアップを作成
  ```bash
  cp src/app/globals.css src/app/globals.css.backup
  ```

### Phase 1: 影響範囲の調査（1-2時間）

- [ ] 影響を受けているコンポーネント数を確認
  ```bash
  grep -r "bg-gray-50\|bg-gray-100\|bg-white\|text-gray-800\|text-gray-900" src/components/ --include="*.tsx" | wc -l
  ```
- [ ] サイドバーコンポーネントを特定
  ```bash
  find src/components -name "*Sidebar*" -o -name "*sidebar*"
  ```
- [ ] ヘッダーコンポーネントを特定
  ```bash
  find src/components -name "*Header*" -o -name "*header*"
  ```
- [ ] 調査結果をドキュメント化

### Phase 2: 優先コンポーネントの移行（1週間）

#### 2.1 Alert コンポーネント（最優先）

- [ ] `src/components/atoms/Alert/Alert.tsx`を開く
- [ ] 現在のスタイルを確認
- [ ] `dark:`プレフィックスを追加
  ```typescript
  case "success":
    return "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300";
  case "error":
    return "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";
  case "info":
    return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300";
  case "warning":
    return "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300";
  ```
- [ ] ライトモードで表示確認
- [ ] ダークモードで表示確認
- [ ] Storybookで表示確認
- [ ] コミット
  ```bash
  git add src/components/atoms/Alert/Alert.tsx
  git commit -m "refactor: Add dark mode classes to Alert component"
  ```

#### 2.2 SaveButton コンポーネント

- [ ] `src/components/atoms/SaveButton/SaveButton.tsx`を開く
- [ ] 現在の実装を確認
- [ ] Alertコンポーネントを再利用する形にリファクタリング
  ```typescript
  {saveResult && (
    <Alert
      type={saveResult.success ? "success" : "error"}
      message={saveResult.message}
    />
  )}
  ```
- [ ] または、`dark:`プレフィックスを追加
  ```typescript
  className={`... ${
    saveResult.success
      ? "bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
      : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
  }`}
  ```
- [ ] 表示確認（ライト、ダーク、Storybook）
- [ ] コミット

#### 2.3 Sidebar コンポーネント

- [ ] サイドバーコンポーネントのファイルパスを確認
- [ ] コンポーネントを開く
- [ ] globals.cssで定義されているスタイルを確認
  ```css
  html.light #sidebar {
    background-color: #f9fafb;
    border-color: #e5e7eb;
  }
  ```
- [ ] Tailwindクラスに置き換え
  ```tsx
  <aside
    id="sidebar"
    className="bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-neutral-700"
  >
  ```
- [ ] サイドバー内の要素も同様に移行
- [ ] 表示確認
- [ ] コミット

#### 2.4 Header コンポーネント

- [ ] ヘッダーコンポーネントを開く
- [ ] globals.cssのルールを確認
  ```css
  html.light header {
    background-color: #f4f4f5;
  }
  ```
- [ ] Tailwindクラスに置き換え
  ```tsx
  <header className="bg-zinc-100 dark:bg-neutral-900">
  ```
- [ ] 表示確認
- [ ] コミット

#### 2.5 Card系コンポーネント

- [ ] Card、CardHeader、CardBodyなどのコンポーネントを特定
- [ ] `bg-white`の上書きを確認
- [ ] Tailwindクラスに置き換え
  ```tsx
  <div className="bg-white dark:bg-neutral-800">
  ```
- [ ] 表示確認
- [ ] コミット

#### 2.6 その他のコンポーネント（必要に応じて）

- [ ] 影響を受けているその他のコンポーネントを順次移行
- [ ] 各コンポーネントごとにコミット

### Phase 3: globals.css のクリーンアップ（1日）

- [ ] すべてのコンポーネント移行が完了したことを確認
- [ ] globals.cssのバックアップを再確認
- [ ] `html.light`/`html.dark`セレクタを削除
  - [ ] サイドバー関連（Line 67-189）
  - [ ] ヘッダー関連（Line 49-65）
  - [ ] メインコンテンツ関連（Line 191-209）
  - [ ] 背景色設定（Line 221-244）
  - [ ] ボーダー色設定（Line 246-269）
  - [ ] テキスト色設定（Line 271-310）
- [ ] 残すべきルールを確認
  - [x] CSS変数の定義（Line 3-17）
  - [x] `@theme`設定（Line 19-25）
  - [x] ベーススタイル（Line 27-33）
  - [x] レイアウトz-index（Line 35-47）
  - [x] レスポンシブ設定（Line 312-331）
- [ ] 不要なコメントを削除
- [ ] ファイルサイズを確認
  ```bash
  wc -l src/app/globals.css
  # 目標: 60行前後
  ```
- [ ] コミット
  ```bash
  git add src/app/globals.css
  git commit -m "refactor: Clean up globals.css - remove html.light/dark overrides"
  ```

### Phase 4: Storybook CSS の統合（30分）

- [ ] `.storybook/storybook.css`を修正
  ```css
  /* グローバルCSSをインポート */
  @import "../src/app/globals.css";

  /* Storybook固有のスタイルのみ */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  ```
- [ ] `@import "tailwindcss";`を削除
- [ ] `.dark`と`.light`の定義を削除
- [ ] キャッシュをクリア
  ```bash
  rm -rf .next node_modules/.cache/storybook
  ```
- [ ] Storybookを再起動
  ```bash
  npm run storybook
  ```
- [ ] すべてのストーリーで表示確認
- [ ] コミット

### Phase 5: 包括的なテスト（1-2日）

#### 5.1 コンポーネント単位のテスト

- [ ] Alert - ライトモード
- [ ] Alert - ダークモード
- [ ] Alert - Storybook
- [ ] SaveButton - ライトモード
- [ ] SaveButton - ダークモード
- [ ] SaveButton - Storybook
- [ ] Sidebar - ライトモード
- [ ] Sidebar - ダークモード
- [ ] Header - ライトモード
- [ ] Header - ダークモード
- [ ] Card系 - ライトモード
- [ ] Card系 - ダークモード

#### 5.2 ページ単位のテスト

- [ ] ホームページ - ライト/ダーク
- [ ] ダッシュボードページ - ライト/ダーク
- [ ] ランキングページ - ライト/ダーク
- [ ] e-Stat APIページ - ライト/ダーク
- [ ] 設定ページ - ライト/ダーク

#### 5.3 ブラウザ互換性テスト

- [ ] Chrome - ライト/ダーク
- [ ] Firefox - ライト/ダーク
- [ ] Safari - ライト/ダーク
- [ ] Edge - ライト/ダーク

#### 5.4 レスポンシブテスト

- [ ] デスクトップ（1920x1080）
- [ ] ラップトップ（1366x768）
- [ ] タブレット（768x1024）
- [ ] モバイル（375x667）

### Phase 6: ドキュメント更新（2時間）

- [ ] README.mdを更新（必要に応じて）
- [ ] スタイリングガイドを作成/更新
  - [ ] Tailwindの`dark:`プレフィックスの使用方法
  - [ ] globals.cssの使用ガイドライン
  - [ ] コンポーネント開発のベストプラクティス
- [ ] 変更履歴を記録
- [ ] コミット

### Phase 7: コードレビューとマージ（1日）

- [ ] プルリクエストを作成
  ```bash
  git push origin refactor/globals-css-tailwind-cleanup
  # GitHubでPRを作成
  ```
- [ ] PR説明を記入
  - [ ] 問題の背景
  - [ ] 変更内容の要約
  - [ ] テスト結果
  - [ ] スクリーンショット（Before/After）
- [ ] レビュー依頼
- [ ] フィードバック対応
- [ ] 承認後、mainブランチにマージ
- [ ] デプロイ前の最終確認

---

## 🚨 緊急時の暫定対応（オプション）

全面リファクタリング前に、Alert/SaveButtonのみを緊急修正する場合：

### 暫定対応の手順

1. [ ] globals.cssで該当ルールをコメントアウト
   ```css
   /* 暫定対応: Alert/SaveButton用のルールをコメントアウト */
   /*
   html.light .bg-green-50 {
     background-color: #f9fafb;
   }

   html.light .text-green-800 {
     color: #1f2937;
   }

   html.light .bg-red-50 {
     background-color: #fee2e2;
   }

   html.light .text-red-800 {
     color: #991b1b;
   }
   */
   ```

2. [ ] Alert.tsxに`dark:`プレフィックスを追加

3. [ ] SaveButton.tsxに`dark:`プレフィックスを追加

4. [ ] 表示確認

5. [ ] コミット
   ```bash
   git commit -m "hotfix: Fix Alert and SaveButton light mode styles"
   ```

---

## 📊 進捗管理

### スプリント1（Week 1）

| タスク | 担当 | 状態 | 完了日 |
|-------|------|------|--------|
| Phase 0: 準備 | | ⬜️ 未着手 | |
| Phase 1: 影響範囲調査 | | ⬜️ 未着手 | |
| Phase 2.1: Alert | | ⬜️ 未着手 | |
| Phase 2.2: SaveButton | | ⬜️ 未着手 | |
| Phase 2.3: Sidebar | | ⬜️ 未着手 | |
| Phase 2.4: Header | | ⬜️ 未着手 | |
| Phase 2.5: Card系 | | ⬜️ 未着手 | |

### スプリント2（Week 2）

| タスク | 担当 | 状態 | 完了日 |
|-------|------|------|--------|
| Phase 2.6: その他 | | ⬜️ 未着手 | |
| Phase 3: globals.cssクリーンアップ | | ⬜️ 未着手 | |
| Phase 4: Storybook CSS統合 | | ⬜️ 未着手 | |
| Phase 5: 包括的テスト | | ⬜️ 未着手 | |
| Phase 6: ドキュメント更新 | | ⬜️ 未着手 | |
| Phase 7: レビュー&マージ | | ⬜️ 未着手 | |

---

## 🎯 成功基準

- [ ] すべてのコンポーネントでライトモードのTailwindスタイルが正しく表示される
- [ ] ダークモードも引き続き正常に動作する
- [ ] globals.cssが60行前後に削減される
- [ ] すべてのテストケースが合格
- [ ] ドキュメントが更新される
- [ ] チームメンバーが新しいアプローチを理解している

---

## 📝 参考コマンド集

### 開発サーバー

```bash
# Next.js開発サーバー
npm run dev

# Storybook開発サーバー
npm run storybook

# すべてのサーバーを停止
pkill -f "next dev"
pkill -f "storybook"
```

### キャッシュクリア

```bash
# Next.jsキャッシュ
rm -rf .next

# Storybookキャッシュ
rm -rf node_modules/.cache/storybook

# すべてのキャッシュ
rm -rf .next node_modules/.cache .turbo
```

### ビルド確認

```bash
# Next.jsビルド
npm run build

# Storybookビルド
npm run build-storybook

# TypeScript型チェック
npx tsc --noEmit --skipLibCheck
```

### 検索コマンド

```bash
# Tailwindクラスを使用しているコンポーネントを検索
grep -r "bg-gray-50" src/components/ --include="*.tsx"

# globals.cssの特定のルールを検索
grep -n "html.light .bg-gray-50" src/app/globals.css

# コンポーネントファイルを検索
find src/components -name "*Alert*"
```

---

## 🔗 関連リンク

- [根本原因の詳細分析](tailwind-light-mode-issues-root-cause.md)
- [Alertスタイル問題](./alert-style-not-reflecting.md)
- [Alert/SaveButtonスタイル不一致](./alert-savebutton-style-mismatch.md)
- [Tailwind CSS v4 ドキュメント](https://tailwindcss.com/docs/v4-beta)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

## 📞 サポート

問題が発生した場合：

1. 関連ドキュメントを確認
2. ブラウザの開発者ツールでスタイルを検証
3. キャッシュをクリアして再確認
4. チームメンバーに相談

---

**最終更新**: 2025-01-19
**次のレビュー**: Phase 2完了時

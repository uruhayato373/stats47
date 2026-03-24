# テスト構成

apps/web のテストは以下の 2 層で構成されています。

## 1. ユニットテスト（Vitest）

個々の関数・フック・ユーティリティの動作を検証します。

```bash
npm test              # watch モード
npm run test:run      # 1回実行
npm run test:coverage # カバレッジ付き実行
```

- 設定: `vitest.config.ts`
- テストファイル: `src/**/*.test.ts(x)`, `src/**/__tests__/**`
- CI: `.github/workflows/pr-quality-check.yml`

## 2. E2E テスト（Playwright）

Next.js 開発サーバーを起動し、実際のブラウザでページ遷移・操作・表示を検証します。
**ローカル実行専用**（CI では実行しない）。ブラウザは Chromium のみ。

```bash
npm run test:e2e       # Chromium で実行
npm run test:e2e:ui    # UI モード
npm run test:e2e:headed # ブラウザ表示あり
```

- 設定: `playwright.config.ts`
- 実行前に `npm run dev` で開発サーバーが起動している必要あり（自動起動もされる）

```
tests/e2e/
├── areas/           # 都道府県一覧・詳細ページ
├── comparison/      # 地域間比較ページ
├── correlation/     # 相関分析ページ
├── dashboard/       # ダッシュボード一覧・詳細
├── navigation/      # ヘッダーナビゲーション
├── ranking/         # ランキング一覧・詳細
├── subcategory/     # サブカテゴリページ・リダイレクト
├── search/          # 検索ページ
├── seo/             # 構造化データ・メタタグ
├── static/          # プライバシーポリシー・利用規約
└── helpers/         # テストユーティリティ
```

## テスト追加の指針

| 対象 | 適切なテスト層 |
|------|---------------|
| 純粋関数・ユーティリティ | ユニットテスト |
| React フック・コンポーネント単体ロジック | ユニットテスト |
| ページ遷移・フォーム操作・API連携 | E2E テスト |
| ミドルウェア・リダイレクト | E2E テスト |
| SEO（構造化データ・OGタグ） | E2E テスト |
| Server Action | ユニットテスト |

## テストレビューワークフロー

コードを追加・修正した際は `/review-tests` スキルを実行し、
変更に対応するテストの確認・作成・更新を行う。

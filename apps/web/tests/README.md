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

### カバレッジ方針（回帰防止 floor・単一ソース）

カバレッジは「目標 100%」ではなく **「下げない floor（回帰防止線）」** で運用します。

- **単一ソース**: `apps/web/coverage-thresholds.json`（lines/statements/functions/branches）。`vitest.config.ts` がこれを読んで enforce（未達で `test:coverage` が exit 1）し、CI のカバレッジコメントも同ファイルを表示する。**閾値を他の場所にハードコードしない**（過去に CI と vitest で 100/10 に分裂した反省）。
- **分母はロジック層のみ**: `src/app` は `page` / `layout` / `route` / OGP / sitemap 等の結線ファイルだけを除外し、同階層の再利用ロジックは coverage 対象にする。`src/middleware.ts`・`src/providers`・`src/store` の結線は E2E 担当。
- **重要module floor**: `.claude/config/critical-module-coverage.json` がroute metadataを含む重要契約のmodule別lines / branches / functionsを保持し、PRで個別にenforceする。
- **floor の bump**: floor は自動追随しない。カバレッジが十分上がったら、四半期または大型 PR の節目に `coverage-thresholds.json` を手動で引き上げる（放置すると形骸化する）。緑=十分ではなく「floor を割っていない」だけ。

## 2. E2E テスト（Playwright）

Next.js の本番ビルドを起動し、実際のブラウザでページ遷移・操作・表示を検証します。
PRではknown route matrixとresponsive smokeをrequired jobで実行し、全件は専用E2E jobで検証します。ブラウザはChromiumのみです。

```bash
npm run test:e2e       # Chromium で実行
npm run test:e2e:ui    # UI モード
npm run test:e2e:headed # ブラウザ表示あり
```

- 設定: `playwright.config.ts`
- サーバー未起動時は `npm run build` と `next start` を自動実行
- R2 snapshot を読む重いページの安定性を優先し、1 worker で直列実行

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

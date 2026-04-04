---
name: run-tests
description: テストを実行して結果を報告する。Use when user says "テスト実行", "run-tests", "テスト回して". Vitest ユニットテスト + Playwright E2E 対応.
---

テストを実行して結果を報告する。

## 概要

apps/web および packages のテストを実行する。
デフォルトはユニットテスト（Vitest）のみ。E2E はオプション。

## 手順

1. ユーザーにテスト対象を確認:
   - **ユニットテスト（推奨）**: Vitest による高速テスト
   - **E2E テスト**: Playwright による Chromium ブラウザテスト（ローカル専用）
   - **両方**

2. ユニットテストの実行:
   - 全体: `npm run test:run -w apps/web`
   - packages 含む全体: `npm test -- --run`（リポジトリルート）
   - 特定パッケージ: `npm run test:run -w packages/<name>`
   - カバレッジ付き: `npm run test:coverage -w apps/web`

3. E2E テストの実行（選択時のみ）:
   - 前提: 開発サーバーが起動しているか、環境変数が設定済みであること
   - 実行: `npm run test:e2e -w apps/web`
   - Playwright が自動で開発サーバーを起動する（`reuseExistingServer: true`）

4. 型チェックも合わせて実行:
   - `npx tsc --noEmit -p apps/web/tsconfig.json`

5. 結果を報告:
   - 成功: パス数、所要時間を報告
   - 失敗: 失敗したテスト名、エラー内容を報告し、修正方針を提案

## 参照

- `apps/web/tests/README.md` — テスト構成・追加指針
- `apps/web/vitest.config.ts` — Vitest 設定
- `apps/web/playwright.config.ts` — Playwright 設定

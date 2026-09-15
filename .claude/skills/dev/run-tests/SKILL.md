---
name: run-tests
description: テストを実行して結果を報告する。Use when user says "テスト実行", "run-tests", "テスト回して". Vitest ユニットテスト + Playwright E2E 対応.
primary_agent: devops-runner
co_agents: [tdd-guide]
---

テストを実行して結果を報告する。

## 概要

apps/web および packages のテストを実行する。
デフォルトはユニットテスト（Vitest）のみ。E2E はオプション。

## 手順

対象範囲は `.claude/rules/local-environment.md`「検証コマンドの粒度」に従う。開発中は
変更に関連するテストだけを実行し、全体・E2E はまとまった変更の完了時・リリース前・
ユーザーが明示した場合に限る。

1. ユーザーにテスト対象を確認:
   - **対象テスト（既定）**: 変更に関連するファイル・パッケージだけを実行
   - **全体**: まとまった変更の完了時・リリース前・ユーザー明示時
   - **E2E テスト**: Playwright による Chromium ブラウザテスト（ローカル専用。route/SEO/構造化データ等 E2E でしか判定できない変更のときに選ぶ）

2. ユニットテストの実行:
   - 対象テスト（既定）: `npx vitest run <対象パス>`（apps/web） / `npm run test:run -w packages/<name>`（対象パッケージ）
   - 全体: `npm run test:run -w apps/web`
   - packages 含む全体: `npm test -- --run`（リポジトリルート）
   - カバレッジ付き: `npm run test:coverage -w apps/web`

3. E2E テストの実行（選択時のみ）:
   - 前提: 開発サーバーが起動しているか、環境変数が設定済みであること
   - 実行: `npm run test:e2e -w apps/web`
   - Playwright が自動で開発サーバーを起動する（`reuseExistingServer: true`）

4. 型チェックも合わせて実行:
   - 変更した workspace に限定: `npm run type-check --workspace apps/web`
   - まとまった変更の完了時・リリース前: `npx tsc --noEmit -p apps/web/tsconfig.json`（全体）

5. 結果を報告:
   - 成功: パス数、所要時間を報告
   - 失敗: 失敗したテスト名、エラー内容を報告し、修正方針を提案
   - フル実行を省略した場合は、何を検証し何を未実行かを明示する

## 参照

- `.claude/rules/local-environment.md`「検証コマンドの粒度」— 対象範囲の正典
- `apps/web/tests/README.md` — テスト構成・追加指針
- `apps/web/vitest.config.ts` — Vitest 設定
- `apps/web/playwright.config.ts` — Playwright 設定

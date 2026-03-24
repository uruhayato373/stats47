# CI/CD ガイド

## ワークフロー

### GitHub Actions

| ワークフロー | トリガー | 実行内容 |
|------------|---------|---------|
| PR Quality Check | PR作成・更新 (main) | Lint、Type Check、Test、Coverage |
| Deploy to Cloudflare Workers | Push (main) | Build、認証確認、デプロイ、ヘルスチェック |
| Security Scan | PR/Push、毎週日曜0時、手動 | npm audit、CodeQL分析 |

### ブランチ戦略

```
main → Production（自動デプロイ）
feature/* → PR作成 → 品質チェック
```

**並列実行制御**:
- 同じPRに対する複数実行は最新のみ実行（古いものは自動キャンセル）

## GitHub Secrets

リポジトリ設定（Settings → Secrets and variables → Actions）で以下を設定：

### 必須

| Secret | 用途 | 形式 |
|--------|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflareデプロイ認証 | 40文字の英数字（Workers Scripts、D1、R2の編集権限が必要） |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflareアカウント識別 | 32文字の16進数 |
| `AUTH_SECRET` | NextAuth認証シークレット | 32文字以上のランダム文字列 |

### 環境別設定

| Secret | 用途 |
|--------|------|
| `NEXT_PUBLIC_ESTAT_APP_ID` | e-Stat API アプリケーションID |
| `NEXT_PUBLIC_BASE_URL_PRODUCTION` | 本番環境URL（例: https://stats47.jp） |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID_PRODUCTION` | 本番環境 Google Analytics測定ID |

### オプション

| Secret | 用途 |
|--------|------|
| `CODECOV_TOKEN` | カバレッジアップロード（オプション） |
| `SLACK_WEBHOOK_URL` | Slack通知（オプション） |

## PRマージ前チェック

**ワークフロー**: `pr-quality-check.yml`

自動実行されるチェック項目（タイムアウト: 20分）：

1. ✅ **ESLint**: `npm run lint`
   - Lintエラーで失敗（continue-on-error: false）

2. ✅ **Type Check**: `npx tsc --noEmit --skipLibCheck`
   - 型エラーで失敗（continue-on-error: false）

3. ✅ **Unit Tests with Coverage**: `npm run test:coverage`
   - テスト失敗で停止（continue-on-error: false）
   - カバレッジレポートをアーティファクトとしてアップロード

4. ✅ **Verify Build**: `npm run build`
   - ビルドエラーで失敗

**並列実行制御**:
- 同じPRの古い実行は自動的にキャンセルされ、最新のコミットのみが実行されます

## デプロイフロー

**ワークフロー**: `deploy-workers.yml`

### Production環境デプロイ

**トリガー**: `main` ブランチへのPush

1. 📥 リポジトリをチェックアウト
2. 🟢 Node.js 20をセットアップ
3. 📦 依存関係をインストール（`npm ci`）
4. 🔐 **Cloudflare認証確認**
   - API Tokenの形式チェック（40文字の英数字）
   - Account IDの形式チェック（32文字の16進数）
   - `npx wrangler whoami` で認証テスト
5. 🔨 **ビルド**: `npm run workers:build`
   - 環境変数: `NEXT_PUBLIC_ENV=production`
   - Production用のベースURL、GA測定IDを設定
6. ✅ OpenNextビルド検証（`.open-next/` ディレクトリ確認）
7. 📤 **Cloudflare Workersへデプロイ**
   - Production環境: `stats47`
   - D1データベース: `stats47_static`
8. 🏥 **ヘルスチェック**
   - デプロイされたURLへアクセス確認
   - HTTPステータスコード200を確認

### エリアデータアップロード

**ワークフロー**: `upload-area-data.yml`
**トリガー**: `main` ブランチへのPush（`data/mock/area/**` または `scripts/upload-area-data.ts` の変更時）

1. 📥 リポジトリをチェックアウト
2. 🟢 Node.js 20をセットアップ
3. 📦 依存関係をインストール
4. 🔍 エリアデータの変更をチェック
5. 📤 R2へアップロード（変更がある場合のみ）
   - Production: `stats47-area-data`
6. ✅ アップロード検証

## トラブルシューティング

### CI失敗時の対処

#### 型エラー（Type Check失敗）
```bash
# ローカルで型チェックを実行
npx tsc --noEmit --skipLibCheck
```

**よくある原因**:
- 型定義の不一致
- importパスの誤り
- 未定義の型を使用

#### Lintエラー（ESLint失敗）
```bash
# ローカルでLintを実行
npm run lint

# 自動修正可能なエラーを修正
npm run lint:fix
```

**よくある原因**:
- コーディング規約違反
- 未使用の変数やimport
- console.logの残存

#### テスト失敗
```bash
# ローカルでテストを実行
npm run test:run

# カバレッジ付きでテスト
npm run test:coverage
```

**よくある原因**:
- 変更により既存のテストが壊れた
- 新しいコードにテストが不足
- モックの設定ミス

#### ビルドエラー
```bash
# ローカルでビルドを実行
npm run build

# Workers用ビルド
npm run workers:build
```

**よくある原因**:
- 環境変数の不足
- 依存関係の問題
- Next.jsの設定ミス

### デプロイエラー

#### Cloudflare認証エラー

**エラーメッセージ**: `❌ 認証失敗: Cloudflare APIトークンが無効または権限が不足しています`

**解決方法**:
1. Cloudflare Dashboard > My Profile > API Tokens で新しいトークンを作成
2. 以下の権限を設定:
   - Account - Workers Scripts - Read
   - Account - Workers Scripts - Edit
   - Account - Account - Read
   - Account - D1 - Edit
   - Account - R2 - Edit
3. GitHub Settings > Secrets で `CLOUDFLARE_API_TOKEN` を更新

#### API Token形式エラー

**エラーメッセージ**: `⚠️ 警告: APIトークンの形式が期待と異なります`

**確認事項**:
- API Tokenは40文字の英数字、ハイフン、アンダースコアであること
- Account IDは32文字の16進数であること

#### ビルド検証エラー

**エラーメッセージ**: `.open-next/` ディレクトリが見つからない

**解決方法**:
```bash
# ローカルでビルドを確認
npm run workers:build
ls -la .open-next/
```

### キャッシュクリア

GitHub Actionsのキャッシュが古い場合:

```yaml
# ワークフローファイルでキャッシュキーを変更
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
```

または、GitHub Actions画面から「Re-run all jobs」で再実行。

### 手動実行

以下のワークフローは手動実行可能（`workflow_dispatch`）:
- Security Scan
- Upload Area Data to R2

**実行方法**:
1. GitHub > Actions > 対象ワークフロー選択
2. 「Run workflow」ボタンをクリック
3. ブランチを選択して実行

## セキュリティスキャン

**ワークフロー**: `security-scan.yml`
**実行タイミング**:
- PR作成・更新時（main）
- Push時（main）
- 毎週日曜日 0時（UTC）
- 手動実行

**チェック内容**:
1. `npm audit` - 依存関係の脆弱性チェック（moderate以上）
2. CodeQL分析 - コードの静的解析（JavaScript/TypeScript）

**注意**: エラーは警告のみで、ワークフロー自体は失敗させません（`continue-on-error: true`）

## チェックリスト

### PRマージ前

- [ ] すべてのCIチェックが通過（✅ 緑色）
- [ ] コードレビュー承認済み（Approved）
- [ ] コンフリクト解消済み
- [ ] ブランチが最新（`git pull origin main`）
- [ ] コミットメッセージが適切

### デプロイ前

- [ ] D1データベースマイグレーション実行済み（必要な場合）
- [ ] 環境変数が設定済み（GitHub Secrets）
- [ ] ロールバックプランを準備
- [ ] 関係者への通知済み（本番デプロイの場合）

### デプロイ後

- [ ] ヘルスチェックが成功
- [ ] 主要機能の動作確認（スモークテスト）
- [ ] エラーログの確認
- [ ] パフォーマンスの確認（必要に応じて）

## 関連リンク

- [GitHub Actions ワークフロー](.github/workflows/)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Next.js デプロイメント](https://nextjs.org/docs/deployment)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

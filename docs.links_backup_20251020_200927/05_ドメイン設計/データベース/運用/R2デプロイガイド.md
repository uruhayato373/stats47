# R2 保存機能 デプロイメントガイド

## 概要

e-Stat メタ情報の R2 保存機能は、開発環境と本番環境で異なる動作をします。

## 環境別の動作

### 環境別の動作表

| 環境                          | R2 保存  | バケット名            | 設定方法                        |
| ----------------------------- | -------- | --------------------- | ------------------------------- |
| **mock**                      | 無効     | -                     | `NEXT_PUBLIC_ENV=mock`          |
| **development（ローカル）**   | スキップ | -                     | ローカルでは R2 バケットなし    |
| **development（Cloudflare）** | 有効     | `stats47-development` | `wrangler dev`                  |
| **staging**                   | 有効     | `stats47-staging`     | `wrangler deploy --env staging` |
| **production**                | 有効     | `stats47`             | `wrangler deploy`               |

### 重要なポイント

1. **環境変数は不要**: R2 バケットは`wrangler.toml`で自動バインディング
2. **ローカル開発**: R2 保存はスキップされる（正常な動作）
3. **Cloudflare 環境**: 自動的に適切なバケットが使用される

## 設定要件

### R2 バケットの作成

Cloudflare R2 ダッシュボードで以下のバケットを作成:

1. `stats47-development` - 開発・プレビュー用
2. `stats47-staging` - ステージング用
3. `stats47` - 本番用

**作成手順**:

```bash
# wrangler CLIを使用してバケット作成
wrangler r2 bucket create stats47-development
wrangler r2 bucket create stats47-staging
wrangler r2 bucket create stats47
```

### カスタムドメインの設定

R2 バケットにカスタムドメインを設定して、より使いやすい URL でアクセスできるようにします。

**推奨ドメイン構成**:

- 本番環境: `api.stats47.com`
- ステージング環境: `staging.stats47.com`
- 開発環境: `dev.stats47.com`

**詳細な設定手順**: [カスタムドメイン設定ガイド](./custom-domain-setup.md)を参照してください。

### パブリック開発 URL の設定

開発環境でのパブリックアクセスを可能にし、チームメンバーが開発中のアプリケーションを確認できるようにします。

**推奨 URL 構成**:

- 開発環境: `https://dev.stats47.com`
- ステージング環境: `https://staging.stats47.com`
- 本番環境: `https://stats47.com`

**詳細な設定手順**: [パブリック開発 URL 設定ガイド](./public-development-url-setup.md)を参照してください。

### wrangler.toml の設定

```toml
# デフォルト（本番環境）
[[r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47"
preview_bucket_name = "stats47-development"

# ステージング環境
[env.staging]
NODE_ENV = "production"

[[env.staging.r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47-staging"
```

## デプロイ手順

### 1. ローカルでのテスト

```bash
# 開発環境でテスト（R2保存はスキップされる）
npm run dev:mock

# メタ情報を取得してR2保存ボタンをクリック
# → "開発環境ではR2保存をスキップしました" と表示される
```

### 2. 本番環境へのデプロイ

```bash
# Cloudflare Workersにデプロイ
wrangler deploy

# または Pagesにデプロイ
wrangler pages deploy
```

### 3. 本番環境での動作確認

1. 本番環境のアプリケーションにアクセス
2. メタ情報を取得
3. R2 保存ボタンをクリック
4. 成功メッセージとファイルサイズが表示される
5. Cloudflare R2 ダッシュボードでファイルが保存されていることを確認

## トラブルシューティング

### よくある問題

1. **"R2 バケットが設定されていません"エラー**

   - 原因: 環境変数`METAINFO_BUCKET`が設定されていない
   - 解決: Cloudflare 環境で R2 バケットの環境変数を設定

2. **権限エラー**

   - 原因: R2 バケットへの書き込み権限がない
   - 解決: Cloudflare アカウントで R2 バケットの権限を確認

3. **開発環境で R2 保存されない**
   - 原因: 正常な動作（開発環境ではスキップされる）
   - 解決: 本番環境でテストする

## 保存されるデータ構造

```json
{
  "version": "1.0",
  "stats_data_id": "0000010101",
  "saved_at": "2025-10-18T12:00:00.000Z",
  "meta_info_response": {
    // e-Stat APIの完全なレスポンス
  },
  "summary": {
    "table_title": "人口・世帯",
    "stat_name": "社会・人口統計体系",
    "organization": "総務省",
    "survey_date": "2020年",
    "updated_date": "2021-03-31"
  }
}
```

## 関連ファイル

- API エンドポイント: `src/app/api/estat-api/metainfo-cache/save/route.ts`
- R2 リポジトリ: `src/lib/database/estat/repositories/metainfo-r2-repository.ts`
- Service 層: `src/lib/database/estat/services/metainfo-cache-service.ts`
- 型定義: `src/types/models/r2/estat-metainfo-cache.ts`

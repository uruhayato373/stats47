---
title: R2 S3互換API設定ガイド
created: 2025-10-18
updated: 2025-10-18
tags:
  - domain/estat-api
  - implementation
  - r2
  - s3-compatible-api
---

# R2 S3 互換 API 設定ガイド

## 概要

ローカル開発環境で R2 ストレージにアクセスするための S3 互換 API 設定ガイドです。Cloudflare R2 は S3 互換 API を提供しているため、AWS SDK を使用してローカルから直接 R2 にアクセスできます。

## 設定手順

### 1. Cloudflare R2 トークンの作成

Cloudflare ダッシュボードで R2 トークンを作成します。

1. **Cloudflare ダッシュボードにログイン**
2. **R2 Object Storage** → **Manage R2 API tokens**
3. **Create API token**をクリック
4. 以下の設定でトークンを作成：
   - **Token name**: `stats47-development`
   - **Permissions**: `Object Read & Write`
   - **Bucket**: `stats47-development`（開発用バケット）

### 2. 環境変数の設定

`.env.development`ファイルに以下の環境変数を設定：

```bash
# R2 S3互換API設定
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=stats47-development
```

### 3. アカウント ID の確認

Cloudflare ダッシュボードの右サイドバーでアカウント ID を確認できます。

### 4. バケットの作成

以下のコマンドで R2 バケットを作成：

```bash
# 開発用バケット
wrangler r2 bucket create stats47-development

# ステージング用バケット
wrangler r2 bucket create stats47-staging

# 本番用バケット
wrangler r2 bucket create stats47
```

## 使用方法

### 自動切り替え

アプリケーションは環境に応じて自動的に適切な R2 アクセス方法を選択します：

- **ローカル開発環境**: S3 互換 API を使用
- **Cloudflare 環境**: R2 バインディングを使用

### 動作確認

1. **開発サーバーを起動**:

   ```bash
   npm run dev:api
   ```

2. **メタ情報を取得して R2 保存ボタンをクリック**

3. **コンソールログを確認**:
   ```
   S3互換APIでR2保存を実行: 0003410379
   R2保存完了 (S3互換API): { key: "estat_metainfo/0003410379/meta.json", size: 12345 }
   ```

## トラブルシューティング

### よくある問題

1. **認証エラー**

   - 環境変数が正しく設定されているか確認
   - トークンの権限が適切か確認

2. **バケットが見つからない**

   - バケット名が正しいか確認
   - バケットが作成されているか確認

3. **ネットワークエラー**
   - インターネット接続を確認
   - Cloudflare のサービス状況を確認

### デバッグ方法

環境変数の設定を確認：

```bash
# 環境変数が設定されているか確認
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_R2_ACCESS_KEY_ID
echo $CLOUDFLARE_R2_BUCKET_NAME
```

## セキュリティ注意事項

1. **環境変数の管理**

   - `.env.development`ファイルを`.gitignore`に追加
   - 本番環境では環境変数として設定

2. **トークンの権限**

   - 必要最小限の権限のみ付与
   - 定期的にトークンをローテーション

3. **アクセスログの監視**
   - Cloudflare ダッシュボードでアクセスログを確認
   - 異常なアクセスを検出

## まとめ

S3 互換 API を使用することで、ローカル開発環境から直接 R2 ストレージにアクセスできるようになります。これにより、開発効率が向上し、Cloudflare 環境と同様の動作をローカルで確認できます。

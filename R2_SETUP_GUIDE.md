# R2ストレージ設定ガイド

## 現在の状況

`.env.development`ファイルに`CLOUDFLARE_ACCOUNT_ID`は設定されていますが、以下の環境変数が不足しています：

- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`

## 設定手順

### 1. R2バケットの作成（未作成の場合）

```bash
npx wrangler r2 bucket create stats47-development
```

### 2. R2 API Tokenの作成

1. **Cloudflareダッシュボードにログイン**
   - https://dash.cloudflare.com にアクセス

2. **R2 Object Storage を選択**
   - 左側メニューから「R2」を選択

3. **Manage R2 API tokens をクリック**
   - R2の設定ページで「Manage R2 API tokens」をクリック

4. **Create API token をクリック**

5. **以下の設定でトークンを作成**:
   - **Token name**: `stats47-development`
   - **Permissions**: `Object Read & Write` を選択
   - **Bucket**: `stats47-development` を選択（既に作成済みの場合）

6. **作成後、以下をコピーして保存**:
   - **Access Key ID**（例: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`）
   - **Secret Access Key**（例: `x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4`）
   - ⚠️ **注意**: Secret Access Keyは一度しか表示されません。必ずコピーして安全な場所に保存してください

### 3. 環境変数の設定

`.env.development`ファイルを開き、以下を追加または更新してください：

```bash
# 既存の設定
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# 以下を追加
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id_here
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
CLOUDFLARE_R2_BUCKET_NAME=stats47-development
```

### 4. 開発サーバーの再起動

環境変数を設定後、開発サーバーを再起動してください：

```bash
# Ctrl+Cでサーバーを停止
# その後、再起動
npm run dev
```

### 5. 動作確認

メタ情報を保存すると、以下のログが表示されるはずです：

```
✅ R2バックグラウンド保存完了: 0000010102
```

「R2設定がないためスキップ」というメッセージが表示されなくなります。

## トラブルシューティング

### エラー: "Access Denied"
- R2 API Tokenの権限が正しく設定されているか確認
- バケット名が正しいか確認

### エラー: "Bucket not found"
- バケットが作成されているか確認: `npx wrangler r2 bucket list`
- バケット名が環境変数と一致しているか確認

### 環境変数が読み込まれない
- `.env.development`ファイルの場所を確認（プロジェクトルートに配置）
- ファイル名が正しいか確認（`.env.development`）
- 開発サーバーを再起動

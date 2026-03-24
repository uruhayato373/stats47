# R2 output 同期スクリプト

`.local/r2/` ディレクトリと R2 の双方向同期を行うスクリプトです。

## セットアップ

ルートの `package.json` の `scripts` に以下を追加してください。

```json
"r2:upload": "tsx packages/r2-storage/src/scripts/sync-upload.ts",
"r2:download": "tsx packages/r2-storage/src/scripts/sync-download.ts"
```

実行前に `.env.local`（ルートまたはアプリ配下）に R2 認証情報を設定してください。

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`（任意、デフォルト: stats47）

社内プロキシ環境で 407 や XML パースエラーが出る場合は、R2 用にプロキシをバイパスしてください。例: `NO_PROXY=*.r2.cloudflarestorage.com` を設定してからスクリプトを実行する。

## 使い方

以下のコマンドはすべて **リポジトリルート**（`stats47`）で実行してください。オプション（`--prefix` / `--dry-run`）を使う場合は npm のオプションと衝突するため、`npx tsx` でスクリプトを直接実行するコマンドをコピーして使ってください。

### アップロード（.local/r2 → R2）

```bash
npm run r2:upload
# .local/r2/ 全体をアップロード

npx tsx packages/r2-storage/src/scripts/sync-upload.ts --prefix ranking
# ranking/ のみアップロード

npx tsx packages/r2-storage/src/scripts/sync-upload.ts --dry-run
# 対象ファイルを表示するだけ
```

### ダウンロード（R2 → .local/r2）

```bash
npm run r2:download
# R2 全体を .local/r2/ にダウンロード

npm run r2:download --ranking
# ranking/ のみ

npm run r2:download --dry-run
# 対象ファイルを表示するだけ
```

差分はファイルサイズで判定します。同一サイズのファイルはスキップされます。

### 削除（R2オブジェクトの一括削除）

R2 ストレージから指定したプレフィックス配下のオブジェクトを一括削除します。対話形式で確認プロンプトが表示されます。

```bash
npx tsx packages/r2-storage/src/scripts/delete-r2-prefix.ts path/to/delete/
```

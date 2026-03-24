---
description: ローカルD1データベースをリモート（Cloudflare）D1に同期する手順
---

# ローカル D1 → リモート D1 同期手順

## 概要

ローカル開発環境の D1 データベース（SQLite）の内容を、Cloudflare D1 に反映させます。
シードベースの同期フローを使用します。

## 前提条件

- `wrangler` がインストール済み（`npm install` 済みであれば OK）
- Cloudflare にログイン済み（`npx wrangler login` を事前に実行）
- 作業ディレクトリ: `packages/database`

## 同期手順

### Step 1: ローカル D1 からシードデータを抽出

```bash
npm run seed:extract
```

ローカル D1 の全テーブルデータが `.local/r2/seed/*.json` に出力されます。

### Step 2: リモート D1 にシードデータを投入

```bash
# Dry-run で確認（推奨）
npm run seed:remote:production -- --dry-run

# 本番環境への投入
// turbo
npm run seed:remote:production
```

### Step 3: R2 にもシードを同期（任意）

他の開発者とデータを共有する場合:

```bash
npm run seed:push
```

## 注意事項

- **バックアップ**: 同期前に Cloudflare ダッシュボードからリモート DB のバックアップを取得することを推奨します。
- **本番DB**: Static DB (`stats47_static`) が直接更新されます。
- **スキーマ変更**: データ投入前にマイグレーションが必要な場合は、`apps/web` で `npx wrangler d1 migrations apply stats47_static --remote --env production` を実行してください。

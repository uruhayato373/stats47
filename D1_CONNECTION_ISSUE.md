# Cloudflare D1 データベース接続エラーの原因と解決策

## 問題の概要

Next.jsアプリケーションからCloudflare D1データベースへの接続時に404エラーが発生し、データベースへのアクセスに失敗しています。

### エラーメッセージ
```
データベース接続に失敗、フォールバック設定を使用: Error: Cloudflare D1への接続に失敗しました: Cloudflare D1への接続テストに失敗しました: 404
    at createD1Database (src/lib/d1-client.ts:43:11)
```

## 原因の分析

### 1. データベースIDの不一致（主な原因）

環境変数ファイル `.env.local` に設定されているデータベースIDと、実際に存在するデータベースのIDが一致していません。

**現在の設定（誤）:**
```
CLOUDFLARE_D1_DATABASE_ID=3ee6e5a1-97ed-4ab0-a776-199881f86a7d
```

**実際のデータベースID（正）:**
```
e6533698-d05a-475b-9f39-5558703feef7
```

`npx wrangler d1 list` コマンドで確認した結果、データベース名 `stats47` のUUIDは `e6533698-d05a-475b-9f39-5558703feef7` です。

### 2. エンドポイントの問題

コード内で使用している接続テストエンドポイント:
```typescript
// src/lib/d1-client.ts:27
https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}
```

このエンドポイントは特定のデータベース情報を取得するためのものですが、間違ったデータベースIDを使用しているため404エラーが返されています。

### 3. REST API利用の制約

Cloudflare D1のREST APIは以下の制約があります：
- グローバルなCloudflare APIレート制限が適用される
- 主に管理用途として設計されている
- 本番環境でのアプリケーションからの直接利用は推奨されない

## 解決策

### 即座の解決（データベースID修正）

1. `.env.local` ファイルのデータベースIDを正しい値に更新：

```bash
CLOUDFLARE_D1_DATABASE_ID=e6533698-d05a-475b-9f39-5558703feef7
```

2. 開発サーバーを再起動：

```bash
# 開発サーバーが起動している場合は停止して再起動
npm run dev
```

### データベースID確認方法

正しいデータベースIDを確認するには、以下のコマンドを実行：

```bash
npx wrangler d1 list
```

出力例：
```
┌──────────────────────────────────────┬─────────┬──────────────────────────┐
│ uuid                                 │ name    │ created_at               │
├──────────────────────────────────────┼─────────┼──────────────────────────┤
│ e6533698-d05a-475b-9f39-5558703feef7 │ stats47 │ 2025-08-30T09:31:36.722Z │
└──────────────────────────────────────┴─────────┴──────────────────────────┘
```

### 推奨される長期的な解決策

Next.jsアプリケーションから直接Cloudflare D1 REST APIを呼び出すのではなく、以下のアプローチを検討することを推奨します：

#### オプション1: Cloudflare Workerを使用したプロキシAPI

1. Cloudflare Workerを作成してD1データベースにアクセス
2. Next.jsアプリケーションはWorkerのAPIエンドポイントを呼び出す
3. これによりレート制限を回避し、パフォーマンスを向上

参考: [Build an API to access D1 using a proxy Worker](https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/)

#### オプション2: Cloudflare Pagesへの移行

1. アプリケーション全体をCloudflare Pagesにデプロイ
2. Pages Functions（Workers）から直接D1にアクセス
3. Cloudflareのエコシステム内で完結し、最適なパフォーマンスを実現

#### オプション3: 他のデータベースソリューションの検討

- Vercel Postgres
- Supabase
- PlanetScale
- その他のサーバーレスデータベース

## エラー検証手順

環境変数を修正した後、以下の手順で接続を確認：

1. 環境変数が正しく読み込まれているか確認：
```typescript
console.log('CLOUDFLARE_D1_DATABASE_ID:', process.env.CLOUDFLARE_D1_DATABASE_ID);
```

2. Cloudflare APIへの接続テスト：
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${CLOUDFLARE_D1_DATABASE_ID}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json"
```

3. アプリケーションログを確認し、404エラーが解消されたことを確認

## 関連ファイル

- `src/lib/d1-client.ts:26-48` - 接続テストコード
- `src/app/api/ranking-items/[subcategoryId]/route.ts:28` - D1クライアント使用箇所
- `.env.local:13` - データベースID設定

## 参考リンク

- [Cloudflare D1 API Documentation](https://developers.cloudflare.com/api/resources/d1/)
- [D1 REST API Changelog (2025)](https://developers.cloudflare.com/changelog/2025-05-30-d1-rest-api-latency/)
- [Workers Binding API](https://developers.cloudflare.com/d1/worker-api/)
- [Build an API to access D1](https://developers.cloudflare.com/d1/tutorials/build-an-api-to-access-d1/)

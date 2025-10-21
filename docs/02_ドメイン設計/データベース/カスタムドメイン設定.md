---
title: カスタムドメイン設定ガイド
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - implementation
  - deployment
---

# カスタムドメイン設定ガイド

## 概要

e-Stat API ドメインの R2 バケットにカスタムドメインを設定し、より使いやすい URL でアクセスできるようにします。

## ドメイン構成

### 推奨ドメイン構成

| 環境            | バケット名            | カスタムドメイン      | 用途               |
| --------------- | --------------------- | --------------------- | ------------------ |
| **development** | `stats47-development` | `dev.stats47.com`     | 開発・プレビュー用 |
| **staging**     | `stats47-staging`     | `staging.stats47.com` | ステージング用     |
| **production**  | `stats47`             | `api.stats47.com`     | 本番用             |

### サブドメインの用途

- `api.stats47.com` - メインの API エンドポイント
- `dev.stats47.com` - 開発環境用
- `staging.stats47.com` - ステージング環境用
- `geoshape.stats47.com` - GeoShape データ用（既存）

## 設定手順

### 1. Cloudflare R2 でのカスタムドメイン設定

#### 本番環境（api.stats47.com）

```bash
# 1. R2バケットのカスタムドメインを設定
wrangler r2 bucket custom-domain add stats47 --domain api.stats47.com

# 2. 設定確認
wrangler r2 bucket custom-domain list stats47
```

#### ステージング環境（staging.stats47.com）

```bash
# 1. ステージングバケットのカスタムドメインを設定
wrangler r2 bucket custom-domain add stats47-staging --domain staging.stats47.com

# 2. 設定確認
wrangler r2 bucket custom-domain list stats47-staging
```

#### 開発環境（dev.stats47.com）

```bash
# 1. 開発バケットのカスタムドメインを設定
wrangler r2 bucket custom-domain add stats47-development --domain dev.stats47.com

# 2. 設定確認
wrangler r2 bucket custom-domain list stats47-development
```

### 2. DNS 設定

Cloudflare ダッシュボードで以下の DNS レコードを追加：

```
Type: CNAME
Name: api
Content: stats47.r2.cloudflarestorage.com
Proxy: ✅ (Proxied)

Type: CNAME
Name: staging
Content: stats47-staging.r2.cloudflarestorage.com
Proxy: ✅ (Proxied)

Type: CNAME
Name: dev
Content: stats47-development.r2.cloudflarestorage.com
Proxy: ✅ (Proxied)
```

### 3. wrangler.toml の更新

```toml
# デフォルト（本番環境）
[[r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47"
preview_bucket_name = "stats47-development"

# カスタムドメイン設定
[vars]
NEXT_PUBLIC_R2_METAINFO_URL = "https://api.stats47.com"
NEXT_PUBLIC_R2_GEOSHAPE_URL = "https://geoshape.stats47.com"

# ステージング環境
[env.staging]
NODE_ENV = "production"

[[env.staging.r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47-staging"

[env.staging.vars]
NEXT_PUBLIC_R2_METAINFO_URL = "https://staging.stats47.com"
NEXT_PUBLIC_R2_GEOSHAPE_URL = "https://geoshape.stats47.com"

# 開発環境
[env.development]
NODE_ENV = "development"

[env.development.vars]
NEXT_PUBLIC_R2_METAINFO_URL = "https://dev.stats47.com"
NEXT_PUBLIC_R2_GEOSHAPE_URL = "https://geoshape.stats47.com"
```

### 4. アプリケーションコードの更新

#### R2 URL の動的生成

```typescript
// src/lib/r2/url-generator.ts
export function getR2MetaInfoUrl(environment: string = "production"): string {
  const urls = {
    production: "https://api.stats47.com",
    staging: "https://staging.stats47.com",
    development: "https://dev.stats47.com",
    mock: "", // mock環境ではR2を使用しない
  };

  return urls[environment] || urls.production;
}

export function getR2GeoShapeUrl(): string {
  return "https://geoshape.stats47.com";
}
```

#### 環境別 URL の使用

```typescript
// src/lib/estat-api/meta-info/fetcher.ts
import { getR2MetaInfoUrl } from "@/lib/r2/url-generator";

export class EstatMetaInfoFetcher {
  private getR2Url(): string {
    const env = process.env.NEXT_PUBLIC_ENV || "production";
    return getR2MetaInfoUrl(env);
  }

  async fetchFromR2(
    statsDataId: string
  ): Promise<EstatMetaInfoResponse | null> {
    const baseUrl = this.getR2Url();
    if (!baseUrl) return null; // mock環境の場合

    const url = `${baseUrl}/estat_metainfo/${statsDataId}/meta.json`;
    // ... 実装
  }
}
```

## セキュリティ設定

### 1. CORS 設定

```typescript
// src/app/api/cors/route.ts
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "https://stats47.com",
    "https://www.stats47.com",
    "https://dev.stats47.com",
    "https://staging.stats47.com",
  ];

  if (allowedOrigins.includes(origin)) {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  return new Response(null, { status: 403 });
}
```

### 2. 認証設定

```typescript
// src/lib/r2/auth.ts
export function generateR2SignedUrl(
  bucketName: string,
  objectKey: string,
  expiresIn: number = 3600
): string {
  // R2の署名付きURLを生成
  // 実装はCloudflareのドキュメントを参照
}
```

## パフォーマンス最適化

### 1. CDN 設定

```toml
# wrangler.toml
[[r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47"
preview_bucket_name = "stats47-development"

# CDN設定
[r2_buckets.settings]
cache_control = "public, max-age=3600"
```

### 2. キャッシュ戦略

```typescript
// src/lib/r2/cache-strategy.ts
export const R2_CACHE_STRATEGIES = {
  metainfo: {
    maxAge: 3600, // 1時間
    staleWhileRevalidate: 86400, // 24時間
  },
  geoshape: {
    maxAge: 86400, // 24時間
    staleWhileRevalidate: 604800, // 7日間
  },
} as const;
```

## 監視・ログ

### 1. アクセスログの設定

```bash
# R2バケットのアクセスログを有効化
wrangler r2 bucket logging enable stats47 --destination api-logs
```

### 2. メトリクス監視

```typescript
// src/lib/monitoring/r2-metrics.ts
export function trackR2Access(
  bucket: string,
  operation: "read" | "write" | "delete",
  success: boolean
) {
  // Cloudflare Analyticsやカスタムメトリクスに送信
  console.log({
    bucket,
    operation,
    success,
    timestamp: new Date().toISOString(),
  });
}
```

## トラブルシューティング

### よくある問題

1. **DNS 解決エラー**

   - DNS 設定の確認
   - プロパゲーション待ち（最大 24 時間）

2. **CORS エラー**

   - 許可されたオリジンの確認
   - プリフライトリクエストの対応

3. **認証エラー**
   - API トークンの確認
   - バケット権限の確認

### デバッグコマンド

```bash
# DNS解決の確認
nslookup api.stats47.com

# カスタムドメインの確認
wrangler r2 bucket custom-domain list stats47

# バケットの状態確認
wrangler r2 bucket list
```

## まとめ

カスタムドメインの設定により、以下のメリットが得られます：

1. **ユーザビリティ向上**: 覚えやすい URL
2. **ブランディング強化**: プロフェッショナルな印象
3. **パフォーマンス向上**: CDN 最適化
4. **セキュリティ強化**: 適切な CORS 設定
5. **監視・運用性向上**: ログとメトリクス

この設定により、e-Stat API ドメインの R2 バケットがより使いやすく、安全にアクセスできるようになります。

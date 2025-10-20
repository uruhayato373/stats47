---
title: パブリック開発URL設定ガイド
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - implementation
  - deployment
  - development
---

# パブリック開発 URL 設定ガイド

## 概要

開発環境でのパブリックアクセスを可能にし、チームメンバーやステークホルダーが開発中のアプリケーションを確認できるようにします。

## 設定方法

### 1. Cloudflare Pages での開発環境デプロイ

#### 手動デプロイ（推奨）

```bash
# 開発環境用のビルド
npm run build

# Cloudflare Pagesにデプロイ（プレビュー環境）
npx wrangler pages deploy .next --project-name=stats47-dev

# または、特定のブランチにデプロイ
npx wrangler pages deploy .next --project-name=stats47-dev --branch=develop
```

#### 自動デプロイの設定

`.github/workflows/deploy-dev.yml`を作成：

```yaml
name: 🚀 Deploy Development Environment

on:
  push:
    branches:
      - develop
  pull_request:
    branches:
      - develop

jobs:
  deploy-dev:
    runs-on: ubuntu-latest

    env:
      NODE_VERSION: 20
      NEXT_PUBLIC_ENV: development
      CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

    steps:
      - name: 🧰 Checkout repository
        uses: actions/checkout@v4

      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: 📦 Install dependencies
        run: npm ci

      - name: 🧱 Build Next.js app
        run: npm run build

      - name: ☁️ Deploy to Cloudflare Pages (Development)
        run: npx wrangler pages deploy .next --project-name=stats47-dev
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### 2. カスタムドメインの設定

#### 開発環境用ドメイン

```bash
# 開発環境用のカスタムドメインを設定
npx wrangler pages domain add dev.stats47.com --project-name=stats47-dev
```

#### DNS 設定

Cloudflare ダッシュボードで以下の DNS レコードを追加：

```
Type: CNAME
Name: dev
Content: stats47-dev.pages.dev
Proxy: ✅ (Proxied)
```

### 3. 環境変数の設定

#### Cloudflare Pages ダッシュボードでの設定

**Production 環境**:

```
NEXT_PUBLIC_ENV=production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://stats47.com
```

**Development 環境**:

```
NEXT_PUBLIC_ENV=development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=https://dev.stats47.com
```

#### wrangler.toml での設定

```toml
# 開発環境設定
[env.development]
NODE_ENV = "development"

[env.development.vars]
NEXT_PUBLIC_ENV = "development"
NEXT_PUBLIC_APP_URL = "https://dev.stats47.com"
NEXT_PUBLIC_R2_METAINFO_URL = "https://dev.stats47.com/api/r2"

# 開発環境用D1データベース
[[env.development.d1_databases]]
binding = "STATS47_DB"
database_name = "stats47_dev"
database_id = "your-dev-database-id"
migrations_dir = "database/migrations"

# 開発環境用R2バケット
[[env.development.r2_buckets]]
binding = "METAINFO_BUCKET"
bucket_name = "stats47-development"
```

### 4. アプリケーションコードの更新

#### 環境別 URL の動的生成

```typescript
// src/lib/config/urls.ts
export function getAppUrl(): string {
  const env = process.env.NEXT_PUBLIC_ENV || "production";

  const urls = {
    production: "https://stats47.com",
    staging: "https://staging.stats47.com",
    development: "https://dev.stats47.com",
    mock: "http://localhost:3000",
  };

  return urls[env] || urls.production;
}

export function getApiUrl(): string {
  const baseUrl = getAppUrl();
  return `${baseUrl}/api`;
}

export function getR2Url(): string {
  const baseUrl = getAppUrl();
  return `${baseUrl}/api/r2`;
}
```

#### 環境判定の改善

```typescript
// src/lib/config/environment.ts
export type Environment = "production" | "staging" | "development" | "mock";

export function getEnvironment(): Environment {
  const env = process.env.NEXT_PUBLIC_ENV;

  if (
    env === "production" ||
    env === "staging" ||
    env === "development" ||
    env === "mock"
  ) {
    return env;
  }

  // デフォルトは本番環境
  return "production";
}

export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

export function isProduction(): boolean {
  return getEnvironment() === "production";
}

export function isMock(): boolean {
  return getEnvironment() === "mock";
}
```

### 5. セキュリティ設定

#### 開発環境でのアクセス制限

```typescript
// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const environment = process.env.NEXT_PUBLIC_ENV;

  // 開発環境でのアクセス制限（必要に応じて）
  if (environment === "development" && pathname.startsWith("/admin")) {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
```

#### CORS 設定の更新

```typescript
// src/app/api/cors/route.ts
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  const environment = process.env.NEXT_PUBLIC_ENV;

  const allowedOrigins = [
    "https://stats47.com",
    "https://www.stats47.com",
    "https://staging.stats47.com",
    "https://dev.stats47.com",
  ];

  // 開発環境ではlocalhostも許可
  if (environment === "development") {
    allowedOrigins.push("http://localhost:3000", "http://localhost:3001");
  }

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

### 6. デプロイスクリプトの作成

#### 開発環境デプロイスクリプト

```bash
#!/bin/bash
# scripts/deploy-dev.sh

echo "🚀 Deploying to development environment..."

# 環境変数の確認
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN is not set"
  exit 1
fi

# ビルド
echo "📦 Building application..."
npm run build

# デプロイ
echo "☁️ Deploying to Cloudflare Pages..."
npx wrangler pages deploy .next --project-name=stats47-dev

echo "✅ Deployment completed!"
echo "🌐 Development URL: https://dev.stats47.com"
```

#### package.json の更新

```json
{
  "scripts": {
    "deploy:dev": "bash scripts/deploy-dev.sh",
    "deploy:staging": "bash scripts/deploy-staging.sh",
    "deploy:production": "bash scripts/deploy-production.sh"
  }
}
```

### 7. 監視・ログ設定

#### 開発環境でのログ設定

```typescript
// src/lib/logging/development.ts
export function logDevelopment(message: string, data?: any) {
  if (process.env.NEXT_PUBLIC_ENV === "development") {
    console.log(`[DEV] ${message}`, data);
  }
}

export function logApiCall(endpoint: string, method: string, status: number) {
  logDevelopment(`API Call: ${method} ${endpoint} - ${status}`);
}
```

#### エラーレポートの設定

```typescript
// src/lib/error-reporting/development.ts
export function reportDevelopmentError(error: Error, context?: any) {
  if (process.env.NEXT_PUBLIC_ENV === "development") {
    console.error("[DEV ERROR]", error, context);

    // 開発環境では詳細なエラー情報を表示
    if (typeof window !== "undefined") {
      console.group("Development Error Details");
      console.error("Error:", error);
      console.error("Context:", context);
      console.error("Stack:", error.stack);
      console.groupEnd();
    }
  }
}
```

## 使用方法

### 1. 初回セットアップ

```bash
# 1. 開発環境用のプロジェクトを作成
npx wrangler pages project create stats47-dev

# 2. カスタムドメインを設定
npx wrangler pages domain add dev.stats47.com --project-name=stats47-dev

# 3. 環境変数を設定（Cloudflareダッシュボードで）
# NEXT_PUBLIC_ENV=development
# NODE_ENV=development
# NEXT_PUBLIC_APP_URL=https://dev.stats47.com

# 4. デプロイ
npm run deploy:dev
```

### 2. 日常的な開発フロー

```bash
# 開発サーバー起動（ローカル）
npm run dev:api

# 開発環境にデプロイ
npm run deploy:dev

# 本番環境にデプロイ
npm run deploy:production
```

### 3. チームでの共有

開発環境の URL をチームメンバーと共有：

- **開発環境**: https://dev.stats47.com
- **ステージング環境**: https://staging.stats47.com
- **本番環境**: https://stats47.com

## トラブルシューティング

### よくある問題

1. **デプロイエラー**

   - Cloudflare API トークンの確認
   - プロジェクト名の確認

2. **カスタムドメインが反映されない**

   - DNS 設定の確認
   - プロパゲーション待ち（最大 24 時間）

3. **環境変数が反映されない**
   - Cloudflare Pages ダッシュボードでの設定確認
   - 再デプロイの実行

### デバッグコマンド

```bash
# プロジェクト一覧の確認
npx wrangler pages project list

# デプロイ履歴の確認
npx wrangler pages deployment list --project-name=stats47-dev

# ログの確認
npx wrangler pages deployment tail --project-name=stats47-dev
```

## まとめ

パブリック開発 URL の設定により、以下のメリットが得られます：

1. **チーム協力の向上**: チームメンバーが開発中のアプリを確認可能
2. **ステークホルダーとの共有**: クライアントや関係者との進捗共有
3. **テスト環境の提供**: 本番環境に影響を与えずにテスト可能
4. **継続的デプロイ**: 自動デプロイによる効率的な開発フロー

この設定により、開発環境でのパブリックアクセスが可能になり、より効率的な開発プロセスを実現できます。

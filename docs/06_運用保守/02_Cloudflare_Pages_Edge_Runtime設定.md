---
title: Cloudflare Pages Edge Runtime設定ガイド
created: 2025-01-27
updated: 2025-01-27
tags:
  - deployment
  - cloudflare
  - edge-runtime
  - next.js
  - configuration
---

# Cloudflare Pages Edge Runtime設定ガイド

## 概要

このドキュメントは、stats47プロジェクトをCloudflare Pagesにデプロイする際の設定について説明します。

現在、このプロジェクトは`@cloudflare/next-on-pages`を使用してデプロイしています。これにより、Edge Runtimeの制約を回避し、より柔軟なデプロイが可能になります。

**注意**: 以前は各ページに`export const runtime = "edge";`を追加する必要がありましたが、`@cloudflare/next-on-pages`を使用することで、この設定は不要になりました。

## 1. Edge Runtimeとは

Edge Runtimeは、Cloudflareのグローバルネットワーク上でコードを実行する軽量なJavaScriptランタイムです。

### 主な特徴

- **グローバル配信**: 200以上のデータセンターで実行
- **低レイテンシ**: ユーザーに近い場所での処理
- **スケーラビリティ**: 自動的にスケール
- **制限**: Node.js APIの一部が使用不可

### Edge Runtimeで使用できない機能

- Node.jsネイティブモジュール（`bcrypt`、`fs`など）
- `process.env`の一部の読み取り方法
- ファイルシステムへの直接アクセス
- 長時間実行される処理
- `"use cache"`ディレクティブ（Server Actions内）
- `experimental.useCache`フラグ

## 2. @cloudflare/next-on-pagesを使用したデプロイ

### 2.1 パッケージのインストール

```bash
npm install --save-dev @cloudflare/next-on-pages
```

### 2.2 ビルドスクリプトの設定

`package.json`に以下のスクリプトを追加：

```json
{
  "scripts": {
    "pages:build": "npx @cloudflare/next-on-pages@1",
    "pages:preview": "npm run pages:build && wrangler pages dev .vercel/output/static"
  }
}
```

### 2.3 ビルドとデプロイ

```bash
# ビルド
npm run pages:build

# ローカルプレビュー
npm run pages:preview

# Cloudflare Pagesにデプロイ
npx wrangler pages deploy .vercel/output/static
```

### 2.4 Windows環境での注意点

**Windows環境での問題**:

`@cloudflare/next-on-pages`は内部的にbashスクリプトを実行するため、Windows環境で実行する場合、bashが利用可能である必要があります。

**エラーメッセージ例**:
```
Error: spawn bash ENOENT
```

**解決方法**:

1. **Git Bashを使用**:
   - Git for Windowsをインストールして、Git BashをPATHに追加
   - または、Git Bashターミナルでコマンドを実行

2. **WSLを使用**:
   - Windows Subsystem for Linux (WSL)をインストール
   - WSL環境でコマンドを実行

3. **CI環境でビルド**:
   - GitHub ActionsなどのCI環境（Linux）でビルドを実行
   - ローカルでは開発用の`npm run dev`を使用

**非推奨警告について**:

`@cloudflare/next-on-pages`は非推奨になっていますが、現在のバージョン（1.13.16）は動作します。将来的にはOpenNext adapterへの移行を検討してください。

**参考**: [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)

## 3. 必要な設定

### 3.1 Next.js設定（`next.config.ts`）

`@cloudflare/next-on-pages`を使用する場合、`output: 'export'`は不要です。`experimental.useCache`は無効化のまま維持します。

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@/infrastructure/mock-data"],
    // Edge Runtimeと互換性がないため、useCacheを無効化
    // useCache: true, // コメントアウトまたは削除
  },
};
```

**理由**: `experimental.useCache`はNext.jsのキャッシュ機能ですが、Edge Runtimeではサポートされていません。

### 2.2 ページとAPIルートの設定

すべてのページ（`page.tsx`）とAPIルート（`route.ts`）に`export const runtime = "edge";`を追加する必要があります。

#### ページファイルの例

```typescript
// src/app/(public)/blog/page.tsx
import { Metadata } from "next";

export const runtime = "edge"; // ← 追加

export async function generateMetadata(): Promise<Metadata> {
  // ...
}
```

#### APIルートの例

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/features/auth/lib/auth";

export const runtime = "edge"; // ← 追加

export const { GET, POST } = handlers;
```

### 2.3 設定が必要なルート

以下のすべてのルートに`export const runtime = "edge";`を追加する必要があります：

#### 統計ページ
- `/[category]`
- `/[category]/[subcategory]`
- `/[category]/[subcategory]/dashboard`
- `/[category]/[subcategory]/dashboard/[areaCode]`
- `/[category]/[subcategory]/ranking`
- `/[category]/[subcategory]/ranking/[rankingKey]`

#### ブログページ
- `/blog`
- `/blog/[category]`
- `/blog/[category]/[slug]`
- `/blog/[category]/[slug]/[year]`
- `/blog/tags/[tag]`

#### 管理画面ページ
- `/admin`
- `/admin/blog`
- `/admin/categories`
- `/admin/dev-tools/estat-api/meta-info`
- `/admin/dev-tools/estat-api/ranking-mappings`
- `/admin/dev-tools/estat-api/stats-data`
- `/admin/dev-tools/estat-api/stats-list`
- `/admin/dev-tools/ranking-groups`
- `/admin/dev-tools/ranking-groups/new`
- `/admin/dev-tools/ranking-groups/[groupId]`
- `/admin/dev-tools/ranking-items`
- `/admin/dev-tools/ranking-items/[rankingKey]`

#### APIルート
- `/api/auth/[...nextauth]`
- `/api/auth/register`

## 3. 制約事項

### 3.1 `generateStaticParams`との互換性

Edge Runtimeと`generateStaticParams`は同時に使用できません。

**エラー例**:
```
Error: Page "/(public)/blog/[category]/[slug]/[year]/page" cannot use both 
`export const runtime = 'edge'` and export `generateStaticParams`.
```

**対処法**: `generateStaticParams`を削除し、動的レンダリングを使用します。

```typescript
// ❌ 使用不可
export const runtime = "edge";
export async function generateStaticParams() {
  // ...
}

// ✅ 正しい実装
export const runtime = "edge";
// generateStaticParams を削除
// 存在しないパラメータは、ページ内で notFound() を呼び出す
```

### 3.2 Node.jsネイティブモジュール

Edge Runtimeでは、Node.jsネイティブモジュール（`bcrypt`、`fs`など）が使用できません。

**問題のあるコード例**:
```typescript
// ❌ Edge Runtimeでは動作しない
import bcrypt from "bcryptjs";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const hash = await bcrypt.hash(password, 10); // エラー
}
```

**対処法**: Web Crypto APIや別の方法を使用する必要があります。

```typescript
// ✅ Web Crypto APIを使用
import { webcrypto } from "crypto";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  // Web Crypto APIを使用したハッシュ化
  // ...
}
```

## 4. ビルド時のエラー

### 4.1 Edge Runtime設定の不足

**エラー**:
```
ERROR: Failed to produce a Cloudflare Pages build from the project.
The following routes were not configured to run with the Edge Runtime:
  - /[category]/[subcategory]/dashboard/[areaCode]
  - /admin/blog
  ...
Please make sure that all your non-static routes export the following edge runtime route segment config:
  export const runtime = 'edge';
```

**対処法**: エラーメッセージに記載されているすべてのルートに`export const runtime = "edge";`を追加します。

### 4.2 `useCache`との競合

**エラー**:
```
Error: Route segment config "runtime" is not compatible with 
`nextConfig.experimental.useCache`. Please remove it.
```

**対処法**: `next.config.ts`の`experimental.useCache`を無効化します。

```typescript
// next.config.ts
experimental: {
  // useCache: true, // コメントアウトまたは削除
}
```

### 4.3 `generateStaticParams`との競合

**エラー**:
```
Error: Page "/(public)/blog/[category]/[slug]/[year]/page" cannot use both 
`export const runtime = 'edge'` and export `generateStaticParams`.
```

**対処法**: `generateStaticParams`を削除します。

### 4.4 `"use cache"`ディレクティブの制約

**問題**: Edge Runtimeでは`"use cache"`ディレクティブが使用できません。

**エラー**:
```
Error: "use cache" requires experimental.useCache to be enabled.
```

**対処法**: `"use cache"`ディレクティブを削除し、代替手段を使用します。

#### 代替手段

1. **`fetch`キャッシュ**: リポジトリ層で`fetch`を使用する場合
   ```typescript
   // ✅ 推奨: fetchキャッシュを使用
   const response = await fetch(url, {
     cache: "force-cache",
     next: { revalidate: 86400, tags: ["cache-tag"] },
   });
   ```

2. **`unstable_cache`**: 関数レベルのキャッシュが必要な場合
   ```typescript
   // ✅ 代替手段: unstable_cacheを使用
   import { unstable_cache } from "next/cache";
   
   const cachedData = await unstable_cache(
     async () => fetchData(),
     ["cache-key"],
     { revalidate: 86400, tags: ["cache-tag"] }
   )();
   ```

3. **`revalidateTag`**: キャッシュ無効化
   ```typescript
   // ✅ キャッシュ無効化
   import { revalidateTag } from "next/cache";
   
   revalidateTag("cache-tag");
   ```

**実装例**: 現在のプロジェクトでは、`fetch`キャッシュを使用しています。

```typescript
// src/features/area/repositories/area-repository.ts
const response = await fetch(`${R2_PUBLIC_URL}/area/prefectures.json`, {
  cache: isDevelopment() ? "no-store" : "force-cache",
  next: isDevelopment()
    ? undefined
    : { revalidate: 86400, tags: ["area-prefectures"] },
});
```

**関連ドキュメント**: [キャッシュ戦略](../../01_技術設計/04_インフラ設計/03_キャッシュ戦略.md#edge-runtimeでのキャッシュ制約)

## 5. デプロイ時の警告ログ抑制

### 5.1 問題

デプロイ時に、データベース接続エラーの警告ログが大量に表示される場合があります。

```
データベースからの取得に失敗、ファイルから読み込みます: 
Cloudflare D1 Databaseバインディング（STATS47_DB）が見つかりません。
```

これは正常な動作（ビルド時にはデータベースにアクセスできない）ですが、ログが冗長です。

### 5.2 解決策

production環境やビルド時には警告ログを出力しないようにします。

```typescript
// src/features/blog/services/article-service.ts

/**
 * 警告ログを出力するかどうかを判定
 * production環境やビルド時には警告を出力しない
 */
function shouldLogWarning(): boolean {
  const env = process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || "development";
  // production環境では警告を出力しない
  if (env === "production") {
    return false;
  }
  // ビルド時（NEXT_PHASEが設定されている場合）も警告を出力しない
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return false;
  }
  return true;
}

// 使用例
try {
  // データベースから取得を試みる
} catch (dbError) {
  // データベースからの取得に失敗した場合は、ファイルから読み込む
  if (shouldLogWarning()) {
    console.warn(
      `データベースからの取得に失敗、ファイルから読み込みます:`,
      dbError instanceof Error ? dbError.message : String(dbError)
    );
  }
}
```

## 6. チェックリスト

### デプロイ前の確認

- [ ] `next.config.ts`の`experimental.useCache`が無効化されている
- [ ] すべてのページファイルに`export const runtime = "edge";`が追加されている
- [ ] すべてのAPIルートに`export const runtime = "edge";`が追加されている
- [ ] `generateStaticParams`とEdge Runtimeが同時に使用されていない
- [ ] Node.jsネイティブモジュールが使用されていない
- [ ] ローカルでビルドが成功する（`npm run build:production`）

### ビルドエラーの確認

```bash
# ビルド実行
npm run build:production

# エラーメッセージを確認
# エラーが発生した場合は、エラーメッセージに記載されているルートを確認
```

## 7. トラブルシューティング

### 7.1 ビルドエラー: Edge Runtime設定の不足

**症状**: ビルド時に「Edge Runtime設定が必要」というエラーが表示される

**対処法**:
1. エラーメッセージに記載されているルートを確認
2. 各ルートの`page.tsx`または`route.ts`に`export const runtime = "edge";`を追加
3. ビルドを再実行

### 7.2 ビルドエラー: `useCache`との競合

**症状**: 「`runtime` is not compatible with `useCache`」というエラーが表示される

**対処法**:
1. `next.config.ts`を確認
2. `experimental.useCache`をコメントアウトまたは削除
3. ビルドを再実行

### 7.3 ビルドエラー: `generateStaticParams`との競合

**症状**: 「cannot use both `runtime = 'edge'` and `generateStaticParams`」というエラーが表示される

**対処法**:
1. `generateStaticParams`を使用しているページを特定
2. `generateStaticParams`を削除
3. 存在しないパラメータは、ページ内で`notFound()`を呼び出すように変更
4. ビルドを再実行

### 7.4 ランタイムエラー: Node.jsモジュールの使用

**症状**: デプロイ後、Edge RuntimeでNode.jsモジュールが使用できないというエラーが発生

**対処法**:
1. エラーログを確認して、使用されているNode.jsモジュールを特定
2. Edge Runtime互換の代替手段を検討
   - `bcrypt` → Web Crypto API
   - `fs` → R2ストレージまたはD1データベース
   - その他のNode.jsモジュール → Edge Runtime互換の代替手段

## 8. ベストプラクティス

### 8.1 設定の一元管理

すべてのページとAPIルートに`export const runtime = "edge";`を追加する際は、一貫性を保つことが重要です。

### 8.2 エラーハンドリング

Edge Runtimeでは、エラーハンドリングが重要です。データベース接続エラーなどのフォールバック処理を実装します。

```typescript
try {
  // データベースから取得を試みる
  const data = await getDataFromDB();
} catch (error) {
  // フォールバック: ファイルから読み込む
  const data = await getDataFromFile();
}
```

### 8.3 パフォーマンスの考慮

Edge Runtimeはグローバルに配信されるため、レスポンス時間を短縮する必要があります。

- 不要な処理を削減
- キャッシュを活用
- データの最小化

## 9. 関連ドキュメント

- [デプロイ・運用ガイド](./01_デプロイ運用ガイド.md) - デプロイ手順の詳細
- [データベーストラブルシューティング](./データベーストラブルシューティング.md) - データベース関連の問題解決
- [Next.js Edge Runtime 公式ドキュメント](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes) - Next.js公式ドキュメント

---

**作成日**: 2025年1月27日  
**最終更新日**: 2025年1月27日  
**バージョン**: 1.0


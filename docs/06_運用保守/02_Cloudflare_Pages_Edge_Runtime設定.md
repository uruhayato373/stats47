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

現在、このプロジェクトは**OpenNext Cloudflare Adapter**（`@opennextjs/cloudflare`）を使用してデプロイしています。これにより、Windows環境でのビルド問題を解決し、より安定したデプロイが可能になります。

**注意**: OpenNextはNext.jsアプリケーションをCloudflare Pagesに最適化してデプロイするためのツールです。既存のNext.js機能（App Router、Server Components等）と完全に互換性があります。

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

## 2. OpenNext Cloudflare Adapterを使用したデプロイ

### 2.1 パッケージのインストール

```bash
npm install --save-dev @opennextjs/cloudflare
```

**重要**: パッケージをインストールした後、`package-lock.json`を更新してコミットする必要があります。

```bash
# パッケージのインストール（package-lock.jsonも更新される）
npm install --save-dev @opennextjs/cloudflare

# package-lock.jsonをコミット
git add package.json package-lock.json
git commit -m "Add @opennextjs/cloudflare for Cloudflare Pages deployment"
```

Cloudflare Pagesのビルドでは`npm ci`が使用されるため、`package.json`と`package-lock.json`が同期している必要があります。

### 2.2 ビルドスクリプトの設定

`package.json`に以下のスクリプトを追加：

```json
{
  "scripts": {
    "pages:build": "next build && opennextjs-cloudflare build",
    "pages:preview": "opennextjs-cloudflare preview"
  }
}
```

### 2.3 Next.js設定の更新

`next.config.ts`に以下の設定を追加：

```typescript
const nextConfig: NextConfig = {
  output: "standalone", // OpenNextの要件
  // 既存の設定は維持
};
```

### 2.4 ビルドとデプロイ

```bash
# ビルド
npm run pages:build

# ローカルプレビュー
npm run pages:preview

# Cloudflare Pagesにデプロイ
npx wrangler pages deploy .open-next
```

### 2.5 Windows環境での動作

**OpenNextの利点**:

OpenNextはWindows環境でも正常に動作します。bashスクリプトへの依存がないため、Windows環境でのビルド問題が解決されます。

**参考**: [OpenNext Cloudflare Adapter](https://opennext.js.org/cloudflare)

## 3. 必要な設定

### 3.1 Next.js設定（`next.config.ts`）

OpenNextを使用する場合、`output: 'standalone'`を設定する必要があります。`experimental.useCache`は無効化のまま維持します。

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "standalone", // OpenNextの要件
  experimental: {
    optimizePackageImports: ["@/infrastructure/mock-data"],
    // Edge Runtimeと互換性がないため、useCacheを無効化
    // useCache: true, // コメントアウトまたは削除
  },
};
```

**理由**: 
- `output: "standalone"`はOpenNextがCloudflare Pagesにデプロイするために必要な設定です
- `experimental.useCache`はNext.jsのキャッシュ機能ですが、Edge Runtimeではサポートされていません

### 3.2 OpenNext設定ファイル（`open-next.config.ts`）

プロジェクトルートに`open-next.config.ts`を作成します：

```typescript
import { defineConfig } from "@opennextjs/cloudflare";

export default defineConfig({
  // Cloudflare Pages用の設定
  // D1/R2バインディングはwrangler.tomlで管理されるため、ここでは追加設定は不要
});
```

### 3.3 ページとAPIルートの設定

OpenNextを使用する場合、各ページやAPIルートに`export const runtime = "edge";`を追加する必要はありません。OpenNextが自動的に最適化します。

#### ページファイルの例

```typescript
// src/app/(public)/blog/page.tsx
import { Metadata } from "next";

// OpenNextを使用する場合、export const runtime = "edge";は不要
// OpenNextが自動的に最適化します

export async function generateMetadata(): Promise<Metadata> {
  // ...
}
```

#### APIルートの例

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/features/auth/lib/auth";

// OpenNextを使用する場合、export const runtime = "edge";は不要
// OpenNextが自動的に最適化します

export const { GET, POST } = handlers;
```

### 3.4 OpenNextの利点

OpenNextを使用することで、以下の利点があります：

- **自動最適化**: 各ページやAPIルートに`export const runtime = "edge";`を追加する必要がありません。OpenNextが自動的に最適化します
- **Windows環境対応**: bashスクリプトへの依存がないため、Windows環境でも正常に動作します
- **メンテナンス性**: より安定したデプロイツールであり、継続的なメンテナンスが行われています
- **設定の簡素化**: 複雑な設定が不要で、Next.jsアプリケーションをそのままデプロイできます

## 4. 制約事項

OpenNextを使用する場合でも、Cloudflare Edge Runtimeの制約は適用されます。

### 4.1 Node.jsネイティブモジュール

Edge Runtimeでは、Node.jsネイティブモジュール（`bcrypt`、`fs`など）が使用できません。

**問題のあるコード例**:
```typescript
// ❌ Edge Runtimeでは動作しない
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const hash = await bcrypt.hash(password, 10); // エラー
}
```

**対処法**: Web Crypto APIや別の方法を使用する必要があります。

```typescript
// ✅ Web Crypto APIを使用
import { webcrypto } from "crypto";

export async function POST(request: NextRequest) {
  // Web Crypto APIを使用したハッシュ化
  // ...
}
```

### 4.2 ファイルシステムアクセス

Edge Runtimeでは、ファイルシステムへの直接アクセスはできません。R2ストレージやD1データベースを使用してください。

## 5. ビルド時のエラー

### 5.1 OpenNextビルドエラー

**エラー例**:
```
Error: Failed to build with OpenNext
```

**対処法**: 
1. `next.config.ts`に`output: "standalone"`が設定されているか確認
2. `open-next.config.ts`が正しく設定されているか確認
3. 依存関係が正しくインストールされているか確認（`npm ci`）

### 5.2 デプロイパスのエラー

**エラー**:
```
Error: Directory .open-next not found
```

**対処法**: ビルドが正常に完了しているか確認してください。`npm run pages:build`を実行して、`.open-next`ディレクトリが生成されることを確認します。

### 5.3 `useCache`との競合

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

### 5.4 `"use cache"`ディレクティブの制約

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

- [ ] `next.config.ts`の`output: "standalone"`が設定されている
- [ ] `next.config.ts`の`experimental.useCache`が無効化されている
- [ ] `open-next.config.ts`が正しく設定されている
- [ ] `@opennextjs/cloudflare`がインストールされている
- [ ] Node.jsネイティブモジュールが使用されていない（Edge Runtime互換の代替手段を使用）
- [ ] ローカルでビルドが成功する（`npm run pages:build`）

### ビルドエラーの確認

```bash
# ビルド実行
npm run build:production

# エラーメッセージを確認
# エラーが発生した場合は、エラーメッセージに記載されているルートを確認
```

## 7. トラブルシューティング

### 7.1 ビルドエラー: OpenNextビルドの失敗

**症状**: `npm run pages:build`が失敗する

**対処法**:
1. `next.config.ts`に`output: "standalone"`が設定されているか確認
2. `open-next.config.ts`が正しく設定されているか確認
3. 依存関係が正しくインストールされているか確認（`npm ci`）
4. エラーログを確認して、具体的な問題を特定

### 7.2 ビルドエラー: `useCache`との競合

**症状**: 「`runtime` is not compatible with `useCache`」というエラーが表示される

**対処法**:
1. `next.config.ts`を確認
2. `experimental.useCache`をコメントアウトまたは削除
3. ビルドを再実行

### 7.4 ランタイムエラー: Node.jsモジュールの使用

**症状**: デプロイ後、Edge RuntimeでNode.jsモジュールが使用できないというエラーが発生

**対処法**:
1. エラーログを確認して、使用されているNode.jsモジュールを特定
2. Edge Runtime互換の代替手段を検討
   - `bcrypt` → Web Crypto API
   - `fs` → R2ストレージまたはD1データベース
   - その他のNode.jsモジュール → Edge Runtime互換の代替手段

## 8. ベストプラクティス

### 8.1 OpenNextの設定管理

OpenNextを使用する場合、各ページやAPIルートに`export const runtime = "edge";`を追加する必要はありません。OpenNextが自動的に最適化するため、設定の一元管理が不要です。

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
- [デプロイトラブルシューティングガイド](./03_デプロイトラブルシューティング.md) - デプロイ時の問題解決方法
- [データベーストラブルシューティング](./データベーストラブルシューティング.md) - データベース関連の問題解決
- [OpenNext Cloudflare Adapter 公式ドキュメント](https://opennext.js.org/cloudflare) - OpenNext公式ドキュメント
- [Next.js Edge Runtime 公式ドキュメント](https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes) - Next.js公式ドキュメント

---

**作成日**: 2025年1月27日  
**最終更新日**: 2025年1月27日  
**バージョン**: 2.0（OpenNext移行）


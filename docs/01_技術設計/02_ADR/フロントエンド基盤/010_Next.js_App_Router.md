---
title: Next.js App Router 採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - フロントエンド基盤
  - Next.js
  - App Router
---

# Next.js App Router 採用理由

## ステータス
accepted

## 背景

stats47 プロジェクトでは、以下の要件を満たすフロントエンドフレームワークが必要でした：

1. **SSR/SSG/ISR**: 柔軟なレンダリング戦略の使い分け
2. **SEO最適化**: 統計データの検索エンジン最適化
3. **パフォーマンス**: 高速なページロードとユーザー体験
4. **開発効率**: モダンな開発体験とツールチェーン
5. **型安全性**: TypeScriptとの完全統合

## 決定

**Next.js 15 (App Router)** を採用

## 理由

### 1. 柔軟なレンダリング戦略
- **SSR**: 動的コンテンツのサーバーサイドレンダリング
- **SSG**: 静的コンテンツの事前生成
- **ISR**: インクリメンタル静的再生成
- **CSR**: クライアントサイドレンダリング

### 2. App Routerの優位性
- **最新のルーティング**: ファイルベースルーティングの進化版
- **Server Components**: サーバーサイドでのコンポーネント実行
- **Streaming**: 段階的なコンテンツ配信
- **Suspense**: 非同期コンポーネントの制御

### 3. パフォーマンス最適化
- **自動最適化**: 画像、フォント、スクリプトの自動最適化
- **バンドル分割**: ページ単位でのコード分割
- **プリフェッチ**: リンクの自動プリフェッチ
- **Turbopack**: Rustベースの高速ビルド

### 4. SEOとアクセシビリティ
- **メタデータAPI**: 動的なメタデータ生成
- **構造化データ**: 統計データの構造化マークアップ
- **アクセシビリティ**: 自動的なアクセシビリティ最適化

## 使用箇所

### 1. ページルーティング
```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <Dashboard />;
}

// app/statistics/[category]/page.tsx
export default function CategoryPage({ params }: { params: { category: string } }) {
  return <CategoryStatistics category={params.category} />;
}
```

### 2. Server Components
```typescript
// app/statistics/page.tsx
import { getStatisticsData } from '@/infrastructure/statistics';

export default async function StatisticsPage() {
  const data = await getStatisticsData();
  return <StatisticsList data={data} />;
}
```

### 3. メタデータ生成
```typescript
// app/statistics/[category]/page.tsx
export async function generateMetadata({ params }: { params: { category: string } }) {
  return {
    title: `${params.category}の統計データ`,
    description: `${params.category}に関する統計データを表示します`,
  };
}
```

### 4. API Routes
```typescript
// app/api/statistics/route.ts
export async function GET(request: Request) {
  const data = await fetchStatisticsData();
  return Response.json(data);
}
```

## 代替案の検討

### Create React App (CRA)
**メリット:**
- シンプルなセットアップ
- 学習コストが低い

**デメリット:**
- SSR/SSG機能なし
- SEO最適化が困難
- パフォーマンス最適化が限定的

**結論:** SEO要件を満たせないため不採用

### Vite + React
**メリット:**
- 高速な開発サーバー
- 軽量

**デメリット:**
- SSR機能が限定的
- SEO最適化が困難
- 追加の設定が必要

**結論:** 機能要件を満たせないため不採用

### Remix
**メリット:**
- 優れたデータローディング
- 型安全性

**デメリット:**
- エコシステムが限定的
- 学習コストが高い
- 採用実績が少ない

**結論:** エコシステムと採用実績を考慮し不採用

## 結果

この決定により以下の効果が期待されます：

### 1. SEO最適化の実現
- 統計データの検索エンジン最適化
- 構造化データの自動生成
- メタデータの動的生成

### 2. パフォーマンスの向上
- 高速なページロード
- 効率的なバンドル分割
- 自動的な最適化

### 3. 開発効率の向上
- 型安全な開発
- 豊富なエコシステム
- 統合されたツールチェーン

### 4. スケーラビリティの確保
- 大規模アプリケーションへの対応
- マイクロフロントエンド対応
- 将来の機能拡張

## 実装方針

### 1. App Routerの活用
- Server Componentsの積極的な使用
- Client Componentsの適切な使い分け
- Suspenseによる非同期処理の制御

### 2. パフォーマンス最適化
- 画像最適化の活用
- フォント最適化の実装
- バンドルサイズの監視

### 3. SEO最適化
- メタデータAPIの活用
- 構造化データの実装
- サイトマップの自動生成

## 参考資料

- [Next.js公式ドキュメント](https://nextjs.org/docs)
- [App Router](https://nextjs.org/docs/app)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

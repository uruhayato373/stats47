---
title: ページレベルのローディング管理戦略
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/visualization
  - implementation
  - loading
  - ux
---

# ページレベルのローディング管理戦略

## 概要

現在、`EstatMetaInfoSidebar`などのコンポーネントごとにローディング状態を管理していますが、ページレベルで統一的なローディング表示を行うことで、より良いユーザー体験を提供できます。

このドキュメントでは、Next.js 15 + React 19の環境で、ページレベルの共通ローディングを実装する複数の方法を解説します。

---

## 現在の実装状況

### コンポーネントレベルのローディング管理

```tsx
// src/components/organisms/estat-api/EstatMetaInfoSidebar/EstatMetaInfoSidebar.tsx
export function EstatMetaInfoSidebar() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Spinner />;
  }

  return <div>{/* コンポーネント内容 */}</div>;
}
```

**問題点:**
- 各コンポーネントが独立してローディング状態を表示
- ページ全体として統一感がない
- 複数のスピナーが同時に表示される

---

## 実装パターン

### パターン1: Suspenseを使った実装（推奨）

Next.js 15 + React 19では、Suspenseを使った実装が最も推奨されます。

#### メリット
- React標準機能で実装が簡潔
- Server Componentとの親和性が高い
- コード分割との統合が容易
- エラーバウンダリーとの組み合わせが可能

#### 実装例

##### 1. ページレベルの実装

```tsx
// src/app/estat-api/meta-info/page.tsx
import { Suspense } from 'react';
import { EstatMetainfoPage } from '@/components/pages/EstatMetainfoPage';
import { EstatMetaInfoRepository } from '@/infrastructure/database/estat/repositories';
import { PageLoadingFallback } from '@/components/loading/PageLoadingFallback';

export default async function EstatMetadataPage() {
  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <EstatMetadataPageContent />
    </Suspense>
  );
}

// 実際のデータ取得を行うコンポーネント
async function EstatMetadataPageContent() {
  const repository = await EstatMetaInfoRepository.create();
  const savedStatsList = await repository.getStatsList({
    limit: 50,
    orderBy: 'updated_at',
    orderDirection: 'DESC',
  });

  return <EstatMetainfoPage savedStatsList={savedStatsList} />;
}
```

##### 2. 複数コンポーネントの段階的表示

```tsx
// src/app/estat-api/meta-info/page.tsx
import { Suspense } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { EstatMetaInfoSidebar } from '@/components/organisms/estat-api/EstatMetaInfoSidebar';
import { EstatMetaInfoContent } from '@/components/organisms/estat-api/EstatMetaInfoContent';
import { SkeletonSidebar } from '@/components/loading/SkeletonSidebar';
import { SkeletonContent } from '@/components/loading/SkeletonContent';

export default async function EstatMetadataPage() {
  return (
    <div className="min-h-screen">
      {/* ヘッダーは即座に表示 */}
      <PageHeader title="e-Stat メタ情報" />

      <div className="flex">
        {/* サイドバー: 独立してローディング */}
        <Suspense fallback={<SkeletonSidebar />}>
          <EstatMetaInfoSidebarAsync />
        </Suspense>

        {/* メインコンテンツ: 独立してローディング */}
        <Suspense fallback={<SkeletonContent />}>
          <EstatMetaInfoContentAsync />
        </Suspense>
      </div>
    </div>
  );
}

// 非同期コンポーネント
async function EstatMetaInfoSidebarAsync() {
  const repository = await EstatMetaInfoRepository.create();
  const stats = await repository.getStatsList({ limit: 10 });
  return <EstatMetaInfoSidebar stats={stats} />;
}

async function EstatMetaInfoContentAsync() {
  const repository = await EstatMetaInfoRepository.create();
  const data = await repository.getMetaInfoUnique({ limit: 50 });
  return <EstatMetaInfoContent data={data} />;
}
```

##### 3. 全体ローディングの実装

すべてのコンポーネントが読み込まれるまで共通ローディングを表示：

```tsx
// src/app/estat-api/meta-info/page.tsx
import { Suspense } from 'react';
import { PageLoadingOverlay } from '@/components/loading/PageLoadingOverlay';

export default async function EstatMetadataPage() {
  return (
    <Suspense fallback={<PageLoadingOverlay message="データを読み込んでいます..." />}>
      <EstatMetadataPageContent />
    </Suspense>
  );
}

async function EstatMetadataPageContent() {
  // すべてのデータを並列で取得
  const [stats, metaInfo, rankings] = await Promise.all([
    fetchStats(),
    fetchMetaInfo(),
    fetchRankings(),
  ]);

  return (
    <div className="page-container">
      <Sidebar stats={stats} />
      <MainContent metaInfo={metaInfo} />
      <RankingPanel rankings={rankings} />
    </div>
  );
}
```

##### 4. ローディングFallbackコンポーネント

```tsx
// src/components/loading/PageLoadingOverlay.tsx
export function PageLoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        {message && (
          <p className="mt-4 text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}
```

```tsx
// src/components/loading/SkeletonSidebar.tsx
export function SkeletonSidebar() {
  return (
    <div className="w-64 p-4 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      <div className="space-y-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  );
}
```

---

### パターン2: loading.tsx を使った実装

Next.js App Routerの`loading.tsx`を使用する方法。

#### メリット
- ファイルベースで設定が簡単
- ルートセグメント全体に適用される
- 自動的にSuspenseでラップされる

#### 実装例

```tsx
// src/app/estat-api/meta-info/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">データを読み込んでいます...</p>
      </div>
    </div>
  );
}
```

```tsx
// src/app/estat-api/meta-info/page.tsx
// loading.tsxが自動的に適用される
export default async function EstatMetadataPage() {
  const repository = await EstatMetaInfoRepository.create();
  const data = await repository.getStatsList();

  return <EstatMetainfoPage savedStatsList={data} />;
}
```

---

### パターン3: Context APIでのローディング管理

クライアントサイドで複雑なローディング制御が必要な場合。

#### メリット
- 細かいローディング制御が可能
- 複数コンポーネント間での状態共有
- 条件付きローディングの実装が容易

#### 実装例

```tsx
// src/contexts/PageLoadingContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PageLoadingContextType {
  isLoading: boolean;
  loadingTasks: Set<string>;
  startLoading: (taskId: string) => void;
  finishLoading: (taskId: string) => void;
}

const PageLoadingContext = createContext<PageLoadingContextType | undefined>(undefined);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set());

  const startLoading = useCallback((taskId: string) => {
    setLoadingTasks((prev) => new Set(prev).add(taskId));
  }, []);

  const finishLoading = useCallback((taskId: string) => {
    setLoadingTasks((prev) => {
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const isLoading = loadingTasks.size > 0;

  return (
    <PageLoadingContext.Provider
      value={{ isLoading, loadingTasks, startLoading, finishLoading }}
    >
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  const context = useContext(PageLoadingContext);
  if (!context) {
    throw new Error('usePageLoading must be used within PageLoadingProvider');
  }
  return context;
}
```

```tsx
// src/components/layout/PageLoadingOverlay.tsx
'use client';

import { usePageLoading } from '@/contexts/PageLoadingContext';

export function PageLoadingOverlay() {
  const { isLoading } = usePageLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-700 dark:text-gray-300">読み込み中...</p>
      </div>
    </div>
  );
}
```

```tsx
// src/components/organisms/estat-api/EstatMetaInfoSidebar/EstatMetaInfoSidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePageLoading } from '@/contexts/PageLoadingContext';

export function EstatMetaInfoSidebar() {
  const [data, setData] = useState(null);
  const { startLoading, finishLoading } = usePageLoading();

  useEffect(() => {
    const taskId = 'sidebar-data';
    startLoading(taskId);

    fetchData()
      .then((result) => setData(result))
      .finally(() => finishLoading(taskId));
  }, [startLoading, finishLoading]);

  return <div>{/* コンテンツ */}</div>;
}
```

```tsx
// src/app/estat-api/meta-info/layout.tsx
import { PageLoadingProvider } from '@/contexts/PageLoadingContext';
import { PageLoadingOverlay } from '@/components/layout/PageLoadingOverlay';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PageLoadingProvider>
      <PageLoadingOverlay />
      {children}
    </PageLoadingProvider>
  );
}
```

---

### パターン4: カスタムフックでのローディング管理

シンプルなページで使用できる軽量な実装。

#### 実装例

```tsx
// src/hooks/usePageLoading.ts
'use client';

import { useState, useEffect, useRef } from 'react';

export function usePageLoading() {
  const [loadingCount, setLoadingCount] = useState(0);
  const loadingTasks = useRef(new Set<string>());

  const startLoading = (taskId: string) => {
    if (!loadingTasks.current.has(taskId)) {
      loadingTasks.current.add(taskId);
      setLoadingCount((prev) => prev + 1);
    }
  };

  const finishLoading = (taskId: string) => {
    if (loadingTasks.current.has(taskId)) {
      loadingTasks.current.delete(taskId);
      setLoadingCount((prev) => prev - 1);
    }
  };

  return {
    isLoading: loadingCount > 0,
    startLoading,
    finishLoading,
  };
}
```

```tsx
// src/app/estat-api/meta-info/ClientPage.tsx
'use client';

import { usePageLoading } from '@/hooks/usePageLoading';
import { EstatMetaInfoSidebar } from '@/components/organisms/estat-api/EstatMetaInfoSidebar';
import { EstatMetaInfoContent } from '@/components/organisms/estat-api/EstatMetaInfoContent';

export function ClientPage() {
  const { isLoading, startLoading, finishLoading } = usePageLoading();

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="mt-4">読み込み中...</p>
          </div>
        </div>
      )}

      <div className="flex">
        <EstatMetaInfoSidebar
          onLoadStart={() => startLoading('sidebar')}
          onLoadEnd={() => finishLoading('sidebar')}
        />
        <EstatMetaInfoContent
          onLoadStart={() => startLoading('content')}
          onLoadEnd={() => finishLoading('content')}
        />
      </div>
    </>
  );
}
```

---

## 実装比較表

| パターン | 複雑度 | Server Component対応 | 細かい制御 | パフォーマンス | 推奨度 |
|---------|--------|---------------------|----------|---------------|--------|
| Suspense | 低 | ✅ | △ | ⭐⭐⭐ | ⭐⭐⭐ |
| loading.tsx | 低 | ✅ | △ | ⭐⭐⭐ | ⭐⭐⭐ |
| Context API | 中 | ❌ | ✅ | ⭐⭐ | ⭐⭐ |
| Custom Hook | 低 | ❌ | △ | ⭐⭐ | ⭐ |

---

## 推奨実装パターン

### シナリオ別の推奨

#### 1. Server Componentでシンプルに実装したい
→ **loading.tsx** を使用

```tsx
// src/app/estat-api/meta-info/loading.tsx
export default function Loading() {
  return <PageLoadingFallback />;
}
```

#### 2. 部分的に段階表示したい
→ **Suspense** を使用

```tsx
<Suspense fallback={<SkeletonSidebar />}>
  <SidebarAsync />
</Suspense>
<Suspense fallback={<SkeletonContent />}>
  <ContentAsync />
</Suspense>
```

#### 3. すべてのコンポーネント読み込み完了まで待つ
→ **Suspense + Promise.all**

```tsx
async function PageContent() {
  const [sidebar, content] = await Promise.all([
    fetchSidebar(),
    fetchContent(),
  ]);
  return (
    <>
      <Sidebar data={sidebar} />
      <Content data={content} />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PageLoadingOverlay />}>
      <PageContent />
    </Suspense>
  );
}
```

#### 4. クライアントサイドで複雑な制御が必要
→ **Context API**

---

## 実装手順（推奨パターン）

### ステップ1: ローディングコンポーネントの作成

```bash
mkdir -p src/components/loading
```

```tsx
// src/components/loading/PageLoadingFallback.tsx
export function PageLoadingFallback({ message }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          {message || 'データを読み込んでいます...'}
        </p>
      </div>
    </div>
  );
}
```

### ステップ2: loading.tsxの追加

```tsx
// src/app/estat-api/meta-info/loading.tsx
import { PageLoadingFallback } from '@/components/loading/PageLoadingFallback';

export default function Loading() {
  return <PageLoadingFallback message="e-Statメタ情報を読み込んでいます..." />;
}
```

### ステップ3: 既存コンポーネントからローディング状態を削除

```tsx
// Before
export function EstatMetaInfoSidebar() {
  const [loading, setLoading] = useState(true);
  // ...
  if (loading) return <Spinner />;
}

// After (Server Component化)
export async function EstatMetaInfoSidebar() {
  const data = await fetchData();
  return <div>{/* コンテンツ */}</div>;
}
```

---

## パフォーマンス最適化

### 1. データの並列取得

```tsx
async function PageContent() {
  // ❌ 直列実行（遅い）
  const stats = await fetchStats();
  const metaInfo = await fetchMetaInfo();

  // ✅ 並列実行（速い）
  const [stats, metaInfo] = await Promise.all([
    fetchStats(),
    fetchMetaInfo(),
  ]);

  return <Page stats={stats} metaInfo={metaInfo} />;
}
```

### 2. ストリーミングSSR

```tsx
// すぐに表示する部分は外側に
export default function Page() {
  return (
    <div>
      <Header /> {/* 即座に表示 */}

      <Suspense fallback={<Skeleton />}>
        <AsyncContent /> {/* ストリーミングで表示 */}
      </Suspense>
    </div>
  );
}
```

### 3. キャッシュ戦略

```tsx
// fetch optionsでキャッシュを制御
async function fetchData() {
  const response = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }, // 1時間キャッシュ
  });
  return response.json();
}
```

---

## トラブルシューティング

### 問題1: ローディングが一瞬だけ表示される

**原因**: データがキャッシュされている

**解決策**:
```tsx
// 最小表示時間を設定
async function PageContent() {
  const [data] = await Promise.all([
    fetchData(),
    new Promise((resolve) => setTimeout(resolve, 500)), // 最小500ms
  ]);
  return <Content data={data} />;
}
```

### 問題2: Suspenseが動作しない

**原因**: コンポーネントがClient Componentになっている

**解決策**:
```tsx
// ❌ Client Component
'use client';
export async function MyComponent() { ... }

// ✅ Server Component
export async function MyComponent() { ... }
```

### 問題3: ネストしたSuspenseが複雑

**原因**: 過度なネスト

**解決策**:
```tsx
// Suspenseのネストは2-3レベルまでに抑える
<Suspense fallback={<PageLoading />}>
  <PageContent>
    <Suspense fallback={<SidebarSkeleton />}>
      <Sidebar />
    </Suspense>
  </PageContent>
</Suspense>
```

---

## ベストプラクティス

### ✅ DO

1. **Suspenseを積極的に使用**
   - React 19の標準機能
   - Server Componentと相性が良い

2. **意味のあるローディング表示**
   - スケルトンスクリーンを使用
   - 具体的なメッセージを表示

3. **段階的な表示**
   - 重要な情報は先に表示
   - 補助的な情報は後から読み込む

4. **パフォーマンス測定**
   - Core Web Vitalsを監視
   - ローディング時間を記録

### ❌ DON'T

1. **過度な全画面ローディング**
   - ユーザー体験を損なう
   - 可能な限り段階表示を使用

2. **不必要なローディング表示**
   - キャッシュされたデータでローディング表示
   - 即座に表示できる場合はローディングを省略

3. **複雑なローディング管理**
   - Context APIの乱用
   - 状態管理の複雑化

---

## まとめ

### 推奨アプローチ

**stats47プロジェクトでの推奨:**

1. **基本**: `loading.tsx` を使用
2. **段階表示が必要**: `Suspense` を使用
3. **全体ローディング**: `Suspense` + `Promise.all`

```tsx
// 推奨実装テンプレート
// src/app/[page]/loading.tsx
export default function Loading() {
  return <PageLoadingFallback />;
}

// src/app/[page]/page.tsx
export default async function Page() {
  const [data1, data2] = await Promise.all([
    fetchData1(),
    fetchData2(),
  ]);

  return <PageContent data1={data1} data2={data2} />;
}
```

### 次のステップ

1. **共通ローディングコンポーネントの作成**
2. **各ページへのloading.tsxの追加**
3. **既存のローディング状態を削除**
4. **パフォーマンス測定と最適化**

---

**作成者**: Claude Code
**最終更新**: 2025-01-18
**バージョン**: 1.0

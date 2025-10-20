---
title: データフェッチ戦略ガイド
created: 2025-10-16
updated: 2025-01-18
tags:
  - development-guide
  - data-fetching
  - swr
  - best-practices
  - useswr-optimized
---

# データフェッチ戦略ガイド

## 概要

stats47 プロジェクトにおけるデータフェッチ戦略を標準化し、useSWR を中心とした一貫性のあるアプローチを確立します。

> **🔄 e-Stat API useSWR 最適化完了** (2025-01-18)
>
> e-Stat API ドメインの主要 2 機能（stats-list と stats-data）で useSWR 最適化が完了し、65%のコード削減と大幅なパフォーマンス向上を実現しました。詳細は[e-Stat API useSWR 最適化実装ガイド](../02_domain/estat-api/implementation/useswr-optimization.md)を参照してください。

## 基本原則

### 1. データフェッチ手法の使い分け

| 手法              | 用途                                | 例                           |
| ----------------- | ----------------------------------- | ---------------------------- |
| **useSWR**        | GET 操作、ユーザーが見るデータ      | ランキングデータ、統計データ |
| **fetch**         | ミューテーション（POST/PUT/DELETE） | データ作成・更新・削除       |
| **Next.js fetch** | SSR/SSG、初期データ取得             | サーバーサイドでのデータ取得 |

### 2. パフォーマンス優先

- 自動キャッシュ・再検証
- 重複リクエストの排除
- 楽観的更新
- エラーリトライ

## useSWR 使用ガイドライン

### 基本パターン

```typescript
import useSWR from "swr";
import { fetcher } from "@/lib/swr/fetcher";

export function useCustomData(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `/api/data/${id}` : null, // nullでリクエストを無効化
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data: data?.data || [],
    error,
    isLoading,
    refetch: mutate,
  };
}
```

### カスタムフック作成パターン

#### 1. 基本的なデータ取得フック

```typescript
// src/hooks/useRankingData.ts
export function useRankingData(rankingKey?: string, timeCode?: string) {
  const key =
    rankingKey && timeCode
      ? `/api/rankings/data?rankingKey=${rankingKey}&timeCode=${timeCode}`
      : null;

  const { data, error, isLoading, mutate } = useSWR<{ data: FormattedValue[] }>(
    key,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    data: data?.data || [],
    error,
    isLoading,
    refetch: mutate,
  };
}
```

#### 2. 条件付きデータ取得フック

```typescript
// src/hooks/useConditionalData.ts
export function useConditionalData(condition: boolean, params: DataParams) {
  const key = condition ? `/api/data?${new URLSearchParams(params)}` : null;

  const { data, error, isLoading } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  return {
    data: data?.data || null,
    error,
    isLoading,
  };
}
```

#### 3. 複数データの並行取得フック

```typescript
// src/hooks/useMultipleData.ts
export function useMultipleData(ids: string[]) {
  const { data, error, isLoading } = useSWR(
    ids.length > 0 ? `/api/data/batch?ids=${ids.join(",")}` : null,
    fetcher
  );

  return {
    data: data?.data || [],
    error,
    isLoading,
  };
}
```

### キャッシュ戦略の設定

#### 1. データの種類別設定

```typescript
// 静的データ（年度一覧など）
const staticDataConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60000, // 1分
};

// 動的データ（ランキングデータなど）
const dynamicDataConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 30000, // 30秒
};

// リアルタイムデータ（通知など）
const realtimeDataConfig = {
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5秒
  refreshInterval: 10000, // 10秒ごとに自動更新
};
```

#### 2. グローバル設定

```typescript
// src/providers/JotaiProvider.tsx
<SWRConfig
  value={{
    fetcher,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 10000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    onError: (error, key) => {
      console.error("SWR Error:", { error, key });
    },
  }}
>
```

## e-Stat API useSWR 最適化の成果

### パフォーマンス改善

| コンポーネント        | Before     | After      | 削減率  |
| --------------------- | ---------- | ---------- | ------- |
| useStatsListSearch    | 437 行     | 150 行     | 65%     |
| EstatAPIStatsDataPage | 188 行     | 70 行      | 63%     |
| **合計**              | **625 行** | **220 行** | **65%** |

### 機能向上

- **自動キャッシュ管理**: 重複リクエストの自動排除
- **エラーハンドリング**: 統一されたエラー処理とリトライ
- **パフォーマンス**: useMemo による最適化
- **保守性**: ビジネスロジックとデータ取得の分離

### 実装例

#### stats-list（統計表リスト検索）

```typescript
// src/hooks/estat-api/useStatsListSearch.ts
export function useStatsListSearch() {
  const [searchOptions, setSearchOptions] = useState(null);

  const cacheKey = useMemo(() => {
    return searchOptions ? generateStatsListCacheKey(searchOptions) : null;
  }, [searchOptions]);

  const {
    data: searchResult,
    error,
    isLoading,
    mutate,
  } = useSWR(cacheKey, statsListFetcherWithErrorHandling, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 300000, // 5分間キャッシュ
    errorRetryCount: 3,
    errorRetryInterval: 5000,
  });

  const search = useCallback((options) => {
    setSearchOptions(options);
  }, []);

  return { searchResult, isLoading, error, search };
}
```

#### stats-data（統計データ取得）

```typescript
// src/hooks/estat-api/useEstatStatsData.ts
export function useEstatStatsData(params: GetStatsDataParams | null) {
  const cacheKey = useMemo(() => {
    return params ? generateStatsDataCacheKey(params) : null;
  }, [params]);

  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    statsDataFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return { data, error, isLoading, refetch: mutate };
}
```

詳細な実装については、[e-Stat API useSWR 最適化実装ガイド](../02_domain/estat-api/implementation/useswr-optimization.md)を参照してください。

### エラーハンドリング

#### 1. 統一的なエラーハンドリング

```typescript
// src/lib/swr/fetcher.ts
export interface FetchError extends Error {
  info?: any;
  status?: number;
}

export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error: FetchError = new Error(
      "An error occurred while fetching the data."
    );

    try {
      error.info = await response.json();
    } catch {
      error.info = { message: response.statusText };
    }

    error.status = response.status;
    throw error;
  }

  return response.json();
}
```

#### 2. コンポーネントでのエラーハンドリング

```typescript
// src/components/DataDisplay.tsx
export function DataDisplay() {
  const { data, error, isLoading } = useCustomData("123");

  if (error) {
    return (
      <ErrorView
        error={error}
        onRetry={() => mutate()} // リトライ機能
      />
    );
  }

  if (isLoading) {
    return <LoadingView />;
  }

  return <DataView data={data} />;
}
```

### 型定義のベストプラクティス

#### 1. API レスポンス型の定義

```typescript
// src/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

#### 2. SWR フックの型定義

```typescript
// src/hooks/useRankingData.ts
interface RankingDataResponse {
  data: FormattedValue[];
}

interface UseRankingDataReturn {
  data: FormattedValue[];
  error: FetchError | undefined;
  isLoading: boolean;
  refetch: () => void;
}

export function useRankingData(
  rankingKey?: string,
  timeCode?: string
): UseRankingDataReturn {
  // 実装
}
```

## fetch 使用ガイドライン

### ミューテーション操作

#### 1. データ作成

```typescript
// src/hooks/useRankingItemsEditor.ts
export async function createRankingItem(data: Omit<RankingItem, "id">) {
  const response = await fetch("/api/rankings/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create item");
  }

  return response.json();
}
```

#### 2. データ更新

```typescript
export async function updateRankingItem(
  id: number,
  data: Partial<RankingItem>
) {
  const response = await fetch(`/api/rankings/items/item/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update item");
  }

  return response.json();
}
```

#### 3. データ削除

```typescript
export async function deleteRankingItem(id: number) {
  const response = await fetch(`/api/rankings/items/item/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete item");
  }

  return response.json();
}
```

### フォーム送信

```typescript
// src/components/auth/RegisterForm.tsx
const handleSubmit = async (formData: FormData) => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Registration failed");
    }

    // 成功処理
    router.push("/dashboard");
  } catch (err) {
    setError(err instanceof Error ? err.message : "Unknown error");
  } finally {
    setLoading(false);
  }
};
```

## Next.js fetch 使用ガイドライン

### SSR/SSG での初期データ取得

```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  // サーバーサイドでデータを取得
  const initialData = await fetchRankingData();

  return <Dashboard initialData={initialData} />;
}

async function fetchRankingData() {
  const response = await fetch(`${process.env.API_URL}/api/rankings/data`, {
    next: { revalidate: 3600 }, // 1時間キャッシュ
  });

  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  return response.json();
}
```

### revalidate 設定

```typescript
// 静的データ（1時間）
const staticData = await fetch(url, {
  next: { revalidate: 3600 },
});

// 動的データ（30秒）
const dynamicData = await fetch(url, {
  next: { revalidate: 30 },
});

// 常に最新（ISR無効）
const freshData = await fetch(url, {
  cache: "no-store",
});
```

## 実装パターンとサンプルコード

### 1. mutate 関数の使用

```typescript
// 楽観的更新
const { data, mutate } = useSWR("/api/items", fetcher);

const handleUpdate = async (id: number, newData: Item) => {
  // 楽観的更新
  mutate(
    (currentData) =>
      currentData?.map((item) =>
        item.id === id ? { ...item, ...newData } : item
      ),
    false // 再検証しない
  );

  try {
    await updateItem(id, newData);
    // 成功時は再検証
    mutate();
  } catch (error) {
    // 失敗時は元に戻す
    mutate();
    throw error;
  }
};
```

### 2. エラーバウンダリーとの連携

```typescript
// src/components/ErrorBoundary.tsx
export function DataErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div>
          <h2>データの読み込みに失敗しました</h2>
          <p>{error.message}</p>
          <button onClick={resetError}>再試行</button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// 使用例
<DataErrorBoundary>
  <DataDisplay />
</DataErrorBoundary>;
```

### 3. ローディング状態の統一

```typescript
// src/components/common/LoadingStates.tsx
export function LoadingView() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">読み込み中...</span>
    </div>
  );
}

export function ErrorView({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <h3 className="text-lg font-medium text-red-600 mb-2">
        エラーが発生しました
      </h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        再試行
      </button>
    </div>
  );
}
```

## パフォーマンス最適化

### 1. 重複リクエストの排除

```typescript
// 同じキーで複数のコンポーネントがリクエストしても1回だけ実行
const { data } = useSWR("/api/data", fetcher, {
  dedupingInterval: 10000, // 10秒間は重複を排除
});
```

### 2. 条件付きリクエスト

```typescript
// 条件が満たされない場合はリクエストしない
const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
```

### 3. バックグラウンド更新

```typescript
const { data } = useSWR("/api/data", fetcher, {
  revalidateOnFocus: true, // フォーカス時に更新
  revalidateOnReconnect: true, // 再接続時に更新
  refreshInterval: 60000, // 1分ごとに自動更新
});
```

## デバッグと開発者体験

### 1. 開発環境でのログ

```typescript
// src/providers/JotaiProvider.tsx
<SWRConfig
  value={{
    onError: (error, key) => {
      if (process.env.NODE_ENV === "development") {
        console.error("SWR Error:", { error, key });
      }
    },
    onSuccess: (data, key) => {
      if (process.env.NODE_ENV === "development") {
        console.log("SWR Success:", { data, key });
      }
    },
  }}
>
```

### 2. カスタムフックのテスト

```typescript
// src/hooks/__tests__/useRankingData.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useRankingData } from "../useRankingData";

test("should fetch ranking data", async () => {
  const { result } = renderHook(() => useRankingData("test-key", "2023"));

  expect(result.current.isLoading).toBe(true);
  expect(result.current.data).toEqual([]);

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toHaveLength(10);
});
```

## まとめ

このガイドラインに従うことで、以下の効果が期待できます：

- **一貫性**: プロジェクト全体で統一されたデータフェッチ戦略
- **パフォーマンス**: 自動キャッシュと重複排除による最適化
- **開発体験**: 型安全性とエラーハンドリングの統一
- **保守性**: 明確なパターンとベストプラクティス

---

**最終更新**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み

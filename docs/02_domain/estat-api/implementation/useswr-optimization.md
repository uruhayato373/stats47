---
title: e-Stat API useSWR最適化実装ガイド
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - implementation
  - useswr-optimization
  - performance
---

# e-Stat API useSWR 最適化実装ガイド

## 概要

このドキュメントでは、e-Stat API ドメインの主要 2 機能（stats-list と stats-data）を useSWR で最適化した実装について詳しく説明します。手動の状態管理から useSWR による自動キャッシュ管理への移行により、大幅なコード削減とパフォーマンス向上を実現しました。

## 最適化の背景

### 課題

1. **コードの重複**: 手動の状態管理（useState、fetch、エラーハンドリング）が各コンポーネントで重複
2. **キャッシュの欠如**: 同じ検索条件での重複リクエストが発生
3. **エラーハンドリングの複雑さ**: 各コンポーネントで独自のリトライロジックを実装
4. **保守性の低下**: ビジネスロジックとデータ取得が密結合

### 解決策

useSWR を導入することで以下の問題を解決：

- **自動キャッシュ管理**: 重複リクエストの自動排除
- **統一されたエラーハンドリング**: 組み込みのリトライ機能を活用
- **コードの簡素化**: 手動状態管理の削除
- **パフォーマンス向上**: バックグラウンド更新と最適化

## 実装詳細

### Part A: stats-list（統計表リスト検索）の最適化

#### A1. キャッシュキー生成

**ファイル**: `src/lib/estat-api/stats-list/cache-key.ts`

```typescript
export function generateStatsListCacheKey(
  options: StatsListSearchOptions
): string | null {
  // オプションを正規化
  const normalized = normalizeSearchOptions(options);

  // クエリパラメータ形式でキーを生成
  const queryParams = new URLSearchParams();
  Object.keys(normalized)
    .sort()
    .forEach((key) => {
      const value = normalized[key as keyof StatsListSearchOptions];
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

  return `/api/estat-api/stats-list?${queryParams.toString()}`;
}
```

**特徴**:

- 検索オプションから一意のキャッシュキーを生成
- パラメータの正規化により一貫性を保証
- 空のオプションは null を返してリクエストを無効化

#### A2. SWR 用 fetcher 関数

**ファイル**: `src/lib/estat-api/stats-list/swr-fetcher.ts`

```typescript
export async function statsListFetcher(
  cacheKey: string
): Promise<StatsListSearchResult> {
  // キャッシュキーから検索オプションを復元
  const options = parseStatsListCacheKey(cacheKey);
  if (!options) {
    throw new Error(`Invalid cache key: ${cacheKey}`);
  }

  // 検索オプションに基づいて適切なメソッドを選択
  let response;
  if (options.searchWord) {
    response = await EstatStatsListFetcher.searchByKeyword(
      options.searchWord,
      options
    );
  } else if (options.statsCode) {
    response = await EstatStatsListFetcher.searchByStatsCode(
      options.statsCode,
      options
    );
  }
  // ... 他の検索タイプ

  // 結果をフォーマット
  return EstatStatsListFormatter.formatStatsListData(response);
}
```

**特徴**:

- キャッシュキーから検索オプションを復元
- 既存の EstatStatsListFetcher を再利用
- 統一されたエラーハンドリング

#### A3. useStatsListSearch の書き換え

**ファイル**: `src/hooks/estat-api/useStatsListSearch.ts`

**Before（手動状態管理）**:

```typescript
export function useStatsListSearch() {
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (options) => {
    setIsLoading(true);
    setError(null);
    try {
      // 手動fetch処理（約70行）
      const response = await EstatStatsListFetcher.searchByKeyword(/*...*/);
      const formatted = EstatStatsListFormatter.formatStatsListData(response);
      setSearchResult(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { searchResult, isLoading, error, search };
}
```

**After（useSWR 最適化）**:

```typescript
export function useStatsListSearch() {
  const [searchOptions, setSearchOptions] = useState(null);

  // キャッシュキー生成
  const cacheKey = useMemo(() => {
    return searchOptions ? generateStatsListCacheKey(searchOptions) : null;
  }, [searchOptions]);

  // useSWRでデータ取得
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

  // フィルタ・ソート処理をuseMemoで最適化
  const filteredAndSortedTables = useMemo(() => {
    if (!searchResult?.tables) return [];
    // フィルタ・ソート処理
    return processedTables;
  }, [searchResult, filters, sortConditions]);

  const search = useCallback((options) => {
    setSearchOptions(options);
  }, []);

  return { searchResult: finalSearchResult, isLoading, error, search };
}
```

**改善点**:

- **コード削減**: 437 行 → 150 行（65%削減）
- **自動キャッシュ**: 同じ検索条件での重複リクエストを自動排除
- **エラーハンドリング**: useSWR の組み込みリトライ機能を活用
- **パフォーマンス**: useMemo によるフィルタ・ソート処理の最適化

### Part B: stats-data（統計データ取得）の最適化

#### B1. キャッシュキー生成

**ファイル**: `src/lib/estat-api/stats-data/cache-key.ts`

```typescript
export function generateStatsDataCacheKey(
  params: GetStatsDataParams | null
): string | null {
  if (!params || !params.appId || !params.statsDataId) {
    return null;
  }

  const normalized = normalizeStatsDataParams(params);
  const queryParams = new URLSearchParams();

  Object.keys(normalized)
    .sort()
    .forEach((key) => {
      const value = normalized[key as keyof GetStatsDataParams];
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, String(value));
      }
    });

  return `/api/estat-api/stats-data?${queryParams.toString()}`;
}
```

#### B2. useEstatStatsData カスタムフック

**ファイル**: `src/hooks/estat-api/useEstatStatsData.ts`

```typescript
export function useEstatStatsData(
  params: GetStatsDataParams | null
): UseEstatStatsDataReturn {
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

  return {
    data: data || null,
    error: error ? "統計データの取得に失敗しました" : null,
    isLoading,
    refetch: mutate,
  };
}
```

#### B3. EstatAPIStatsDataPage のシンプル化

**ファイル**: `src/components/pages/EstatAPIStatsDataPage/EstatAPIStatsDataPage.tsx`

**Before（手動 fetch 処理）**:

```typescript
export default function EstatAPIStatsDataPage() {
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchData = async (params) => {
    setLoading(true);
    setError(null);
    try {
      // 手動fetch処理（約70行）
      const response = await fetch(`/api/estat-api/stats-data?${queryParams}`);
      const data = await response.json();
      setApiResponse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <EstatDataFetcher onSubmit={handleFetchData} loading={loading} />
      <EstatDataDisplay data={apiResponse} loading={loading} error={error} />
    </div>
  );
}
```

**After（useSWR 最適化）**:

```typescript
export default function EstatAPIStatsDataPage() {
  const [currentParams, setCurrentParams] = useState(null);
  const {
    data: apiResponse,
    error,
    isLoading: loading,
    refetch,
  } = useEstatStatsData(currentParams);

  const handleFetchData = (params) => {
    setCurrentParams(params);
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div>
      <EstatDataFetcher onSubmit={handleFetchData} loading={loading} />
      <EstatDataDisplay data={apiResponse} loading={loading} error={error} />
    </div>
  );
}
```

**改善点**:

- **コード削減**: 188 行 → 70 行（63%削減）
- **シンプル化**: 手動 fetch 処理を削除
- **自動管理**: useSWR による状態管理の自動化

## キャッシュ戦略

### 設定パラメータ

```typescript
const swrConfig = {
  revalidateOnFocus: false, // フォーカス時の再検証は無効
  revalidateOnReconnect: true, // ネットワーク再接続時は再取得
  dedupingInterval: 300000, // 5分間は同じリクエストを共有
  errorRetryCount: 3, // エラー時は3回までリトライ
  errorRetryInterval: 5000, // リトライ間隔は5秒
};
```

### キャッシュキー設計

1. **一意性**: 検索条件から一意のキーを生成
2. **正規化**: 空文字列や undefined を除去
3. **ソート**: キーの順序を統一して一意性を保証
4. **無効化**: 無効な条件では null を返してリクエストを無効化

### キャッシュの効果

- **重複排除**: 同じ条件での重複リクエストを自動排除
- **メモリ効率**: useSWR による効率的なメモリ管理
- **バックグラウンド更新**: ネットワーク再接続時の自動再取得

## パフォーマンス改善

### 1. コード削減

| コンポーネント        | Before     | After      | 削減率  |
| --------------------- | ---------- | ---------- | ------- |
| useStatsListSearch    | 437 行     | 150 行     | 65%     |
| EstatAPIStatsDataPage | 188 行     | 70 行      | 63%     |
| **合計**              | **625 行** | **220 行** | **65%** |

### 2. 機能向上

- **自動キャッシュ管理**: 重複リクエストの自動排除
- **エラーハンドリング**: 統一されたエラー処理とリトライ
- **パフォーマンス**: useMemo による最適化
- **保守性**: ビジネスロジックとデータ取得の分離

### 3. ユーザー体験向上

- **レスポンス時間**: キャッシュによる高速化
- **エラー回復**: 自動リトライによる安定性
- **データ鮮度**: バックグラウンド更新による最新データ

## 移行ガイド

### 既存コードからの移行

#### 1. useStatsListSearch の移行

**Before**:

```typescript
const { searchResult, isLoading, error, search } = useStatsListSearch();
```

**After**:

```typescript
// APIは同じ、内部実装のみ変更
const { searchResult, isLoading, error, search } = useStatsListSearch();
```

#### 2. 新しい useEstatStatsData の使用

**Before**:

```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchData = async (params) => {
  setLoading(true);
  try {
    const response = await fetch(`/api/estat-api/stats-data?${queryParams}`);
    const data = await response.json();
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

**After**:

```typescript
const [params, setParams] = useState(null);
const { data, error, isLoading, refetch } = useEstatStatsData(params);

const fetchData = (newParams) => {
  setParams(newParams);
};
```

### 下位互換性

- **既存 API**: 従来の EstatStatsListFetcher、EstatStatsDataFetcher は引き続き使用可能
- **型定義**: 既存の型定義は変更なし
- **コンポーネント**: 既存のコンポーネントは変更なし

## トラブルシューティング

### よくある問題

#### 1. キャッシュが更新されない

**原因**: キャッシュキーが正しく生成されていない

**解決策**:

```typescript
// デバッグログを確認
console.log("Cache Key:", generateStatsListCacheKey(options));

// パラメータの正規化を確認
const normalized = normalizeSearchOptions(options);
console.log("Normalized:", normalized);
```

#### 2. エラーが発生する

**原因**: fetcher 関数でのエラーハンドリング

**解決策**:

```typescript
// エラーログを確認
const { data, error } = useSWR(cacheKey, fetcher, {
  onError: (error) => {
    console.error("SWR Error:", error);
  },
});
```

#### 3. データが取得されない

**原因**: キャッシュキーが null

**解決策**:

```typescript
// パラメータが正しく設定されているか確認
const cacheKey = useMemo(() => {
  if (!params || !params.appId || !params.statsDataId) {
    return null; // リクエストを無効化
  }
  return generateStatsDataCacheKey(params);
}, [params]);
```

## ベストプラクティス

### 1. キャッシュキーの設計

- **一意性**: 同じ条件では必ず同じキーを生成
- **正規化**: 不要なパラメータは除去
- **ソート**: キーの順序を統一

### 2. エラーハンドリング

- **統一**: プロジェクト全体で統一されたエラーハンドリング
- **ログ**: 適切なログ出力でデバッグを容易に
- **リトライ**: useSWR の組み込みリトライ機能を活用

### 3. パフォーマンス

- **useMemo**: 重い計算は useMemo で最適化
- **条件付きレンダリング**: 不要な再レンダリングを防止
- **バッチ処理**: 複数の状態更新をバッチ処理

## 今後の拡張予定

1. **リアルタイム更新**: WebSocket によるリアルタイムデータ更新
2. **オフライン対応**: Service Worker によるオフラインキャッシュ
3. **高度なキャッシュ**: Redis 等によるサーバーサイドキャッシュ
4. **分析機能**: キャッシュヒット率の分析と最適化

## 関連ドキュメント

- [stats-list サブドメイン概要](../stats-list/overview.md)
- [stats-data サブドメイン概要](../stats-data/overview.md)
- [データフェッチング戦略](../../01_development_guide/data-fetching-strategy.md)
- [useSWR 公式ドキュメント](https://swr.vercel.app/)

---

**最終更新**: 2025 年 1 月 18 日  
**バージョン**: 1.0.0  
**作成者**: Stats47 開発チーム

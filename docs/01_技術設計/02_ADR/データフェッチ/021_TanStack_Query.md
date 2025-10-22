---
title: TanStack Query 採用理由
created: 2025-01-20
updated: 2025-01-20
tags:
  - ADR
  - データフェッチ
  - TanStack Query
---

# TanStack Query 採用理由

## ステータス
accepted

## 背景

stats47 プロジェクトでは、以下の要件を満たすデータフェッチライブラリが必要でした：

1. **高度なキャッシング**: 複雑なデータ関係の管理
2. **ミューテーション**: データの更新・削除操作
3. **楽観的更新**: UIの即座な更新
4. **バックグラウンド同期**: データの自動同期
5. **型安全性**: TypeScriptとの完全統合

## 決定

**TanStack Query (React Query)** を採用

## 理由

### 1. 高度なキャッシング機能
- **階層的キャッシュ**: 複雑なデータ関係の管理
- **依存関係キャッシュ**: 関連データの自動無効化
- **部分更新**: 必要な部分のみの更新
- **メモリ管理**: 効率的なメモリ使用

### 2. 強力なミューテーション機能
- **楽観的更新**: UIの即座な更新
- **ロールバック**: エラー時の自動復元
- **依存関係更新**: 関連クエリの自動更新
- **バッチ処理**: 複数の更新の一括処理

### 3. バックグラウンド同期
- **自動再取得**: データの自動更新
- **ネットワーク状態**: オフライン/オンライン対応
- **競合解決**: 同時更新の競合処理
- **ストレージ同期**: ローカルストレージとの統合

### 4. 開発者体験
- **DevTools**: 強力なデバッグツール
- **TypeScript統合**: 完全な型安全性
- **プラグインシステム**: 機能拡張
- **豊富な設定**: 細かい制御が可能

## 使用箇所

### 1. 基本的なクエリ
```typescript
import { useQuery } from '@tanstack/react-query';

function StatisticsList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => fetchStatisticsData(),
    staleTime: 5 * 60 * 1000, // 5分
    cacheTime: 10 * 60 * 1000, // 10分
  });
  
  if (isLoading) return <Loading />;
  if (error) return <Error />;
  
  return <StatisticsList data={data} />;
}
```

### 2. 依存関係のあるクエリ
```typescript
function CategoryStatistics({ categoryId }: { categoryId: string }) {
  const { data: category } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => fetchCategory(categoryId),
  });
  
  const { data: statistics } = useQuery({
    queryKey: ['statistics', categoryId],
    queryFn: () => fetchCategoryStatistics(categoryId),
    enabled: !!categoryId, // categoryIdが存在する場合のみ実行
  });
  
  return <CategoryData category={category} statistics={statistics} />;
}
```

### 3. ミューテーション
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateStatistics() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateStatistics,
    onMutate: async (newData) => {
      // 楽観的更新
      await queryClient.cancelQueries({ queryKey: ['statistics'] });
      const previousData = queryClient.getQueryData(['statistics']);
      queryClient.setQueryData(['statistics'], newData);
      return { previousData };
    },
    onError: (err, newData, context) => {
      // エラー時のロールバック
      queryClient.setQueryData(['statistics'], context?.previousData);
    },
    onSettled: () => {
      // 成功・失敗に関わらず実行
      queryClient.invalidateQueries({ queryKey: ['statistics'] });
    },
  });
}
```

### 4. 無限スクロール
```typescript
import { useInfiniteQuery } from '@tanstack/react-query';

function InfiniteStatisticsList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['statistics', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchStatisticsPage(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
  
  return (
    <div>
      {data?.pages.map((page, i) => (
        <StatisticsPage key={i} data={page.data} />
      ))}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()}>
          {isFetchingNextPage ? '読み込み中...' : 'さらに読み込む'}
        </button>
      )}
    </div>
  );
}
```

## 代替案の検討

### SWR
**メリット:**
- シンプルなAPI
- 軽量
- 学習コストが低い

**デメリット:**
- ミューテーション機能が限定的
- 複雑なデータ関係の管理が困難
- 楽観的更新の実装が複雑

**結論:** 高度な機能要件を考慮しTanStack Queryを採用

### Apollo Client
**メリット:**
- GraphQL特化
- 強力なキャッシング
- リアルタイム機能

**デメリット:**
- GraphQL専用
- バンドルサイズが大きい
- REST APIとの統合が困難

**結論:** REST APIを使用するため不採用

### Redux Toolkit Query
**メリット:**
- Redux統合
- 強力なキャッシング
- 型安全性

**デメリット:**
- Reduxの学習コスト
- 複雑な設定
- オーバーキル

**結論:** シンプルさを重視しTanStack Queryを採用

## 結果

この決定により以下の効果が期待されます：

### 1. 高度なデータ管理
- 複雑なデータ関係の効率的な管理
- 楽観的更新による優れたUX
- バックグラウンド同期の自動化

### 2. パフォーマンスの向上
- 効率的なキャッシング
- 不要なリクエストの削減
- メモリ使用量の最適化

### 3. 開発効率の向上
- 強力なDevTools
- 型安全なデータフェッチ
- 豊富な設定オプション

### 4. ユーザー体験の向上
- 即座なUI更新
- スムーズなデータ同期
- オフライン対応

## 実装方針

### 1. クエリキーの設計
- 階層的なキー構造
- 一貫した命名規則
- 依存関係の明確化

### 2. ミューテーション戦略
- 楽観的更新の実装
- エラーハンドリングの統一
- ロールバック機能の実装

### 3. キャッシュ戦略
- 適切なstaleTimeの設定
- 依存関係の管理
- メモリ使用量の監視

## 参考資料

- [TanStack Query公式ドキュメント](https://tanstack.com/query/latest)
- [TanStack Query TypeScript](https://tanstack.com/query/latest/docs/framework/react/guides/typescript)
- [TanStack Query DevTools](https://tanstack.com/query/latest/docs/framework/react/devtools)

---
title: データフェッチリファクタリング計画
created: 2025-10-16
updated: 2025-10-16
tags:
  - domain/architecture
  - refactoring
  - data-fetching
  - swr
---

# データフェッチリファクタリング計画

## 概要

stats47 プロジェクトのデータフェッチ戦略を統一し、useSWR を中心とした一貫性のあるアプローチに移行します。

## 現状分析

### データフェッチ手法の混在状況

#### ✅ SWR 使用箇所（6 ファイル）

- `src/hooks/ranking/useRankingData.ts` - ランキングデータ・年度取得
- `src/hooks/ranking/useEstatStatsData.ts` - e-Stat 統計データ取得
- `src/hooks/estat-api/useRankingKey.ts` - ランキングキー取得
- `src/hooks/ranking/useSavedMetadata.ts` - 保存済みメタデータ
- `src/hooks/ranking/useItemNames.ts` - アイテム名取得
- `src/hooks/estat-api/useMetadataList.ts` - メタデータリスト

#### 🔄 手動 fetch 使用箇所（主要 9 ファイル）

- `src/components/estat-api/stats-data/EstatAPIStatsDataPage.tsx` - useState + fetch
- `src/lib/ranking/ranking-items.ts` - Next.js fetch with revalidate
- `src/hooks/useRankingItemsEditor.ts` - POST/PUT/DELETE 操作
- `src/components/auth/RegisterForm.tsx` - フォーム送信
- `src/app/profile/edit/page.tsx` - プロフィール更新
- `src/app/admin/page.tsx` - 管理者ページ
- `src/hooks/ranking/useSavedMetadata.ts` - 保存済みメタデータ
- `src/hooks/ranking/useItemNames.ts` - アイテム名取得
- `src/hooks/estat-api/useMetadataList.ts` - メタデータリスト

### 問題点

1. **一貫性の欠如**: 同じようなデータ取得で異なる手法を使用
2. **重複実装**: エラーハンドリングとローディング管理が重複
3. **パフォーマンス**: キャッシュ戦略が統一されていない
4. **保守性**: コードの理解と修正が困難

## リファクタリング優先度

### 🔴 高優先度（即座に実行）

#### 1. EstatAPIStatsDataPage.tsx の SWR 化

**現状**:

```typescript
// useState + fetch + 手動エラーハンドリング
const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(
  null
);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleFetchData = async (params: GetStatsDataParams) => {
  setLoading(true);
  setError(null);
  // ... 複雑なfetch処理
};
```

**目標**:

```typescript
// useSWRによる簡潔な実装
const { data, error, isLoading } = useEstatStatsData(params);
```

**影響範囲**:

- `src/components/estat-api/stats-data/EstatAPIStatsDataPage.tsx`
- `src/hooks/ranking/useEstatStatsData.ts` (既存)

**作業時間**: 2-3 時間

#### 2. 重複したエラーハンドリングの統一

**現状**: 各コンポーネントで個別にエラーハンドリングを実装

**目標**: 統一的なエラーハンドリングパターンの適用

**対象ファイル**:

- `src/components/estat-api/stats-data/EstatAPIStatsDataPage.tsx`
- `src/components/dashboard/PopulationPyramid/EstatPopulationPyramid.tsx`
- `src/components/dashboard/LineChart/EstatLineChart.tsx`

**作業時間**: 1-2 時間

### 🟡 中優先度（1-2 週間以内）

#### 3. ローディング状態管理の統一

**現状**: 各コンポーネントで個別にローディング状態を管理

**目標**: 共通のローディングコンポーネントとパターンの使用

**対象ファイル**:

- 全データ表示コンポーネント
- 新規作成: `src/components/common/LoadingStates.tsx`

**作業時間**: 2-3 時間

#### 4. 型定義の統一

**現状**: API レスポンス型が散在

**目標**: 統一的な型定義の整備

**対象ファイル**:

- `src/types/api.ts` (新規作成)
- 既存の型定義ファイルの整理

**作業時間**: 1-2 時間

### 🟢 低優先度（現状維持）

#### 5. ミューテーション操作

**理由**: POST/PUT/DELETE 操作は fetch が適切

**対象ファイル**:

- `src/hooks/useRankingItemsEditor.ts`
- `src/components/auth/RegisterForm.tsx`
- `src/app/profile/edit/page.tsx`

#### 6. Next.js fetch 使用箇所

**理由**: SSR/SSG での初期データ取得は Next.js fetch が適切

**対象ファイル**:

- `src/lib/ranking/ranking-items.ts`
- サーバーサイドでのデータ取得

## 詳細実装計画

### Phase 1: 基盤整備（1 日）

#### 1.1 共通型定義の作成

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

export interface FetchError extends Error {
  info?: any;
  status?: number;
}
```

#### 1.2 共通コンポーネントの作成

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

#### 1.3 SWR ヘルパーの整備

```typescript
// src/lib/swr/hooks.ts
export function useApiData<T>(url: string | null, options?: SWRConfiguration) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
    errorRetryCount: 3,
    errorRetryInterval: 5000,
    ...options,
  });
}
```

### Phase 2: 高優先度リファクタリング（2-3 日）

#### 2.1 EstatAPIStatsDataPage.tsx の SWR 化

**Before**:

```typescript
export default function EstatAPIStatsDataPage({ initialData = null }) {
  const [apiResponse, setApiResponse] = useState<EstatStatsDataResponse | null>(
    initialData
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentParams, setCurrentParams] = useState<GetStatsDataParams | null>(
    null
  );

  const handleFetchData = async (params: GetStatsDataParams) => {
    setLoading(true);
    setError(null);
    setCurrentParams(params);
    // ... 複雑なfetch処理
  };
  // ... 複雑なUI実装
}
```

**After**:

```typescript
export default function EstatAPIStatsDataPage({ initialData = null }) {
  const [currentParams, setCurrentParams] = useState<GetStatsDataParams | null>(
    null
  );

  const { data, error, isLoading } = useEstatStatsData(currentParams, {
    fallbackData: initialData,
  });

  const handleFetchData = (params: GetStatsDataParams) => {
    setCurrentParams(params);
  };

  if (isLoading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => mutate()} />;

  return <EstatDataDisplay data={data} onFetchData={handleFetchData} />;
}
```

#### 2.2 エラーハンドリングの統一

**対象コンポーネント**:

- `EstatPopulationPyramid.tsx`
- `EstatLineChart.tsx`
- `StatisticsMetricCard.tsx`

**統一パターン**:

```typescript
// 各コンポーネントで統一
if (isLoading) return <LoadingView />;
if (error) return <ErrorView error={error} onRetry={refetch} />;
```

### Phase 3: 中優先度リファクタリング（1 週間）

#### 3.1 ローディング状態の統一

**対象**: 全データ表示コンポーネント

**作業内容**:

1. 個別のローディング実装を`LoadingView`に置き換え
2. エラー表示を`ErrorView`に置き換え
3. 一貫した UI/UX の提供

#### 3.2 型定義の整理

**作業内容**:

1. 散在する型定義を`src/types/api.ts`に集約
2. 既存の型定義ファイルの整理
3. 型の一貫性の確保

### Phase 4: 検証とテスト（1 日）

#### 4.1 機能テスト

**テスト項目**:

- データ取得の正常動作
- エラーハンドリングの動作
- ローディング状態の表示
- キャッシュの動作

#### 4.2 パフォーマンステスト

**測定項目**:

- 初回ロード時間
- キャッシュヒット率
- メモリ使用量
- ネットワークリクエスト数

## リファクタリング手順とチェックリスト

### 各ファイルのリファクタリング手順

#### 1. 現状分析

- [ ] 現在のデータフェッチ手法を確認
- [ ] エラーハンドリングパターンを確認
- [ ] ローディング状態管理を確認

#### 2. 設計

- [ ] SWR 化の可否を判断
- [ ] 新しいカスタムフックの設計
- [ ] 型定義の確認

#### 3. 実装

- [ ] カスタムフックの実装
- [ ] コンポーネントの更新
- [ ] 型定義の追加

#### 4. テスト

- [ ] 単体テストの実行
- [ ] 統合テストの実行
- [ ] 手動テストの実行

#### 5. レビュー

- [ ] コードレビューの実施
- [ ] パフォーマンスの確認
- [ ] ドキュメントの更新

### 品質チェックリスト

#### コード品質

- [ ] 型安全性が確保されている
- [ ] エラーハンドリングが統一されている
- [ ] ローディング状態が適切に管理されている
- [ ] キャッシュ戦略が最適化されている

#### パフォーマンス

- [ ] 不要な再レンダリングがない
- [ ] 重複リクエストが排除されている
- [ ] メモリリークがない
- [ ] ネットワークリクエストが最適化されている

#### ユーザビリティ

- [ ] ローディング状態が適切に表示される
- [ ] エラー時に適切なメッセージが表示される
- [ ] リトライ機能が動作する
- [ ] レスポンシブデザインが維持されている

## リスク管理

### 技術的リスク

#### 1. 既存機能の破壊

**対策**:

- 段階的なリファクタリング
- 十分なテストの実施
- ロールバック計画の準備

#### 2. パフォーマンスの劣化

**対策**:

- リファクタリング前後のパフォーマンス測定
- キャッシュ戦略の最適化
- プロファイリングの実施

#### 3. 型エラーの発生

**対策**:

- 型定義の事前整備
- TypeScript の厳密チェック
- 段階的な型の更新

### スケジュールリスク

#### 1. 予想以上の作業時間

**対策**:

- バッファ時間の確保
- 優先度の再調整
- 段階的なリリース

#### 2. 依存関係の問題

**対策**:

- 依存関係の事前確認
- 並行作業の調整
- コミュニケーションの強化

## 成功指標

### 定量的指標

- **コード量削減**: 20%以上の削減
- **重複コード削減**: 50%以上の削減
- **型安全性**: TypeScript エラー 0 件
- **テストカバレッジ**: 80%以上

### 定性的指標

- **開発体験**: 開発者アンケートで 4.0/5.0 以上
- **保守性**: コードレビュー時間の 30%削減
- **一貫性**: データフェッチパターンの統一率 95%以上

## 今後の拡張計画

### 短期（1-3 ヶ月）

1. **楽観的更新の実装**

   - ミューテーション操作での楽観的更新
   - ユーザー体験の向上

2. **リアルタイム更新の検討**
   - WebSocket 連携
   - プッシュ通知

### 中期（3-6 ヶ月）

1. **キャッシュ戦略の高度化**

   - 階層キャッシュ
   - プリフェッチング

2. **オフライン対応**
   - Service Worker 連携
   - オフラインキャッシュ

### 長期（6 ヶ月以上）

1. **マイクロフロントエンド対応**

   - データフェッチの分離
   - 独立したキャッシュ管理

2. **AI/ML 連携**
   - 予測的データ取得
   - インテリジェントキャッシュ

---

**最終更新**: 2025-10-16  
**バージョン**: 1.0.0  
**承認者**: 開発チーム  
**ステータス**: 承認済み

---
title: stats-list サブドメイン概要
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/stats-list
  - useswr-optimized
---

# stats-list サブドメイン概要

## 目的

stats-list サブドメインは、e-Stat API から利用可能な統計表の一覧を取得し、検索・フィルタリング機能を提供する責務を持ちます。ユーザーが目的の統計表を見つけやすくするための検索機能と、統計表の基本情報を管理します。

> **🔄 useSWR 最適化完了** (2025-01-18)
>
> このサブドメインは useSWR による最適化が完了しており、自動キャッシュ管理、重複リクエスト排除、エラーハンドリングの簡素化が実現されています。詳細は[useSWR 最適化実装ガイド](../implementation/useswr-optimization.md)を参照してください。

## 主要な機能

### 1. 統計表一覧の取得

- e-Stat API から統計表リストを取得
- ページネーション対応
- 基本情報の整形

### 2. 検索機能

- キーワード検索
- 政府統計名での検索
- 統計表題名での検索

### 3. フィルタリング

- 政府統計名での絞り込み
- 統計表の種類での絞り込み
- 更新日での絞り込み

### 4. ソート機能

- 更新日順ソート
- 統計表名順ソート
- 政府統計名順ソート

## アーキテクチャ

### ディレクトリ構造

```
src/lib/estat-api/stats-list/
├── index.ts                    # エントリーポイント
├── fetcher.ts                  # API通信クラス
├── formatter.ts                # データ変換処理
├── cache-key.ts                # キャッシュキー生成（useSWR最適化）
├── swr-fetcher.ts              # SWR用fetcher関数（useSWR最適化）
├── types/
│   ├── index.ts
│   ├── parameters.ts           # APIパラメータ型
│   ├── formatted.ts            # 整形済みデータ型
│   └── raw-response.ts         # 生APIレスポンス型
└── __tests__/
    ├── formatter.test.ts
    └── service.test.ts
```

### useSWR 最適化による変更点

- **cache-key.ts**: 検索オプションから一意のキャッシュキーを生成
- **swr-fetcher.ts**: useSWR 用の fetcher 関数（自動キャッシュ・リトライ）
- **useStatsListSearch**: 手動状態管理から useSWR に移行（65%コード削減）

### データフロー（useSWR 最適化版）

```
検索オプション
    │
    ▼
generateStatsListCacheKey() → キャッシュキー生成
    │
    ▼
useSWR(cacheKey, statsListFetcher) → 自動キャッシュ・リトライ
    │
    ├─► EstatStatsListFetcher → 生APIレスポンス
    └─► EstatStatsListFormatter → 整形済みデータ
            │
            ├─► formatTableList() → 統計表一覧
            ├─► formatTableInf() → 統計表情報
            └─► formatTableName() → 統計表名
                    │
                    ▼
            FormattedStatsList
                    │
                    ▼
            useMemo() → フィルタ・ソート処理（クライアント側）
                    │
                    ▼
            FinalSearchResult
```

### キャッシュ戦略

- **キャッシュ期間**: 5 分間（`dedupingInterval: 300000`）
- **リトライ**: 3 回まで自動リトライ
- **重複排除**: 同じ検索条件での重複リクエストを自動排除
- **バックグラウンド更新**: ネットワーク再接続時に自動再取得

## 主要なコンポーネント

### EstatStatsListService

- 統計表リストの取得
- 検索・フィルタリング機能
- ページネーション処理

### EstatStatsListFormatter

- 生 API レスポンスの解析
- 構造化データへの変換
- 検索結果の整形

## 型定義

### 主要な型

- `EstatStatsListResponse`: 生 API レスポンス
- `FormattedStatsList`: 整形済みデータ
- `StatsListOptions`: 取得オプション
- `SearchOptions`: 検索オプション
- `PaginationOptions`: ページネーションオプション

### 検索オプション

```typescript
interface SearchOptions {
  searchWord?: string; // 検索キーワード
  searchKind?: "1" | "2" | "3"; // 検索種別
  statsField?: string; // 統計分野
  statsCode?: string; // 政府統計コード
  cycle?: string; // 周期
  surveyYears?: string; // 調査年月
  openYears?: string; // 公開年月
  statsName?: string; // 政府統計名
  statsNameId?: string; // 政府統計名ID
  startPosition?: number; // 開始位置
  limit?: number; // 取得件数
  sortField?: string; // ソート項目
  sortOrder?: "asc" | "desc"; // ソート順序
}
```

## 設定

### 環境変数

```bash
# API設定
NEXT_PUBLIC_ESTAT_API_BASE_URL=https://api.e-stat.go.jp/rest/3.0/app/json
NEXT_PUBLIC_ESTAT_APP_ID=your_app_id

# 検索設定
NEXT_PUBLIC_ESTAT_DEFAULT_LIMIT=20
NEXT_PUBLIC_ESTAT_MAX_LIMIT=100
NEXT_PUBLIC_ESTAT_DEFAULT_SORT_FIELD=UPDATED_DATE
NEXT_PUBLIC_ESTAT_DEFAULT_SORT_ORDER=desc

# タイムアウト設定
NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS=30000
NEXT_PUBLIC_ESTAT_CONNECTION_TIMEOUT_MS=10000
```

## 使用例（useSWR 最適化版）

### 基本的な検索

```typescript
import { useStatsListSearch } from "@/hooks/estat-api/useStatsListSearch";

function StatsListComponent() {
  const { searchResult, isLoading, error, search } = useStatsListSearch();

  const handleSearch = () => {
    // キーワード検索（自動キャッシュ・リトライ）
    search({
      searchWord: "人口",
      limit: 20,
    });
  };

  if (isLoading) return <div>検索中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div>
      <button onClick={handleSearch}>検索実行</button>
      <div>検索結果件数: {searchResult?.tables.length}</div>
      <div>総件数: {searchResult?.totalCount}</div>
    </div>
  );
}
```

### フィルタ・ソート機能

```typescript
function StatsListWithFilters() {
  const { searchResult, isLoading, search, filter, sort } =
    useStatsListSearch();

  const handleFilter = () => {
    // フィルタリング（useMemoで最適化）
    filter({
      cycleFilter: ["年次"],
      organizationFilter: ["総務省"],
    });
  };

  const handleSort = () => {
    // ソート（useMemoで最適化）
    sort("surveyDate", "desc");
  };

  return (
    <div>
      <button onClick={handleFilter}>フィルタ適用</button>
      <button onClick={handleSort}>ソート実行</button>
      {/* 結果表示 */}
    </div>
  );
}
```

### キャッシュの活用

```typescript
function CachedSearch() {
  const { searchResult, isLoading, refetch } = useStatsListSearch();

  // 同じ検索条件では自動的にキャッシュから取得
  // 手動で再取得したい場合は refetch() を使用
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div>
      <button onClick={handleRefresh}>データ更新</button>
      {/* 結果表示 */}
    </div>
  );
}
```

### 従来の API（下位互換性）

```typescript
import { EstatStatsListFetcher } from "@/lib/estat-api/stats-list";

// 従来のAPIも引き続き使用可能
const result = await EstatStatsListFetcher.searchByKeyword("人口", {
  limit: 20,
});
```

## エラーハンドリング

### カスタムエラークラス

- `EstatStatsListFetchError`: API 取得エラー
- `EstatListFormatError`: データ変換エラー
- `EstatSearchError`: 検索エラー

### エラー処理例

```typescript
try {
  const result = await EstatStatsListService.getAndFormatStatsList({
    searchWord: "人口",
  });
  // 検索結果の処理
} catch (error) {
  if (error instanceof EstatStatsListFetchError) {
    console.error("検索エラー:", error.message);
    console.error("検索条件:", error.searchOptions);
  }
  // エラー処理
}
```

## テスト

### テストファイル

- `formatter.test.ts`: フォーマッターのテスト
- `service.test.ts`: サービスのテスト

### テスト実行

```bash
npm test -- src/lib/estat-api/stats-list/__tests__
```

## パフォーマンス最適化（useSWR 版）

### 1. 自動キャッシュ管理

- **キャッシュ期間**: 5 分間の自動キャッシュ
- **重複排除**: 同じ検索条件での重複リクエストを自動排除
- **メモリ効率**: useSWR による効率的なメモリ管理

### 2. クライアント側最適化

- **useMemo**: フィルタ・ソート処理を useMemo で最適化
- **条件付きレンダリング**: 不要な再レンダリングを防止
- **バッチ処理**: 複数の状態更新をバッチ処理

### 3. ネットワーク最適化

- **自動リトライ**: 3 回まで自動リトライ（指数バックオフ）
- **バックグラウンド更新**: ネットワーク再接続時の自動再取得
- **タイムアウト処理**: 適切なタイムアウト設定

### 4. コード最適化

- **コード削減**: 65%のコード削減（437 行 → 150 行）
- **保守性向上**: ビジネスロジックとデータ取得の分離
- **型安全性**: TypeScript による型安全性の確保

## 検索機能の詳細

### 検索種別

- `1`: 統計表名・調査名
- `2`: 政府統計名
- `3`: 統計表名・調査名・政府統計名

### 統計分野

- `1`: 人口・世帯
- `2`: 労働・賃金
- `3`: 農林水産業
- `4`: 鉱工業
- `5`: 商業・サービス業
- `6`: 企業・企業活動
- `7`: 物価・地価・賃金
- `8`: 国民経済計算
- `9`: 企業活動
- `10`: 家計
- `11`: 住宅・土地
- `12`: 環境・エネルギー
- `13`: 科学技術・研究開発
- `14`: 情報通信
- `15`: 運輸・観光
- `16`: 教育・文化・スポーツ・生活
- `17`: 司法・安全・環境
- `18`: 社会保障・衛生
- `19`: 国際
- `20`: その他

### 周期

- `年次`: 年次統計
- `月次`: 月次統計
- `四半期`: 四半期統計
- `日次`: 日次統計
- `その他`: その他の周期

## 関連ドキュメント

- [API 仕様](specifications/api.md) - get-stats-list API の詳細
- [サービス仕様](specifications/service.md) - サービスクラスの実装詳細
- [実装ガイド](implementation/) - 実装に関する詳細ガイド
- [テストガイド](testing/) - テスト戦略と実装

## 今後の拡張予定

1. **高度な検索**: 複合条件での検索機能
2. **検索履歴**: ユーザーの検索履歴管理（簡素化済み）
3. **お気に入り**: 統計表のお気に入り機能（実装済み）
4. **レコメンデーション**: 関連統計表の推薦機能
5. **検索分析**: 検索パターンの分析と最適化
6. **リアルタイム更新**: WebSocket によるリアルタイムデータ更新
7. **オフライン対応**: Service Worker によるオフラインキャッシュ

## useSWR 最適化の効果

### パフォーマンス改善

- **レスポンス時間**: キャッシュによる高速化
- **ネットワーク使用量**: 重複リクエストの削減
- **メモリ使用量**: 効率的なキャッシュ管理

### 開発体験向上

- **コード量**: 65%削減による保守性向上
- **エラーハンドリング**: 統一されたエラー処理
- **デバッグ**: 詳細なログ出力とエラー情報

### ユーザー体験向上

- **ローディング時間**: キャッシュによる即座の表示
- **エラー回復**: 自動リトライによる安定性
- **データ鮮度**: バックグラウンド更新による最新データ

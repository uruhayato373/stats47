---
title: stats-list サブドメイン概要
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/stats-list
---

# stats-list サブドメイン概要

## 目的

stats-list サブドメインは、e-Stat API から利用可能な統計表の一覧を取得し、検索・フィルタリング機能を提供する責務を持ちます。ユーザーが目的の統計表を見つけやすくするための検索機能と、統計表の基本情報を管理します。

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
├── EstatStatsListService.ts    # メインサービス
├── formatter.ts                # データ変換処理
├── types/
│   ├── index.ts
│   ├── parameters.ts           # APIパラメータ型
│   ├── formatted.ts            # 整形済みデータ型
│   └── raw-response.ts         # 生APIレスポンス型
└── __tests__/
    ├── formatter.test.ts
    └── service.test.ts
```

### データフロー

```
API Request
    │
    ▼
EstatStatsListService.getAndFormatStatsList()
    │
    ├─► getStatsListRaw() → 生APIレスポンス
    └─► formatStatsList() → 整形済みデータ
            │
            ├─► formatTableList() → 統計表一覧
            ├─► formatTableInf() → 統計表情報
            └─► formatTableName() → 統計表名
                    │
                    ▼
            FormattedStatsList
```

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

## 使用例

### 基本的な検索

```typescript
import { EstatStatsListService } from "@/lib/estat-api/stats-list";

// キーワード検索
const result = await EstatStatsListService.getAndFormatStatsList({
  searchWord: "人口",
  limit: 20,
});

console.log("検索結果件数:", result.tableList.length);
console.log("総件数:", result.numberOfRecords);
```

### 政府統計名での検索

```typescript
// 特定の政府統計を検索
const result = await EstatStatsListService.getAndFormatStatsList({
  statsName: "人口推計",
  limit: 10,
});

console.log("人口推計の統計表:", result.tableList);
```

### フィルタリング

```typescript
// 複数条件での検索
const result = await EstatStatsListService.getAndFormatStatsList({
  searchWord: "都道府県",
  statsField: "2", // 人口・世帯
  cycle: "年次",
  limit: 50,
});
```

### ページネーション

```typescript
// 2ページ目を取得
const result = await EstatStatsListService.getAndFormatStatsList({
  searchWord: "人口",
  startPosition: 21, // 21件目から
  limit: 20,
});
```

### ソート

```typescript
// 更新日順でソート
const result = await EstatStatsListService.getAndFormatStatsList({
  searchWord: "人口",
  sortField: "UPDATED_DATE",
  sortOrder: "desc",
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

## パフォーマンス考慮事項

### 1. 検索結果のキャッシュ

- 同じ検索条件での重複取得を避ける
- メモリキャッシュの実装

### 2. ページネーション最適化

- 必要な分のみを取得
- 無限スクロール対応

### 3. 検索インデックス

- 頻繁に検索されるキーワードのインデックス化
- 検索結果の事前計算

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
2. **検索履歴**: ユーザーの検索履歴管理
3. **お気に入り**: 統計表のお気に入り機能
4. **レコメンデーション**: 関連統計表の推薦機能
5. **検索分析**: 検索パターンの分析と最適化

# ライブラリ概要

## 目的

`src/lib/estat` ライブラリは、e-Stat（政府統計ポータルサイト）のAPIから統計データを取得し、アプリケーションで利用しやすい形式に整形・管理するためのライブラリです。

## 主要な機能

### 1. 統計データの取得と整形
e-Stat APIから統計データを取得し、構造化された形式に変換します。

- APIレスポンスのパース
- データのフィルタリング（カテゴリ、年度、地域）
- 使いやすい形式への変換
- NULL値や特殊文字の適切な処理

### 2. メタ情報の管理
統計表のメタ情報（カテゴリ、単位など）を取得・保存・検索します。

- メタ情報の取得と変換
- データベースへの保存
- 効率的な一括処理
- 検索機能

### 3. 統計リストの取得
利用可能な統計表の一覧を取得します。

- キーワード検索
- フィルタリング
- ページネーション

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────┐
│   Application Layer                 │
│   (API Routes, Handlers)            │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Service Layer                     │
│   - EstatStatsDataService           │
│   - EstatStatsListService           │
│   - EstatMetaInfoService            │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   API Client Layer                  │
│   (@/services/estat-api)            │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   e-Stat API                        │
│   (External Service)                │
└─────────────────────────────────────┘
```

### データフロー

#### 1. 統計データ取得フロー

```
User Request
    │
    ▼
EstatStatsDataService.getAndFormatStatsData()
    │
    ├─► getStatsDataRaw()
    │       │
    │       ▼
    │   estatAPI.getStatsData()
    │       │
    │       ▼
    │   e-Stat API
    │       │
    │       ▼
    │   Raw Response
    │
    └─► formatStatsData()
            │
            ├─► formatAreas()
            ├─► formatCategories()
            ├─► formatYears()
            └─► formatValues()
                    │
                    ▼
            Formatted Data
```

#### 2. メタ情報取得・保存フロー

```
User Request
    │
    ▼
EstatMetaInfoService.processAndSaveMetaInfo()
    │
    ├─► estatAPI.getMetaInfo()
    │       │
    │       ▼
    │   e-Stat API Response
    │
    ├─► transformToCSVFormat()
    │       │
    │       ▼
    │   Transformed Data
    │
    └─► saveTransformedData()
            │
            ├─► processBatch()
            │       │
            │       ▼
            │   D1 Database
            │
            └─► findRankingKey()
```

## 主要な概念

### 1. 統計表ID (statsDataId)

e-Statの各統計表に付与される一意の識別子です。10桁の数字で表されます。

例: `0000010101`

### 2. カテゴリコード (cat01-15)

統計データの分類を示すコードです。最大15種類まで設定可能ですが、通常は `cat01` が主要なカテゴリとして使用されます。

例:
- `A1101`: 総人口
- `A1301`: 男性人口
- `A1401`: 女性人口

### 3. 地域コード (area)

統計データの対象地域を示すコードです。

例:
- `00000`: 全国
- `13000`: 東京都
- `27000`: 大阪府

### 4. 時間軸コード (time)

統計データの対象時期を示すコードです。

例:
- `2020`: 2020年
- `2020CY`: 2020暦年
- `202001`: 2020年1月

### 5. データ整形の段階

#### Raw Response (生APIレスポンス)
e-Stat APIから返される生のJSON形式のデータ。

#### Formatted Data (整形済みデータ)
アプリケーションで扱いやすいように変換されたデータ。
- 構造化された形式
- NULL値の適切な処理
- 数値の正規化

#### Processed Data (処理済みデータ)
さらに高度な処理を施したデータ（統計量の計算など）。

## サービス別の役割

### EstatStatsDataService

**役割**: 統計データの取得と整形

**主な責務**:
- 統計表からデータを取得
- 地域・カテゴリ・年度情報の整形
- フィルタリング条件の適用
- 都道府県データの抽出
- 利用可能な年度リストの取得

### EstatStatsListService

**役割**: 統計表リストの取得

**主な責務**:
- 統計表の検索
- リスト情報の整形
- ページネーション処理

### EstatMetaInfoService

**役割**: メタ情報の管理

**主な責務**:
- メタ情報の取得と変換
- データベースへの保存
- 一括処理（バッチ処理）
- メタ情報の検索
- サマリー情報の生成

## パフォーマンス最適化

### 1. バッチ処理

メタ情報の保存時に、複数レコードをバッチでまとめて処理することで、データベース操作を効率化しています。

```typescript
// バッチサイズ: 20件
// 並列実行: 最大3チャンク同時
```

### 2. 並列処理

複数の統計表を処理する際、並列処理により処理時間を短縮します。

```typescript
await Promise.allSettled(
  batch.map(async (id) => ({
    statsDataId: id,
    ...(await this.processAndSaveMetaInfo(id)),
  }))
);
```

### 3. レート制限対応

API制限を考慮し、バッチ間に待機時間を設けています。

```typescript
// デフォルト: 1000ms
await new Promise((resolve) => setTimeout(resolve, delayMs));
```

## エラーハンドリング

### エラーの種類

1. **API通信エラー**: e-Stat APIとの通信に失敗した場合
2. **データ形式エラー**: APIレスポンスが期待した形式でない場合
3. **データベースエラー**: データベース操作に失敗した場合

### エラーログ

詳細なエラーログを出力することで、問題の特定を容易にしています。

```typescript
console.error("Failed to fetch stats data:", error);
console.error("Error details:", {
  statsDataId,
  options,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
});
```

## データベーススキーマ

### estat_metainfo テーブル

メタ情報を保存するテーブルです。

| カラム名 | 型 | 説明 |
|---------|-----|------|
| stats_data_id | TEXT | 統計表ID |
| stat_name | TEXT | 政府統計名 |
| title | TEXT | 統計表題名 |
| cat01 | TEXT | カテゴリコード |
| item_name | TEXT | 項目名 |
| unit | TEXT | 単位 |
| ranking_key | TEXT | ランキングキー（NULL可） |
| updated_at | TIMESTAMP | 更新日時 |

複合主キー: `(stats_data_id, cat01)`

## 型安全性

TypeScriptの型システムを活用し、コンパイル時の型チェックによりバグを防ぎます。

- すべてのAPIパラメータに型定義
- レスポンスデータの型定義
- 内部データ構造の型定義

詳細は [型定義](types.md) を参照してください。

## 拡張性

### 新しいAPIエンドポイントの追加

新しいe-Stat APIエンドポイントを追加する場合：

1. `types/` に型定義を追加
2. `@/services/estat-api` にAPIクライアントメソッドを追加
3. 適切なサービスクラスにメソッドを追加

### 新しいデータ変換の追加

データ変換ロジックを追加する場合：

1. サービスクラスにprivateメソッドを追加
2. 既存の `format*()` メソッドから呼び出す
3. 必要に応じて型定義を追加

## ベストプラクティス

### 1. フィルタリングの活用

大量のデータを取得する前に、必要なデータのみを取得するようフィルタリングを活用します。

```typescript
// 良い例: 必要なデータのみを取得
const data = await EstatStatsDataService.getAndFormatStatsData(
  statsDataId,
  {
    categoryFilter: 'A1101',
    yearFilter: '2020',
    areaFilter: '13000'
  }
);

// 悪い例: すべてのデータを取得してから絞り込み
const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
const filtered = data.values.filter(...);
```

### 2. エラーハンドリング

必ずtry-catchでエラーをハンドリングします。

```typescript
try {
  const data = await EstatStatsDataService.getAndFormatStatsData(statsDataId);
  // データ処理
} catch (error) {
  console.error('データ取得に失敗:', error);
  // エラー処理
}
```

### 3. メタ情報のキャッシュ

メタ情報は頻繁に変更されないため、データベースに保存してキャッシュとして活用します。

```typescript
// 初回: APIから取得してDBに保存
await metaService.processAndSaveMetaInfo(statsDataId);

// 2回目以降: DBから取得
const metadata = await metaService.getSavedMetadataByStatsId(statsDataId);
```

## 次のステップ

- [EstatStatsDataService の詳細](stats-data-service.md)
- [EstatStatsListService の詳細](stats-list-service.md)
- [EstatMetaInfoService の詳細](metainfo-service.md)
- [型定義の詳細](types.md)
- [使用例](examples.md)

# EstatMetaInfoService

## 概要

`EstatMetaInfoService` は、e-Stat APIからメタ情報（統計表のカテゴリ情報）を取得し、変換・保存・検索するための統合的なサービスクラスです。

**ファイルパス**: `src/lib/estat/metainfo/EstatMetaInfoService.ts`

## 主な機能

1. メタ情報の取得と変換
2. データベースへの保存
3. 一括処理（バッチ処理）
4. メタ情報の検索
5. サマリー情報の取得
6. ランキングキーとの連携

## 重要事項

このサービスは **Cloudflare D1 Database** を使用します。インスタンス作成時にデータベース接続が必要です。

```typescript
const metaService = new EstatMetaInfoService(db);
```

## メソッド一覧

### コアメソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `processAndSaveMetaInfo()` | `Promise<ProcessResult>` | メタ情報を取得・変換・保存 |
| `processBulkMetaInfo()` | `Promise<BulkResult>` | 複数の統計表を一括処理 |
| `processMetaInfoRange()` | `Promise<BulkResult>` | 範囲指定で一括処理 |

### 検索メソッド

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `searchMetaInfo()` | `Promise<MetadataSearchResult>` | メタ情報を検索 |
| `getMetaInfoSummary()` | `Promise<MetadataSummary>` | サマリー情報を取得 |
| `getStatsList()` | `Promise<StatsListItem[]>` | 統計表一覧を取得 |
| `findRankingKey()` | `Promise<string \| null>` | ランキングキーを検索 |

### 高レベルAPI（互換性維持用）

| メソッド名 | 戻り値 | 説明 |
|-----------|--------|------|
| `fetchAndSaveMetadata()` | `Promise<void>` | 単一の統計表を処理 |
| `fetchAndSaveMultipleMetadata()` | `Promise<void>` | 複数の統計表を処理 |
| `fetchAndSaveMetadataRange()` | `Promise<void>` | 範囲指定で処理 |
| `searchSavedMetadata()` | `Promise<MetaCategoryData[]>` | 保存済みデータを検索 |
| `getSavedStatList()` | `Promise<SavedStatItem[]>` | 統計表一覧を取得 |
| `getSavedDataCount()` | `Promise<number>` | データ件数を取得 |
| `getSavedMetadataByStatsId()` | `Promise<MetaCategoryData[]>` | 統計表IDで検索 |
| `getSavedMetadataByCategory()` | `Promise<MetaCategoryData[]>` | カテゴリで検索 |

### プライベートメソッド

| メソッド名 | 説明 |
|-----------|------|
| `transformToCSVFormat()` | メタ情報をCSV形式に変換 |
| `saveTransformedData()` | 変換データをDBに保存 |
| `processBatch()` | バッチ処理を実行 |

## 詳細仕様

### 1. processAndSaveMetaInfo()

単一の統計表IDからメタ情報を取得・変換・保存します。

#### シグネチャ

```typescript
async processAndSaveMetaInfo(statsDataId: string): Promise<{
  success: boolean;
  entriesProcessed: number;
  error?: string;
}>
```

#### パラメータ

- `statsDataId` (string): 統計表ID（10桁の数字）

#### 戻り値

```typescript
{
  success: boolean;              // 成功/失敗
  entriesProcessed: number;      // 処理したエントリ数
  error?: string;                // エラーメッセージ（失敗時）
}
```

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

const result = await metaService.processAndSaveMetaInfo('0000010101');

if (result.success) {
  console.log(`${result.entriesProcessed}件のメタ情報を保存しました`);
} else {
  console.error('エラー:', result.error);
}
```

#### 処理フロー

1. e-Stat APIからメタ情報を取得
2. CSV形式に変換
3. データベースに保存
4. 各ステップの処理時間をログ出力

### 2. processBulkMetaInfo()

複数の統計表IDを一括処理します。

#### シグネチャ

```typescript
async processBulkMetaInfo(
  statsDataIds: string[],
  options: {
    batchSize?: number;
    delayMs?: number;
  } = {}
): Promise<{
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    statsDataId: string;
    success: boolean;
    entriesProcessed: number;
    error?: string;
  }>;
}>
```

#### パラメータ

- `statsDataIds` (string[]): 統計表IDの配列
- `options.batchSize` (number, optional): バッチサイズ（デフォルト: 10）
- `options.delayMs` (number, optional): バッチ間の待機時間（ミリ秒、デフォルト: 1000）

#### 戻り値

```typescript
{
  totalProcessed: number;    // 処理した総数
  successCount: number;      // 成功した数
  failureCount: number;      // 失敗した数
  results: Array<{           // 各IDの処理結果
    statsDataId: string;
    success: boolean;
    entriesProcessed: number;
    error?: string;
  }>;
}
```

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

const statsIds = [
  '0000010101',
  '0000010102',
  '0000010103',
  '0000010104',
  '0000010105'
];

const result = await metaService.processBulkMetaInfo(statsIds, {
  batchSize: 5,    // 5件ずつ処理
  delayMs: 2000    // 2秒待機
});

console.log(`成功: ${result.successCount}件`);
console.log(`失敗: ${result.failureCount}件`);

// 失敗したIDを確認
const failures = result.results.filter(r => !r.success);
failures.forEach(f => {
  console.error(`${f.statsDataId}: ${f.error}`);
});
```

#### バッチ処理の仕組み

1. 指定された `batchSize` でIDを分割
2. 各バッチを `Promise.allSettled()` で並列処理
3. バッチ間に `delayMs` の待機時間を挿入（API制限対策）

### 3. processMetaInfoRange()

統計表IDの範囲を指定して一括処理します。

#### シグネチャ

```typescript
async processMetaInfoRange(
  startId: string,
  endId: string,
  options?: {
    batchSize?: number;
    delayMs?: number;
  }
): Promise<BulkResult>
```

#### パラメータ

- `startId` (string): 開始ID（例: "0000010101"）
- `endId` (string): 終了ID（例: "0000010110"）
- `options`: `processBulkMetaInfo()` と同じ

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

// 0000010101 から 0000010120 まで処理
const result = await metaService.processMetaInfoRange(
  '0000010101',
  '0000010120',
  {
    batchSize: 10,
    delayMs: 1500
  }
);

console.log(`処理完了: ${result.totalProcessed}件`);
console.log(`成功: ${result.successCount}件`);
console.log(`失敗: ${result.failureCount}件`);
```

### 4. searchMetaInfo()

保存されたメタ情報を検索します。

#### シグネチャ

```typescript
async searchMetaInfo(
  query: string,
  options: {
    searchType?: "full" | "stat_name" | "category" | "stats_id";
    limit?: number;
    offset?: number;
  } = {}
): Promise<MetadataSearchResult>
```

#### パラメータ

- `query` (string): 検索クエリ
- `options.searchType`:
  - `"full"`: 政府統計名、表題、項目名を検索（デフォルト）
  - `"stat_name"`: 政府統計名のみを検索
  - `"category"`: カテゴリコードで検索
  - `"stats_id"`: 統計表IDで検索
- `options.limit` (number, optional): 取得件数（デフォルト: 100）
- `options.offset` (number, optional): オフセット（デフォルト: 0）

#### 戻り値

```typescript
{
  entries: EstatMetaCategoryData[];  // 検索結果
  totalCount: number;                 // 総件数
  searchQuery: string;                // 検索クエリ
  executedAt: string;                 // 実行日時
}
```

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

// フルテキスト検索
const fullSearch = await metaService.searchMetaInfo('人口');
console.log(`${fullSearch.totalCount}件が見つかりました`);

// 政府統計名で検索
const statNameSearch = await metaService.searchMetaInfo('国勢調査', {
  searchType: 'stat_name',
  limit: 50
});

// カテゴリコードで検索
const categorySearch = await metaService.searchMetaInfo('A1101', {
  searchType: 'category'
});

// 統計表IDで検索
const statsIdSearch = await metaService.searchMetaInfo('0000010101', {
  searchType: 'stats_id'
});

// ページネーション
const page2 = await metaService.searchMetaInfo('人口', {
  limit: 20,
  offset: 20
});
```

### 5. getMetaInfoSummary()

メタ情報のサマリーを取得します。

#### シグネチャ

```typescript
async getMetaInfoSummary(): Promise<MetadataSummary>
```

#### 戻り値

```typescript
{
  totalEntries: number;      // 総エントリ数
  uniqueStats: number;       // ユニークな統計表数
  categories: Array<{        // カテゴリ別件数（上位20件）
    code: string;
    name: string;
    count: number;
  }>;
  lastUpdated: string | null; // 最終更新日時
}
```

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

const summary = await metaService.getMetaInfoSummary();

console.log(`総エントリ数: ${summary.totalEntries}`);
console.log(`統計表数: ${summary.uniqueStats}`);
console.log(`最終更新: ${summary.lastUpdated}`);

console.log('\nカテゴリ別Top 10:');
summary.categories.slice(0, 10).forEach((cat, index) => {
  console.log(`${index + 1}. ${cat.name} (${cat.code}): ${cat.count}件`);
});
```

### 6. getStatsList()

保存されている統計表の一覧を取得します。

#### シグネチャ

```typescript
async getStatsList(
  options: {
    orderBy?: "last_updated" | "stat_name" | "item_count";
  } = {}
): Promise<Array<{
  stats_data_id: string;
  stat_name: string;
  title: string;
  item_count: number;
  last_updated: string;
}>>
```

#### パラメータ

- `options.orderBy`: ソート順
  - `"last_updated"`: 更新日時順（デフォルト）
  - `"stat_name"`: 政府統計名順
  - `"item_count"`: アイテム数順

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

// 最新順で取得
const recentStats = await metaService.getStatsList({
  orderBy: 'last_updated'
});

recentStats.slice(0, 10).forEach(stat => {
  console.log(`${stat.stat_name}: ${stat.title}`);
  console.log(`  アイテム数: ${stat.item_count}`);
  console.log(`  更新日: ${stat.last_updated}`);
});

// 統計名順で取得
const sortedStats = await metaService.getStatsList({
  orderBy: 'stat_name'
});

// アイテム数順で取得
const statsByItems = await metaService.getStatsList({
  orderBy: 'item_count'
});
```

### 7. findRankingKey()

統計表IDとカテゴリコードからランキングキーを検索します。

#### シグネチャ

```typescript
async findRankingKey(
  statsDataId: string,
  cat01: string
): Promise<string | null>
```

#### 使用例

```typescript
const metaService = new EstatMetaInfoService(db);

const rankingKey = await metaService.findRankingKey('0000010101', 'A1101');

if (rankingKey) {
  console.log(`ランキングキー: ${rankingKey}`);
} else {
  console.log('ランキングキーが見つかりませんでした');
}
```

## データ変換の仕組み

### transformToCSVFormat()

e-Stat APIのメタ情報レスポンスをCSV形式（配列）に変換します。

#### 入力

```typescript
{
  GET_META_INFO: {
    METADATA_INF: {
      TABLE_INF: {
        "@id": "0000010101",
        STAT_NAME: { $: "国勢調査" },
        TITLE: { $: "人口等基本集計" }
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "cat01",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "総人口",
                "@unit": "人"
              },
              // ...
            ]
          }
        ]
      }
    }
  }
}
```

#### 出力

```typescript
[
  {
    stats_data_id: "0000010101",
    stat_name: "国勢調査",
    title: "人口等基本集計",
    cat01: "A1101",
    item_name: "総人口",
    unit: "人"
  },
  // ...
]
```

### saveTransformedData()

変換されたデータをデータベースに効率的に保存します。

#### 最適化手法

1. **バッチサイズ最適化**: 20件ずつバッチ処理
2. **並列処理**: 最大3チャンク同時実行
3. **バルクINSERT**: 複数レコードを1つのクエリで挿入
4. **UPSERT**: `ON CONFLICT` を使用して重複を処理

#### SQL例

```sql
INSERT INTO estat_metainfo
(stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
VALUES
  ('0000010101', '国勢調査', '人口等基本集計', 'A1101', '総人口', '人', NULL, CURRENT_TIMESTAMP),
  ('0000010101', '国勢調査', '人口等基本集計', 'A1301', '男性人口', '人', NULL, CURRENT_TIMESTAMP),
  -- ...
ON CONFLICT(stats_data_id, cat01)
DO UPDATE SET
  stat_name = excluded.stat_name,
  title = excluded.title,
  item_name = excluded.item_name,
  unit = excluded.unit,
  ranking_key = excluded.ranking_key,
  updated_at = CURRENT_TIMESTAMP
```

## パフォーマンス最適化

### 1. バッチサイズの調整

```typescript
// デフォルトは10件
const result = await metaService.processBulkMetaInfo(statsIds);

// 大量処理時はバッチサイズを増やす
const result = await metaService.processBulkMetaInfo(statsIds, {
  batchSize: 20
});

// API制限が厳しい場合は減らす
const result = await metaService.processBulkMetaInfo(statsIds, {
  batchSize: 5
});
```

### 2. 待機時間の調整

```typescript
// APIレート制限に応じて調整
const result = await metaService.processBulkMetaInfo(statsIds, {
  delayMs: 2000  // 2秒待機
});
```

### 3. 検索のlimit設定

```typescript
// 必要最小限の件数を取得
const result = await metaService.searchMetaInfo('人口', {
  limit: 50
});
```

## エラーハンドリング

### 詳細なログ出力

各処理ステップで詳細なログを出力します。

```
🔵 Service: processAndSaveMetaInfo 開始: 0000010101
🔵 Service: e-STAT API呼び出し開始
✅ Service: e-STAT API呼び出し完了 (1234ms)
🔵 Service: データ変換開始
✅ Service: データ変換完了 (56ms) - 15件
🔵 Service: DB保存開始
✅ Service: DB保存完了 (234ms)
✅ Service: processAndSaveMetaInfo 完了 (合計: 1524ms)
```

### エラー情報の取得

```typescript
const result = await metaService.processAndSaveMetaInfo(statsDataId);

if (!result.success) {
  console.error('処理失敗:', result.error);
  // エラー処理...
}
```

## 実用的な使用例

### 1. 統計表のメタ情報を一括取得

```typescript
async function fetchAllMetadata(db: D1Database) {
  const metaService = new EstatMetaInfoService(db);

  // 統計表IDのリスト
  const statsIds = [
    '0000010101', // 国勢調査
    '0003109687', // 労働力調査
    '0003103532', // 家計調査
    // ...
  ];

  const result = await metaService.processBulkMetaInfo(statsIds, {
    batchSize: 5,
    delayMs: 1000
  });

  console.log(`処理完了: ${result.successCount}/${result.totalProcessed}件`);

  return result;
}
```

### 2. メタ情報の検索とフィルタリング

```typescript
async function searchPopulationData(db: D1Database) {
  const metaService = new EstatMetaInfoService(db);

  // 人口関連のメタ情報を検索
  const result = await metaService.searchMetaInfo('人口', {
    searchType: 'full',
    limit: 100
  });

  console.log(`${result.totalCount}件が見つかりました`);

  // 単位が「人」のものだけをフィルタ
  const personData = result.entries.filter(entry => entry.unit === '人');

  console.log(`うち単位が「人」: ${personData.length}件`);

  return personData;
}
```

### 3. ダッシュボード用のサマリー取得

```typescript
async function getDashboardData(db: D1Database) {
  const metaService = new EstatMetaInfoService(db);

  const summary = await metaService.getMetaInfoSummary();
  const recentStats = await metaService.getStatsList({
    orderBy: 'last_updated'
  });

  return {
    overview: {
      totalEntries: summary.totalEntries,
      uniqueStats: summary.uniqueStats,
      lastUpdated: summary.lastUpdated
    },
    topCategories: summary.categories.slice(0, 10),
    recentStats: recentStats.slice(0, 10)
  };
}
```

### 4. 特定の統計表の詳細情報

```typescript
async function getStatsDetails(
  db: D1Database,
  statsDataId: string
) {
  const metaService = new EstatMetaInfoService(db);

  const metadata = await metaService.searchMetaInfo(statsDataId, {
    searchType: 'stats_id'
  });

  if (metadata.entries.length === 0) {
    console.log('この統計表のメタ情報は保存されていません');
    console.log('取得して保存します...');

    await metaService.processAndSaveMetaInfo(statsDataId);

    // 再度検索
    const retry = await metaService.searchMetaInfo(statsDataId, {
      searchType: 'stats_id'
    });
    return retry.entries;
  }

  return metadata.entries;
}
```

## データベーススキーマ

### estat_metainfo テーブル

```sql
CREATE TABLE estat_metainfo (
  stats_data_id TEXT NOT NULL,
  stat_name TEXT NOT NULL,
  title TEXT NOT NULL,
  cat01 TEXT NOT NULL,
  item_name TEXT,
  unit TEXT,
  ranking_key TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stats_data_id, cat01)
);

CREATE INDEX idx_estat_metainfo_stat_name ON estat_metainfo(stat_name);
CREATE INDEX idx_estat_metainfo_ranking_key ON estat_metainfo(ranking_key);
```

## 関連ドキュメント

- [型定義: EstatMetaCategoryData](types.md#estatmetacategorydata)
- [型定義: MetadataSummary](types.md#metadatasummary)
- [使用例](examples.md#estatmetainfoservice)
- [ライブラリ概要](02_domain/estat-api/specifications/overview.md)

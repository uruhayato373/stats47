---
title: meta-info Batch Processor 実装ガイド
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/meta-info
  - implementation
---

# meta-info Batch Processor 実装ガイド

## 概要

`EstatMetaInfoBatchProcessor`は、複数の統計表 ID を効率的に一括処理する責務を持ちます。レート制限を考慮し、エラーハンドリングと進捗管理を提供します。

## 主要なメソッド

### processBulk()

```typescript
static async processBulk(
  statsDataIds: string[],
  options?: BatchProcessOptions
): Promise<BatchProcessResult>
```

**目的**: 複数の統計表 ID を一括処理

**パラメータ**:

- `statsDataIds`: 処理する統計表 ID の配列
- `options`: バッチ処理オプション

**戻り値**: `BatchProcessResult` - 処理結果の詳細

### processRange()

```typescript
static async processRange(
  startId: string,
  endId: string,
  options?: BatchProcessOptions
): Promise<BatchProcessResult>
```

**目的**: ID 範囲を指定して一括処理

**パラメータ**:

- `startId`: 開始 ID
- `endId`: 終了 ID
- `options`: バッチ処理オプション

## 設定オプション

### BatchProcessOptions

```typescript
interface BatchProcessOptions {
  batchSize?: number; // バッチサイズ（デフォルト: 10）
  delayMs?: number; // バッチ間の待機時間（デフォルト: 1000ms）
  onProgress?: (processed: number, total: number) => void; // 進捗コールバック
}
```

### 環境変数による設定

```bash
# バッチサイズ
NEXT_PUBLIC_ESTAT_BATCH_SIZE=10

# 待機時間（ミリ秒）
NEXT_PUBLIC_ESTAT_BATCH_DELAY_MS=1000

# レート制限
NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_MINUTE=60
NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_HOUR=1000
```

## 実装詳細

### バッチ処理フロー

```
statsDataIds配列
    │
    ▼
バッチに分割 (batchSize)
    │
    ▼
各バッチを並列処理
    │
    ├─► EstatMetaInfoFetcher.fetchAndTransform()
    ├─► エラーハンドリング
    └─► 結果の収集
    │
    ▼
進捗コールバック実行
    │
    ▼
待機時間 (delayMs)
    │
    ▼
次のバッチへ
```

### エラーハンドリング

```typescript
const batchResults = await Promise.allSettled(
  batch.map(async (id) => {
    try {
      const transformedData = await EstatMetaInfoFetcher.fetchAndTransform(id);
      return {
        statsDataId: id,
        success: true,
        entriesProcessed: transformedData.length,
      };
    } catch (error) {
      return {
        statsDataId: id,
        success: false,
        entriesProcessed: 0,
        error: error instanceof Error ? error.message : "Processing failed",
      };
    }
  })
);
```

## 使用例

### 基本的な一括処理

```typescript
import { EstatMetaInfoBatchProcessor } from "@/lib/estat-api/meta-info";

const statsDataIds = ["0000010101", "0000010102", "0000010103"];

const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds);

console.log("処理完了:", result.totalProcessed);
console.log("成功:", result.successCount);
console.log("失敗:", result.failureCount);
```

### 進捗管理付きの処理

```typescript
const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds, {
  batchSize: 5,
  delayMs: 2000,
  onProgress: (processed, total) => {
    const percentage = Math.round((processed / total) * 100);
    console.log(`進捗: ${processed}/${total} (${percentage}%)`);
  },
});
```

### ID 範囲での処理

```typescript
// 0000010101 から 0000010105 まで処理
const result = await EstatMetaInfoBatchProcessor.processRange(
  "0000010101",
  "0000010105",
  {
    batchSize: 3,
    delayMs: 1500,
  }
);
```

### カスタム設定での処理

```typescript
const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds, {
  batchSize: 20, // 大きなバッチサイズ
  delayMs: 500, // 短い待機時間
  onProgress: (processed, total) => {
    // カスタム進捗表示
    updateProgressBar(processed, total);
  },
});
```

## 結果の処理

### BatchProcessResult

```typescript
interface BatchProcessResult {
  totalProcessed: number; // 総処理数
  successCount: number; // 成功数
  failureCount: number; // 失敗数
  results: Array<{
    // 詳細結果
    statsDataId: string;
    success: boolean;
    entriesProcessed: number;
    error?: string;
  }>;
}
```

### 結果の分析

```typescript
const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds);

// 成功した統計表ID
const successfulIds = result.results
  .filter((r) => r.success)
  .map((r) => r.statsDataId);

// 失敗した統計表IDとエラー
const failedResults = result.results
  .filter((r) => !r.success)
  .map((r) => ({ id: r.statsDataId, error: r.error }));

console.log("成功:", successfulIds);
console.log("失敗:", failedResults);
```

## パフォーマンス最適化

### 1. バッチサイズの調整

```typescript
// 小さいバッチ: メモリ使用量を抑制
const smallBatch = { batchSize: 5, delayMs: 1000 };

// 大きいバッチ: 処理速度を向上
const largeBatch = { batchSize: 20, delayMs: 2000 };
```

### 2. 並列処理の制御

```typescript
// レート制限を考慮した設定
const conservative = { batchSize: 3, delayMs: 2000 };
const aggressive = { batchSize: 10, delayMs: 500 };
```

### 3. メモリ管理

```typescript
// 大量データの処理時
const result = await EstatMetaInfoBatchProcessor.processBulk(largeIdList, {
  batchSize: 5, // 小さなバッチでメモリ使用量を抑制
  delayMs: 1000,
});
```

## エラーハンドリング

### 個別エラーの処理

```typescript
const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds);

// エラーが発生した統計表IDを再処理
const failedIds = result.results
  .filter((r) => !r.success)
  .map((r) => r.statsDataId);

if (failedIds.length > 0) {
  console.log("再処理が必要なID:", failedIds);
  // 再処理ロジック
}
```

### リトライ機能

```typescript
const retryFailedIds = async (failedIds: string[]) => {
  const retryResult = await EstatMetaInfoBatchProcessor.processBulk(failedIds, {
    batchSize: 1, // 1つずつ慎重に処理
    delayMs: 3000, // 長めの待機時間
  });

  return retryResult;
};
```

## テスト

### 単体テスト例

```typescript
describe("EstatMetaInfoBatchProcessor", () => {
  it("複数の統計表IDを一括処理できる", async () => {
    const statsDataIds = ["0000010101", "0000010102"];
    const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds);

    expect(result.totalProcessed).toBe(2);
    expect(result.successCount).toBeGreaterThan(0);
  });

  it("進捗コールバックが正しく呼ばれる", async () => {
    const onProgress = vi.fn();
    await EstatMetaInfoBatchProcessor.processBulk(
      ["0000010101", "0000010102"],
      { onProgress }
    );

    expect(onProgress).toHaveBeenCalled();
  });
});
```

## 監視とログ

### ログ出力

```typescript
// 詳細ログの有効化
NEXT_PUBLIC_ESTAT_DEBUG = true;
NEXT_PUBLIC_ESTAT_LOG_LEVEL = info;
```

### メトリクス収集

```typescript
const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds);

// 処理時間の計測
const startTime = Date.now();
// ... 処理実行 ...
const endTime = Date.now();
const processingTime = endTime - startTime;

console.log(`処理時間: ${processingTime}ms`);
console.log(`平均処理時間: ${processingTime / result.totalProcessed}ms/件`);
```

## トラブルシューティング

### よくある問題

1. **レート制限エラー**

   - 待機時間の増加
   - バッチサイズの削減

2. **メモリ不足**

   - バッチサイズの削減
   - 処理の分割

3. **タイムアウトエラー**
   - タイムアウト値の調整
   - ネットワーク状況の確認

### デバッグ方法

```typescript
// デバッグモードでの実行
const result = await EstatMetaInfoBatchProcessor.processBulk(statsDataIds, {
  batchSize: 1, // 1つずつ処理してデバッグ
  delayMs: 2000,
  onProgress: (processed, total) => {
    console.log(`デバッグ: ${processed}/${total}`);
  },
});
```

## 関連ドキュメント

- [API 仕様](../specifications/api.md)
- [フェッチャー実装ガイド](fetcher.md)
- [フォーマッター実装ガイド](formatter.md)
- [設定ガイド](../specifications/config.md)

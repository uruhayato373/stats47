# 単一責務の原則（SRP）分析: EstatMetaInfoFormatter

## 概要

このドキュメントでは、`src/lib/estat-api/formatters/metainfo-formatter.ts` の単一責務の原則（Single Responsibility Principle）違反と、その改善案を示します。

## 現状の問題点

### 結論

**`EstatMetaInfoFormatter` は単一責務の原則を守っていません。**

このクラスは、名前が示す「フォーマッター（データ変換）」という単一の責務ではなく、**4つの異なる責務**を持っています。

## 現在の責務（複数存在）

### 1. API通信（データ取得）

```typescript
static async getAndTransformMetaInfo(
  statsDataId: string
): Promise<TransformedMetadataEntry[]> {
  const metaInfo = await estatAPI.getMetaInfo({ statsDataId }); // ← API呼び出し
  return this.transformToCSVFormat(metaInfo);
}
```

**責務**: 外部APIとの通信を担当

### 2. データ変換（フォーマット）← 本来の責務

```typescript
static transformToCSVFormat(
  metaInfo: EstatMetaInfoResponse
): TransformedMetadataEntry[] {
  // メタ情報をCSV形式に変換
  const result: TransformedMetadataEntry[] = [];
  // ... 変換ロジック
  return result;
}
```

**責務**: データ構造の変換（本来のフォーマッターの責務）

### 3. バッチ処理のオーケストレーション

```typescript
static async transformBulkMetaInfo(
  statsDataIds: string[],
  options: { batchSize?: number; delayMs?: number } = {}
): Promise<BatchResult> {
  // バッチサイズ管理
  const { batchSize = 10, delayMs = 1000 } = options;

  // 並列処理制御
  for (let i = 0; i < statsDataIds.length; i += batchSize) {
    const batch = statsDataIds.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(...);

    // エラー集約
    // 成功/失敗のカウント

    // レート制限（API制限対応）
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
```

**責務**:
- バッチサイズの管理
- 並列処理の制御
- レート制限の実装
- エラーハンドリングと集約
- 処理結果の統計

### 4. ユーティリティ機能

```typescript
static async transformMetaInfoRange(
  startId: string,
  endId: string,
  options?: { batchSize?: number; delayMs?: number }
): Promise<BatchResult> {
  // ID範囲のバリデーション
  const startNum = parseInt(startId);
  const endNum = parseInt(endId);

  if (isNaN(startNum) || isNaN(endNum)) {
    throw new Error("開始IDと終了IDは数値である必要があります");
  }

  // ID配列の生成
  const statsDataIds: string[] = [];
  for (let i = startNum; i <= endNum; i++) {
    statsDataIds.push(i.toString().padStart(10, "0")); // ゼロパディング
  }

  return this.transformBulkMetaInfo(statsDataIds, options);
}
```

**責務**:
- ID範囲のバリデーション
- ID配列の生成
- ゼロパディングの実装

## SRP違反の証拠: 変更理由が複数存在

このクラスは以下の**異なる理由**で変更される可能性があります：

| # | 変更理由 | 影響範囲 | 例 |
|---|---------|---------|---|
| 1 | データ変換ロジックの変更 | `transformToCSVFormat` | cat01以外のカテゴリも含める |
| 2 | API呼び出し方法の変更 | `getAndTransformMetaInfo` | リトライロジック追加、キャッシュ実装 |
| 3 | バッチ処理戦略の変更 | `transformBulkMetaInfo` | 並列数の動的調整、エラー処理方法の変更 |
| 4 | レート制限アルゴリズムの変更 | `transformBulkMetaInfo` | 指数バックオフ、トークンバケット方式 |
| 5 | ID生成ロジックの変更 | `transformMetaInfoRange` | パディング桁数の変更、フォーマット変更 |

→ **5つの異なる変更理由** = SRP違反の明確な証拠

## Robert C. Martinの定義に照らした評価

> "A class should have only one reason to change."
> （クラスは変更される理由が1つだけであるべき）

現状のクラスは**5つの変更理由**を持っており、明らかにSRPに違反しています。

## 推奨される改善案

責務を以下の**4つのクラス**に分離します。

### アーキテクチャ図

```
┌─────────────────────────────────────────┐
│  EstatMetaInfoFormatter                 │
│  (データ変換のみ)                        │
│  - transformToCSVFormat()               │
└─────────────────────────────────────────┘
                    ▲
                    │ uses
┌─────────────────────────────────────────┐
│  EstatMetaInfoFetcher                   │
│  (API通信)                               │
│  - fetchMetaInfo()                      │
│  - fetchAndTransform()                  │
└─────────────────────────────────────────┘
                    ▲
                    │ uses
┌─────────────────────────────────────────┐
│  EstatMetaInfoBatchProcessor            │
│  (バッチ処理オーケストレーション)        │
│  - processBulk()                        │
│  - processRange()                       │
└─────────────────────────────────────────┘
                    │ uses
                    ▼
┌─────────────────────────────────────────┐
│  EstatIdUtils                           │
│  (ユーティリティ)                        │
│  - generateIdRange()                    │
│  - validateId()                         │
└─────────────────────────────────────────┘
```

### 1. EstatMetaInfoFormatter（データ変換専用）

**責務**: データ構造の変換のみ

```typescript
/**
 * e-STATメタ情報フォーマッター
 * 責務: データ構造の変換のみを担当（純粋関数）
 */
export class EstatMetaInfoFormatter {
  /**
   * メタ情報をCSV形式に変換
   *
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns CSV形式に変換されたメタデータエントリの配列
   * @throws {Error} メタ情報が不足している場合
   */
  static transformToCSVFormat(
    metaInfo: EstatMetaInfoResponse
  ): TransformedMetadataEntry[] {
    console.log("🔵 Formatter: transformToCSVFormat 開始");
    const startTime = Date.now();

    const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
    if (!metaData) {
      throw new Error("メタ情報が見つかりません");
    }

    const tableInfo = metaData.TABLE_INF;
    const classInfo = metaData.CLASS_INF?.CLASS_OBJ;

    if (!tableInfo || !classInfo) {
      throw new Error("必要なメタ情報が不足しています");
    }

    const result: TransformedMetadataEntry[] = [];
    const statsDataId = tableInfo["@id"] || "";
    const statName = tableInfo.STAT_NAME?.$ || "";
    const title = tableInfo.TITLE?.$ || "";

    // カテゴリ情報を取得（cat01のみ）
    const cat01Class = classInfo.find(
      (cls: { "@id": string }) => cls["@id"] === "cat01"
    );
    if (!cat01Class?.CLASS) {
      throw new Error("cat01カテゴリが見つかりません");
    }

    const categories = Array.isArray(cat01Class.CLASS)
      ? cat01Class.CLASS
      : [cat01Class.CLASS];

    console.log(`🔵 Formatter: ${categories.length}個のカテゴリを処理中`);

    // 各カテゴリをCSV行として変換
    categories.forEach(
      (category: {
        "@code"?: string;
        "@name"?: string | undefined;
        "@unit"?: string;
      }) => {
        const itemName = category["@name"] || null;
        result.push({
          stats_data_id: statsDataId,
          stat_name: statName,
          title: title,
          cat01: category["@code"] ?? "",
          item_name: itemName,
          unit: category["@unit"] || null,
        });
      }
    );

    console.log(
      `✅ Formatter: transformToCSVFormat 完了 (${
        Date.now() - startTime
      }ms) - ${result.length}件`
    );
    return result;
  }
}
```

**特徴**:
- 純粋な変換ロジックのみ
- 外部依存なし（estatAPIへの依存を削除）
- テストが容易
- 変更理由は「変換ロジックの変更」のみ

### 2. EstatMetaInfoFetcher（API通信専用）

**責務**: 外部APIとの通信

```typescript
/**
 * e-STATメタ情報取得クラス
 * 責務: API通信とエラーハンドリング
 */
export class EstatMetaInfoFetcher {
  /**
   * APIからメタ情報を取得
   *
   * @param statsDataId - 統計表ID
   * @returns メタ情報のAPIレスポンス
   * @throws {Error} API呼び出しが失敗した場合
   */
  static async fetchMetaInfo(
    statsDataId: string
  ): Promise<EstatMetaInfoResponse> {
    try {
      console.log(`🔵 Fetcher: メタ情報取得開始 - ${statsDataId}`);
      const startTime = Date.now();

      const response = await estatAPI.getMetaInfo({ statsDataId });

      console.log(
        `✅ Fetcher: メタ情報取得完了 (${Date.now() - startTime}ms)`
      );
      return response;
    } catch (error) {
      console.error("❌ Fetcher: メタ情報取得失敗:", error);
      throw new Error(
        `メタ情報の取得に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * メタ情報を取得して変換（便利メソッド）
   *
   * @param statsDataId - 統計表ID
   * @returns 変換されたメタデータエントリの配列
   */
  static async fetchAndTransform(
    statsDataId: string
  ): Promise<TransformedMetadataEntry[]> {
    const response = await this.fetchMetaInfo(statsDataId);
    return EstatMetaInfoFormatter.transformToCSVFormat(response);
  }
}
```

**特徴**:
- API通信に特化
- エラーハンドリングを集約
- リトライロジックやキャッシュを追加しやすい
- 変更理由は「API通信方法の変更」のみ

### 3. EstatMetaInfoBatchProcessor（バッチ処理専用）

**責務**: 複数データの一括処理のオーケストレーション

```typescript
/**
 * バッチ処理結果の型
 */
export interface BatchProcessResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    statsDataId: string;
    success: boolean;
    entriesProcessed: number;
    error?: string;
  }>;
}

/**
 * バッチ処理オプション
 */
export interface BatchProcessOptions {
  batchSize?: number;      // バッチサイズ（デフォルト: 10）
  delayMs?: number;        // バッチ間の待機時間（デフォルト: 1000ms）
  onProgress?: (processed: number, total: number) => void;  // 進捗コールバック
}

/**
 * e-STATメタ情報バッチプロセッサー
 * 責務: 複数データの一括処理とレート制限
 */
export class EstatMetaInfoBatchProcessor {
  /**
   * 複数の統計表IDを一括処理
   *
   * @param statsDataIds - 統計表IDの配列
   * @param options - バッチ処理オプション
   * @returns バッチ処理結果
   */
  static async processBulk(
    statsDataIds: string[],
    options: BatchProcessOptions = {}
  ): Promise<BatchProcessResult> {
    const { batchSize = 10, delayMs = 1000, onProgress } = options;
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    console.log(
      `🔵 BatchProcessor: バッチ処理開始 - 総数: ${statsDataIds.length}`
    );

    // バッチ処理
    for (let i = 0; i < statsDataIds.length; i += batchSize) {
      const batch = statsDataIds.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(statsDataIds.length / batchSize);

      console.log(
        `🔵 BatchProcessor: バッチ ${batchNum}/${totalBatches} 処理中 (${batch.length}件)`
      );

      const batchResults = await Promise.allSettled(
        batch.map(async (id) => {
          const transformedData = await EstatMetaInfoFetcher.fetchAndTransform(id);
          return {
            statsDataId: id,
            success: true,
            entriesProcessed: transformedData.length,
          };
        })
      );

      // 結果を集約
      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
          if (result.value.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } else {
          results.push({
            statsDataId: "unknown",
            success: false,
            entriesProcessed: 0,
            error: result.reason?.message || "Processing failed",
          });
          failureCount++;
        }
      }

      // 進捗報告
      if (onProgress) {
        onProgress(i + batch.length, statsDataIds.length);
      }

      // 次のバッチの前に待機（API制限対応）
      if (i + batchSize < statsDataIds.length && delayMs > 0) {
        console.log(`⏳ BatchProcessor: ${delayMs}ms 待機中...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    console.log(
      `✅ BatchProcessor: バッチ処理完了 - 成功: ${successCount}, 失敗: ${failureCount}`
    );

    return {
      totalProcessed: statsDataIds.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * 統計表IDの範囲を指定して一括処理
   *
   * @param startId - 開始ID
   * @param endId - 終了ID
   * @param options - バッチ処理オプション
   * @returns バッチ処理結果
   */
  static async processRange(
    startId: string,
    endId: string,
    options?: BatchProcessOptions
  ): Promise<BatchProcessResult> {
    const statsDataIds = EstatIdUtils.generateIdRange(startId, endId);

    console.log(
      `🔵 BatchProcessor: 範囲処理 - ${startId} 〜 ${endId} (${statsDataIds.length}件)`
    );

    return this.processBulk(statsDataIds, options);
  }
}
```

**特徴**:
- バッチ処理とレート制限に特化
- 進捗報告機能を追加可能
- エラー集約と統計情報の提供
- 変更理由は「バッチ処理戦略の変更」のみ

### 4. EstatIdUtils（ユーティリティ専用）

**責務**: ID関連のユーティリティ機能

```typescript
/**
 * e-STAT統計表IDユーティリティ
 * 責務: ID関連の汎用的な操作
 */
export class EstatIdUtils {
  /**
   * ID範囲から配列を生成
   *
   * @param startId - 開始ID（例: "0000010101"）
   * @param endId - 終了ID（例: "0000010110"）
   * @returns 統計表IDの配列
   * @throws {Error} IDが無効な場合
   *
   * @example
   * EstatIdUtils.generateIdRange("0000010101", "0000010103")
   * // => ["0000010101", "0000010102", "0000010103"]
   */
  static generateIdRange(startId: string, endId: string): string[] {
    const startNum = parseInt(startId);
    const endNum = parseInt(endId);

    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error("開始IDと終了IDは数値である必要があります");
    }

    if (startNum > endNum) {
      throw new Error("開始IDは終了ID以下である必要があります");
    }

    const ids: string[] = [];
    for (let i = startNum; i <= endNum; i++) {
      ids.push(this.formatId(i));
    }

    return ids;
  }

  /**
   * 数値をe-STAT統計表ID形式にフォーマット
   *
   * @param num - 数値
   * @returns ゼロパディングされたID（10桁）
   *
   * @example
   * EstatIdUtils.formatId(10101)
   * // => "0000010101"
   */
  static formatId(num: number): string {
    return num.toString().padStart(10, "0");
  }

  /**
   * IDの妥当性を検証
   *
   * @param id - 統計表ID
   * @returns 妥当な場合true
   */
  static isValidId(id: string): boolean {
    return /^\d{10}$/.test(id);
  }

  /**
   * IDを正規化（桁数調整）
   *
   * @param id - 統計表ID
   * @returns 正規化されたID
   * @throws {Error} IDが無効な場合
   */
  static normalizeId(id: string): string {
    const num = parseInt(id);
    if (isNaN(num)) {
      throw new Error(`無効なID: ${id}`);
    }
    return this.formatId(num);
  }
}
```

**特徴**:
- ID関連の操作を集約
- 再利用可能なユーティリティ関数
- 単体テストが容易
- 変更理由は「ID仕様の変更」のみ

## 改善後の使用例

### 基本的な使用

```typescript
// 1. 単一IDの処理
const data = await EstatMetaInfoFetcher.fetchAndTransform("0000010101");

// 2. バッチ処理
const result = await EstatMetaInfoBatchProcessor.processBulk(
  ["0000010101", "0000010102", "0000010103"],
  {
    batchSize: 5,
    delayMs: 1000,
    onProgress: (processed, total) => {
      console.log(`進捗: ${processed}/${total}`);
    }
  }
);

// 3. 範囲処理
const rangeResult = await EstatMetaInfoBatchProcessor.processRange(
  "0000010101",
  "0000010110",
  { batchSize: 10, delayMs: 2000 }
);

// 4. フォーマッターを単独で使用（テストなど）
const apiResponse = await estatAPI.getMetaInfo({ statsDataId: "0000010101" });
const formatted = EstatMetaInfoFormatter.transformToCSVFormat(apiResponse);

// 5. IDユーティリティの使用
const ids = EstatIdUtils.generateIdRange("0000010101", "0000010120");
const isValid = EstatIdUtils.isValidId("0000010101");
const normalized = EstatIdUtils.normalizeId("10101");
```

### 高度な使用例

```typescript
// カスタムエラーハンドリング付きバッチ処理
const result = await EstatMetaInfoBatchProcessor.processBulk(
  statsDataIds,
  {
    batchSize: 5,
    delayMs: 1000,
    onProgress: (processed, total) => {
      const percentage = Math.round((processed / total) * 100);
      console.log(`📊 進捗: ${percentage}% (${processed}/${total})`);
    }
  }
);

// 失敗したIDを再処理
const failedIds = result.results
  .filter(r => !r.success)
  .map(r => r.statsDataId);

if (failedIds.length > 0) {
  console.log(`🔄 ${failedIds.length}件を再処理中...`);
  const retryResult = await EstatMetaInfoBatchProcessor.processBulk(
    failedIds,
    { batchSize: 1, delayMs: 2000 }
  );
}
```

## 改善のメリット

### 1. 保守性の向上

| 改善前 | 改善後 |
|-------|-------|
| 1つのクラスに4つの責務 | 4つのクラスに責務を分離 |
| 変更の影響範囲が不明確 | 変更の影響範囲が明確 |
| 1ファイル212行 | 各ファイル50-100行程度 |

### 2. テストのしやすさ

**改善前**:
```typescript
// API呼び出しをモックしないと変換ロジックをテストできない
test('transformToCSVFormat', async () => {
  // estatAPI.getMetaInfo をモック化する必要がある
});
```

**改善後**:
```typescript
// 純粋な変換ロジックを単独でテスト可能
test('transformToCSVFormat', () => {
  const mockResponse = createMockResponse();
  const result = EstatMetaInfoFormatter.transformToCSVFormat(mockResponse);
  expect(result).toEqual(expectedData);
});

// 他のクラスも個別にテスト可能
test('generateIdRange', () => {
  const ids = EstatIdUtils.generateIdRange("0000010101", "0000010103");
  expect(ids).toEqual(["0000010101", "0000010102", "0000010103"]);
});
```

### 3. 再利用性の向上

各コンポーネントを独立して利用可能：

```typescript
// フォーマッターだけを使用
import { EstatMetaInfoFormatter } from './formatter';

// バッチプロセッサーだけを使用
import { EstatMetaInfoBatchProcessor } from './batch-processor';

// IDユーティリティだけを使用
import { EstatIdUtils } from './id-utils';
```

### 4. 理解しやすさ

クラス名から責務が明確：

- `EstatMetaInfoFormatter` → データ変換
- `EstatMetaInfoFetcher` → API通信
- `EstatMetaInfoBatchProcessor` → バッチ処理
- `EstatIdUtils` → ID操作

## 移行計画

### Phase 1: 新しいクラスの作成

```
src/lib/estat-api/formatters/
├── metainfo-formatter.ts           # 既存（維持）
├── metainfo/                       # 新規ディレクトリ
│   ├── formatter.ts                # EstatMetaInfoFormatter
│   ├── fetcher.ts                  # EstatMetaInfoFetcher
│   ├── batch-processor.ts          # EstatMetaInfoBatchProcessor
│   ├── id-utils.ts                 # EstatIdUtils
│   └── index.ts                    # エクスポート
```

### Phase 2: 既存コードの移行

1. 新しいクラスを実装
2. 既存クラスを新しいクラスを使用するように変更（ラッパーとして機能）
3. 既存の使用箇所を段階的に移行
4. 既存クラスを非推奨（@deprecated）としてマーク

### Phase 3: クリーンアップ

1. すべての使用箇所の移行完了を確認
2. 既存クラスを削除

## まとめ

### 改善前（SRP違反）

```
EstatMetaInfoFormatter
├── データ変換
├── API通信
├── バッチ処理
└── ID生成
    → 4つの責務 = SRP違反
```

### 改善後（SRP準拠）

```
EstatMetaInfoFormatter     → データ変換のみ
EstatMetaInfoFetcher       → API通信のみ
EstatMetaInfoBatchProcessor → バッチ処理のみ
EstatIdUtils               → ID操作のみ
    → 各クラス1つの責務 = SRP準拠
```

### 期待される効果

1. ✅ **保守性**: 変更の影響範囲が明確に
2. ✅ **テスト性**: 各機能を個別にテスト可能
3. ✅ **再利用性**: 必要な機能だけをインポート可能
4. ✅ **理解性**: クラス名から責務が明確
5. ✅ **拡張性**: 新機能の追加が容易

この改善により、コードベースの品質が大幅に向上します。
